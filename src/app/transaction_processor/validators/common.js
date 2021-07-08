const {
  getUserAddress,
  getTransactionAddress,
  getRawState,
} = require("../controllers/common");
const { TYPE } = require("../utils/constants");
const { ERRORS } = require("../utils/errors");
const { logFormatted, SEVERITY } = require("../utils/logger");
/**
 * Validates if a object exists in the blockchain.
 *
 * @param {String} type - Type of object, @see TYPE
 * @param {String} txid - Transaction unique identification (before calculated address)
 * @param {Boolean} shouldExist - Represents if the object should or should not exist, used to manage error.
 * @param {Request} req - Express.js request object.
 * @param {Response} res - Express.js response object.
 * @returns {Promise} Promise rejection if:
 *   The type was missing
 *   The object exists and it should not exist
 *   The object does not exist and should exist
 *  Otherwise resolves the obj.
 */
const validateObjExistence = (context, type, txid, shouldExist) => {
  let getAddress;
  txid = (txid + "").trim();
  switch (type) {
    case TYPE.TRANSACTION:
      getAddress = getTransactionAddress;
      break;
    case TYPE.USER:
      getAddress = getUserAddress;
      break;
  }
  return getRawState(context, getAddress(txid), 5000)
    .then((existingObj) => {
      existingObj =
        existingObj !== null
          ? JSON.parse(Buffer.from(existingObj, "utf8").toString())
          : existingObj;
      const expectedToExist = shouldExist && existingObj === null;
      const notExpectedToExist = !shouldExist && existingObj !== null;
      if (expectedToExist || notExpectedToExist) {
        const errorMsg = `${type.toProperCase()} with address {${txid}} ${
          expectedToExist ? "does not" : "already"
        } exist${expectedToExist ? "" : "s"}`;
        logFormatted(errorMsg, SEVERITY.ERROR);
        let errorObj;
        switch (type) {
          case TYPE.TRANSACTION:
            if (expectedToExist)
              errorObj = ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST;
            else if (notExpectedToExist)
              errorObj = ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS;
            break;
          case TYPE.USER:
            if (expectedToExist)
              errorObj = ERRORS.USER.INPUT.USER_DOES_NOT_EXIST;
            else if (notExpectedToExist)
              errorObj = ERRORS.USER.INPUT.USER_EXISTS;
            break;
        }
        return Promise.reject(errorObj);
      }

      return Promise.resolve(existingObj);
    })
    .catch((err) => {
      console.log("Catched rejection from getRawState", err);
      return Promise.reject(err);
    });
};

module.exports.validateObjExistence = validateObjExistence;
