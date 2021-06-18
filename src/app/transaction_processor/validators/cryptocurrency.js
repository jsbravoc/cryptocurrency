//const { body } = require("express-validator");
const validator = require("validator");
const { hash512 } = require("../controllers/common");
const { TYPE } = require("../utils/constants");
const { ERRORS } = require("../utils/errors");
const { MAXIMUM_FLOAT_PRECISION } = require("../utils/constants");
const { validateAssetExistence } = require("./common");
/**
 * Creates a collision-free signature for a transaction.
 *
 * @param {String} signature - Signature of the transaction.
 * @param {Date} [creationDate]  - Transaction's creation date.
 * @return {String} New signature that avoids collisions.
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
const inputValidation = (asset) => {
  let sanitizedAsset = asset;
  console.log("SANITIZING asset: ", asset);
  if (asset.recipient === undefined || validator.isEmpty(`${asset.recipient}`))
    throw Error("Transaction format error: missing a recipient");
  else sanitizedAsset.recipient = asset.recipient.trim();

  if (
    asset.amount === undefined ||
    validator.isEmpty(`${asset.amount}`) ||
    !validator.isFloat(`${asset.amount}`, { gt: 0 })
  )
    throw Error("Transaction format error: missing a valid amount");
  else
    sanitizedAsset.amount = Number(
      validator.toFloat(`${asset.amount}`).toFixed(MAXIMUM_FLOAT_PRECISION)
    );

  if (asset.signature === undefined || validator.isEmpty(`${asset.signature}`))
    throw Error("Transaction format error: missing a signature");
  else sanitizedAsset.signature = asset.signature.trim();
  if (asset.address === undefined || validator.isEmpty(`${asset.address}`))
    throw Error("Transaction format error: missing an address");
  else sanitizedAsset.address = asset.address.trim();

  if (asset.sender !== undefined && !validator.isEmpty(`${asset.sender}`))
    sanitizedAsset.sender = asset.sender.trim();

  if (
    asset.valid_thru !== undefined &&
    !validator.isEmpty(`${asset.valid_thru}`) &&
    !validator.isISO8601(`${asset.valid_thru}`)
  )
    throw Error(
      "Transaction format error: valid_thru date format is not ISO 8601"
    );
  else if (asset.valid_thru !== undefined) {
    sanitizedAsset.valid_thru = validator.toDate(`${asset.valid_thru}`);
  }
  if (
    asset.creationDate !== undefined &&
    !validator.isEmpty(`${asset.creationDate}`) &&
    !validator.isISO8601(`${asset.creationDate}`)
  )
    throw Error(
      "Transaction format error: creationDate date format is not ISO 8601"
    );
  else if (asset.creationDate !== undefined) {
    sanitizedAsset.creationDate = validator.toDate(`${asset.creationDate}`);
  }
  if (
    asset.pending !== undefined &&
    !validator.isEmpty(`${asset.pending}`) &&
    !validator.isBoolean(`${asset.pending}`)
  )
    throw Error("Transaction format error: pending is not boolean");
  else {
    sanitizedAsset.valid =
      asset.pending === undefined || validator.isEmpty(`${asset.pending}`)
        ? true
        : !validator.toBoolean(`${asset.pending}`);
  }
  return sanitizedAsset;
};

const postValidationChain = (context, asset) => {
  return new Promise((resolve, reject) => {
    let sanitizedAsset;
    try {
      sanitizedAsset = inputValidation(asset);
      resolve(sanitizedAsset);
    } catch (error) {
      reject(error);
    }
  }).then((sanitizedAsset) => {
    let validateAssets = [
      validateAssetExistence(
        context,
        TYPE.TRANSACTION,
        sanitizedAsset.address,
        false
      ),
      validateAssetExistence(
        context,
        TYPE.USER,
        sanitizedAsset.recipient,
        true
      ),
    ];
    if (sanitizedAsset.sender)
      validateAssets.push(
        validateAssetExistence(context, TYPE.USER, sanitizedAsset.sender, true)
      );
    //Note that this are the same validations as in backend/validators/cryptocurrency.js
    return Promise.all(validateAssets)
      .then(([, recipientUser, senderUser]) => {
        if (recipientUser.active === false) {
          return Promise.reject("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE");
        } else if (senderUser) {
          if (senderUser.active === false) {
            return Promise.reject("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE");
          } else if (
            senderUser.permissions &&
            senderUser.permissions.transfer_to &&
            senderUser.permissions.transfer_to[sanitizedAsset.recipient] ===
              false
          ) {
            return Promise.reject(
              "ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS"
            );
          }
          if (senderUser.balance < sanitizedAsset.amount)
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
            sanitizedAsset.valid === true &&
            (!sanitizedAsset.supporting_transactions ||
              !Array.isArray(sanitizedAsset.supporting_transactions) ||
              sanitizedAsset.supporting_transactions.length === 0)
          )
            return Promise.reject(
              "ERRORS.TRANSACTION.INPUT.NO_SUPPORTING_TRANSACTIONS"
            );
          if (
            Array.isArray(sanitizedAsset.supporting_transactions) &&
            sanitizedAsset.supporting_transactions.length > 0
          ) {
            const validatedTxOrigin = [];
            sanitizedAsset.supporting_transactions.forEach((tx) => {
              validatedTxOrigin.push(
                validateAssetExistence(
                  context,
                  TYPE.TRANSACTION,
                  tx,
                  true
                ).then((transaction) => {
                  if (transaction.recipient !== senderUser.address) {
                    return Promise.reject(
                      "ERRORS.TRANSACTION.LOGIC.TRANSACTION_OWNERSHIP_MISMATCH"
                    );
                  }
                  return transaction;
                })
              );
            });
            return Promise.all(validatedTxOrigin)
              .then((supportingTransactions) => {
                let amountToFulfill = sanitizedAsset.amount;
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
