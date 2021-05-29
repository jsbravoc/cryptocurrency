const { validationResult } = require("express-validator");
const { findByAddress } = require("../controllers/common");
const { TYPE } = require("../utils/constants");
const { ERRORS } = require("../utils/errors");
const { SEVERITY, logFormatted } = require("../utils/logger");

/**
 * Validates an array of validations using express-validator.
 *
 * @param {Array} validations - Array of validation Promises.
 * @return {Function} Next callback if there was not any validation errors, void otherwise (response object will contain the validation errors).
 */
const validate = (validations) => (req, res, next) => {
  return Promise.all(validations.map((validation) => validation.run(req))).then(
    () => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      const arrayOfErrors = [];

      //Use custom error object
      (errors.array() || []).forEach(
        (error) => error.msg && arrayOfErrors.push(error.msg)
      );

      res.status(400).json({
        errors: arrayOfErrors.length > 0 ? arrayOfErrors : errors.array(),
      });
    }
  );
};

const createErrorObj = (
  req,
  { error, location, params, noLocation = false }
) => {
  const errorObj = {};
  if (error.errorCode) errorObj.errorCode = error.errorCode;
  if (params && params.param) params.parameter = params.param;
  if (error.error) errorObj.error = error.error(req, params);
  if (error.msg) errorObj.msg = error.msg(req, params);
  if (noLocation !== true) errorObj.location = location || "body";
  if (params && params.param) errorObj.param = params.param;
  if (params && params.value) errorObj.value = params.value;
  logFormatted(
    `Validation error with code ${errorObj.errorCode} - ${errorObj.error}`,
    SEVERITY.WARN
  );
  return { ...errorObj };
};

const createError = (
  req,
  res,
  { error, location, params, statusCode = 400, noLocation = false }
) => {
  const errorObj = createErrorObj(req, { error, location, params, noLocation });
  return res.status(statusCode).json({ errors: [{ ...errorObj }] });
};

/**
 * Validates if a asset exists in the blockchain.
 *
 * @param {String} type - Type of asset, @see TYPE
 * @param {String} txid - Asset unique identification (before calculated address)
 * @param {Boolean} shouldExist - Represents if the asset should or should not exist, used to manage error.
 * @param {Request} req - Express.js request object.
 * @param {Response} res - Express.js response object.
 * @return {Promise} Promise rejection if:
 *   The type was missing
 *   The asset exists and it should not exist
 *   The asset does not exist and should exist
 *  Otherwise resolves the obj.
 */
const validateAssetExistence = (
  type,
  txid,
  shouldExist,
  req,
  res,
  { location = null, param = null } = {}
) => {
  let errorType;
  let identifier;
  txid = (txid + "").trim();
  switch (type) {
    case TYPE.TRANSACTION:
      errorType = ERRORS.TRANSACTION;
      identifier = "signature";
      break;
    case TYPE.USER:
      errorType = ERRORS.USER;
      identifier = "address";
      break;
  }
  if (txid && txid !== "") {
    return findByAddress(type, txid, false, false, res)
      .then((existingAsset) => {
        const expectedToExist = shouldExist && existingAsset === null;
        const notExpectedToExist = !shouldExist && existingAsset !== null;
        if (expectedToExist || notExpectedToExist) {
          const errorMsg = `${type.toProperCase()} with address {${txid}} ${
            expectedToExist ? "does not" : "already"
          } exist${expectedToExist ? "" : "s"}`;
          logFormatted(errorMsg, SEVERITY.ERROR);
          //      return Promise.reject(errorMsg);
          let errorObj;
          switch (type) {
            case TYPE.TRANSACTION:
              if (expectedToExist)
                errorObj = {
                  error: ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST,
                  location: location || "params",
                  params: {
                    signature: txid,
                    param: param || "address",
                    value: txid,
                  },
                };
              else if (notExpectedToExist)
                errorObj = {
                  error: ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS,
                  location: location || "body",
                  params: {
                    signature: txid,
                    param: param || "signature",
                    value: txid,
                  },
                };
              break;
            case TYPE.USER:
              if (expectedToExist)
                errorObj = {
                  error: ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,
                  location: location || "query",
                  params: {
                    address: txid,
                    param: param || "address",
                    value: txid,
                  },
                };
              else if (notExpectedToExist)
                errorObj = {
                  error: ERRORS.USER.INPUT.USER_EXISTS,
                  location: location || "body",
                  params: {
                    address: txid,
                    param: param || "address",
                    value: txid,
                  },
                };
              break;
          }
          return Promise.reject({ callback: createError(req, res, errorObj) });
        }
        const obj = {};
        obj[type] = existingAsset;
        return Promise.resolve(obj);
      })
      .catch((err) => {
        if (!err.callback) {
          return Promise.reject(() =>
            createError(req, res, {
              error: ERRORS.SAWTOOTH.UNAVAILABLE,
              statusCode: 503,
              noLocation: true,
            })
          );
        } else return Promise.reject(() => err.callback());
      });
  } else
    return Promise.reject(() =>
      createError(req, res, {
        error: errorType.INPUT.NO_INPUT,
        location: location,
        params: {
          property: identifier,
          param: identifier,
          value: null,
        },
      })
    );
};

module.exports.validateAssetExistence = validateAssetExistence;
module.exports.validate = validate;
module.exports.createError = createError;
module.exports.createErrorObj = createErrorObj;
