//const { body } = require("express-validator");
const validator = require("validator");
const { hash512 } = require("../controllers/common");
const { TYPE } = require("../utils/constants");
const { ERRORS } = require("../utils/errors");
const { MAXIMUM_FLOAT_PRECISION } = require("../utils/constants");
const { validateObjExistence } = require("./common");
/**
 * Creates a collision-free signature for a transaction.
 *
 * @param {String} signature - Signature of the transaction.
 * @param {Date} [creationDate]  - Transaction's creation date.
 * @returns {String} New signature that avoids collisions.
 */
const createSignature = (signature, creationDate = new Date()) =>
  hash512(`${signature}${creationDate.getTime()}`);
/**
 * Verifies if a transaction's request body is valid.
 * Conditions:
 * *  recipient must be a non-empty String
 * *  amount must be a float number greater than zero
 * *  signature must be a non-empty String
 * *  valid must be false if transaction is pending
 * *  valid must be a boolean
 * *  pending must be a boolean
 *
 * @post Sanitizes and allows the request to continue if the request body is valid, denies the request otherwise.
 */
const inputValidation = (obj) => {
  let sanitizedObj = obj;
  if (obj.recipient === undefined || validator.isEmpty(`${obj.recipient}`))
    throw Error("Transaction format error: missing a recipient");
  else sanitizedObj.recipient = obj.recipient.trim();

  if (
    obj.amount === undefined ||
    validator.isEmpty(`${obj.amount}`) ||
    !validator.isFloat(`${obj.amount}`, { gt: 0 })
  )
    throw Error("Transaction format error: missing a valid amount");
  else
    sanitizedObj.amount = Number(
      validator.toFloat(`${obj.amount}`).toFixed(MAXIMUM_FLOAT_PRECISION)
    );

  if (obj.signature === undefined || validator.isEmpty(`${obj.signature}`))
    throw Error("Transaction format error: missing a signature");
  else sanitizedObj.signature = obj.signature.trim();
  if (obj.address === undefined || validator.isEmpty(`${obj.address}`))
    throw Error("Transaction format error: missing an address");
  else sanitizedObj.address = obj.address.trim();

  if (obj.sender !== undefined && !validator.isEmpty(`${obj.sender}`))
    sanitizedObj.sender = obj.sender.trim();

  if (
    obj.valid_thru !== undefined &&
    !validator.isEmpty(`${obj.valid_thru}`) &&
    !validator.isISO8601(`${obj.valid_thru}`)
  )
    throw Error(
      "Transaction format error: valid_thru date format is not ISO 8601"
    );
  else if (obj.valid_thru !== undefined) {
    sanitizedObj.valid_thru = validator.toDate(`${obj.valid_thru}`);
  }
  if (
    obj.creationDate !== undefined &&
    !validator.isEmpty(`${obj.creationDate}`) &&
    !validator.isISO8601(`${obj.creationDate}`)
  )
    throw Error(
      "Transaction format error: creationDate date format is not ISO 8601"
    );
  else if (obj.creationDate !== undefined) {
    sanitizedObj.creationDate = validator.toDate(`${obj.creationDate}`);
  }
  if (
    sanitizedObj.valid_thru &&
    sanitizedObj.creationDate > sanitizedObj.valid_thru
  ) {
    throw Error(
      `Transaction format error: valid_thru date is before creationDate`
    );
  }
  if (
    obj.pending !== undefined &&
    !validator.isEmpty(`${obj.pending}`) &&
    !validator.isBoolean(`${obj.pending}`)
  )
    throw Error("Transaction format error: pending is not boolean");
  else {
    sanitizedObj.valid =
      obj.pending === undefined || validator.isEmpty(`${obj.pending}`)
        ? true
        : !validator.toBoolean(`${obj.pending}`);
  }
  return sanitizedObj;
};

const postValidationChain = (context, obj) => {
  return new Promise((resolve, reject) => {
    let sanitizedObj;
    try {
      sanitizedObj = inputValidation(obj);
      resolve(sanitizedObj);
    } catch (error) {
      reject(error);
    }
  }).then((sanitizedObj) => {
    let validatedObjs = [
      validateObjExistence(
        context,
        TYPE.TRANSACTION,
        sanitizedObj.address,
        false
      ),
      validateObjExistence(context, TYPE.USER, sanitizedObj.recipient, true),
    ];
    if (sanitizedObj.sender)
      validatedObjs.push(
        validateObjExistence(context, TYPE.USER, sanitizedObj.sender, true)
      );
    //Note that this are the same validations as in backend/validators/cryptocurrency.js
    return Promise.all(validatedObjs)
      .then(([, recipientUser, senderUser]) => {
        if (recipientUser.active === false) {
          return Promise.reject("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE");
        } else if (senderUser) {
          if (senderUser.active === false) {
            return Promise.reject("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE");
          } else if (
            senderUser.permissions &&
            senderUser.permissions.transfer_to &&
            senderUser.permissions.transfer_to[sanitizedObj.recipient] === false
          ) {
            return Promise.reject(
              "ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS"
            );
          }
          if (senderUser.balance < sanitizedObj.amount)
            return Promise.reject("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS");
          if (
            !Array.isArray(senderUser.latest_transactions) ||
            senderUser.latest_transactions.length === 0
          )
            return Promise.reject("ERRORS.USER.INPUT.NO_TRANSACTIONS");

          /**
           * The following validations are TP specific.
           * The backend API resolved the transaction request into a full (Sawtooth-wise) transaction, thus the full transaction can (and must)
           * be validated by the TP.
           */
          if (
            sanitizedObj.valid === true &&
            (!sanitizedObj.supporting_transactions ||
              !Array.isArray(sanitizedObj.supporting_transactions) ||
              sanitizedObj.supporting_transactions.length === 0)
          )
            return Promise.reject(
              "ERRORS.TRANSACTION.INPUT.NO_SUPPORTING_TRANSACTIONS"
            );
          if (
            Array.isArray(sanitizedObj.supporting_transactions) &&
            sanitizedObj.supporting_transactions.length > 0
          ) {
            const validatedTxOrigin = [];
            sanitizedObj.supporting_transactions.forEach((tx) => {
              validatedTxOrigin.push(
                validateObjExistence(context, TYPE.TRANSACTION, tx, true).then(
                  (transaction) => {
                    if (transaction.recipient !== senderUser.address) {
                      return Promise.reject(
                        "ERRORS.TRANSACTION.LOGIC.TRANSACTION_OWNERSHIP_MISMATCH"
                      );
                    }
                    return transaction;
                  }
                )
              );
            });
            return Promise.all(validatedTxOrigin)
              .then((supportingTransactions) => {
                let amountToFulfill = sanitizedObj.amount;
                supportingTransactions.forEach((tx) => {
                  amountToFulfill -= tx.amount;
                });
                if (amountToFulfill > 0) {
                  return Promise.reject(
                    "ERRORS.TRANSACTION.LOGIC.INSUFFICIENT_SUPPORTING_TRANSACTIONS"
                  );
                }
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }
        } else if (
          recipientUser &&
          recipientUser.permissions &&
          recipientUser.permissions.coinbase !== true
        ) {
          return Promise.reject(
            "ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS"
          );
        }
      })
      .catch((err) => {
        console.log("Catched error: ", err);
        return Promise.reject(err);
      });
  });
};

module.exports.inputValidation = inputValidation;
module.exports.postValidationChain = postValidationChain;
