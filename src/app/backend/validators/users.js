const { body } = require("express-validator");
const _ = require("lodash");
const { findByAddress } = require("../controllers/common");
const {
  validate,
  validateAssetExistence,
  createError,
  createErrorObj,
} = require("./common");
const { TYPE } = require("../utils/constants");
const { ERRORS } = require("../utils/errors");

const validateExistingUser = (
  req,
  res,
  next,
  address,
  shouldExist,
  { location = "body" } = null
) => {
  return validateAssetExistence(TYPE.USER, address, shouldExist, req, res, {
    location,
  })
    .then(() => {
      next();
    })
    .catch((callback) => {
      return callback();
    });
};
/**
 * Verifies if a user's request body is valid.
 * Conditions:
 *    address must be a non-empty String
 *    public_key must be a non-empty String
 *    signature must be a non-empty String
 *
 * @post Sanitizes and allows the transaction to continue if the request body is valid, denies the request otherwise.
 */
const inputValidation = validate([
  body("address")
    .trim()
    .not()
    .isEmpty()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT,
        params: {
          param: "address",
          value,
        },
      })
    )
    .bail(),
  body("public_key")
    .trim()
    .not()
    .isEmpty()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT,
        params: {
          param: "public_key",
          value,
        },
      })
    )
    .bail(),
  body("public_key").custom((value, { req }) => {
    //public key stored in 264 bits (66 hex digits)
    if (value.length !== 66)
      return Promise.reject(
        createErrorObj(req, {
          error: ERRORS.USER.INPUT.INCORRECT_INPUT,
          params: {
            propertyName: "public_key",
            value,
            param: "public_key",
          },
        })
      );
    return true;
  }),
  body("description").optional({ checkFalsy: true, checkNull: true }).trim(),
  body("role").optional({ checkFalsy: true, checkNull: true }).trim(),
  body("balance").customSanitizer(() => 0),
  body("latest_transactions").customSanitizer(() => []),
  body("pending_transactions").customSanitizer(() => []),
]);

const validateUserReturnTo = (req, res, next) => {
  if (req.body.return_to) {
    const promises = [];
    if (typeof req.body.return_to === "object") {
      for (const key in req.body.return_to) {
        if (Object.hasOwnProperty.call(req.body.return_to, key)) {
          const value = req.body.return_to[key];
          if (typeof value === "string") {
            promises.push(
              validateAssetExistence(TYPE.USER, value, true, req, res, {
                location: "body",
                param: "return_to",
              })
            );
          } else {
            return createError(req, res, {
              error: ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,
              params: {
                value: req.body.return_to,
                propertyName: "return_to",
                param: `return_to`,
                expectedType: "string",
                receivedType: typeof value,
              },
            });
          }
        }
      }
      return Promise.all(promises)
        .then(() => next())
        .catch((callback) => {
          callback();
        });
    } else {
      return createError(req, res, {
        error: ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,
        params: {
          value: req.body.return_to,
          param: "return_to",
          expectedType: "object",
          receivedType: typeof req.body.return_to,
        },
      });
    }
  }
  return next();
};

const validateUserPermissions = (req, res, next) => {
  const permissions = req.body.permissions;
  if (permissions && typeof permissions === "object") {
    for (const key_permission in permissions) {
      if (Object.hasOwnProperty.call(permissions, key_permission)) {
        const value = permissions[key_permission];
        if (typeof value === "object" && key_permission !== "coinbase") {
          for (const nested_key in value) {
            if (Object.hasOwnProperty.call(value, nested_key)) {
              const nested_value = value[nested_key];
              if (typeof nested_value !== "boolean") {
                return createError(req, res, {
                  error: ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,
                  params: {
                    expectedType: "boolean",
                    receivedType: typeof nested_value,
                    propertyName: "permissions",
                    param: "permissions",
                    value: req.body.permissions,
                  },
                });
              }
            }
          }
        } else if (typeof value !== "boolean") {
          return createError(req, res, {
            error: ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,
            params: {
              expectedType: "boolean",
              receivedType: typeof value,
              propertyName: "permissions",
              param: "permissions",
              value: req.body.permissions,
            },
          });
        }
      }
    }
  } else if (permissions && typeof permissions !== "object") {
    return createError(req, res, {
      error: ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,
      params: {
        expectedType: "object",
        receivedType: typeof permissions,
        propertyName: "permissions",
        param: "permissions",
        value: req.body.permissions,
      },
    });
  }
  return next();
};

const validateDeleteReason = (req, res, next) => {
  const reason = req.body.reason;
  if (reason && typeof reason === "string") {
    return findByAddress(TYPE.USER, req.params.address, false, false, res).then(
      (user) => {
        if (_.isEmpty(user.return_to))
          return createError(req, res, {
            error: ERRORS.USER.LOGIC.NO_RETURN_TO_ADDRESSES,
            params: {
              address: req.params.address,
              param: "reason",
              value: reason,
            },
          });
        else {
          if (!user.return_to[reason]) {
            return createError(req, res, {
              error: ERRORS.USER.INPUT.UNDEFINED_RETURN_TO_REASON,
              params: {
                address: req.params.address,
                param: "reason",
                value: reason,
                reason,
              },
            });
          } else {
            return findByAddress(
              TYPE.USER,
              user.return_to[reason],
              false,
              false,
              res
            ).then((returnToUser) => {
              if (returnToUser.active !== true) {
                return createError(req, res, {
                  error: ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE,
                  params: {
                    address: user.return_to[reason],
                    param: "reason",
                    value: user.return_to[reason],
                  },
                });
              } else return next();
            });
          }
        }
      }
    );
  } else if (reason && typeof reason !== "string") {
    return createError(req, res, {
      error: ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,
      params: {
        expectedType: "string",
        receivedType: typeof reason,
        propertyName: "reason",
        param: "reason",
        value: req.body.reason,
      },
    });
  } else
    return createError(req, res, {
      error: ERRORS.USER.INPUT.NO_INPUT,
      params: {
        property: "reason",
        param: "reason",
        value: req.body.reason,
      },
      location: "body",
    });
};

/**
 * Validation chain of a user creation
 */
const validateUserCreation = [
  inputValidation,
  validateUserPermissions,
  validateUserReturnTo,
  (req, res, next) =>
    validateExistingUser(req, res, next, req.body.address, false, {
      location: "body",
    }),
];

const validateUserRetrieval = [
  (req, res, next) =>
    validateExistingUser(req, res, next, req.params.address, true, {
      location: "params",
    }),
];

const validateUserUpdate = [
  (req, res, next) =>
    validateExistingUser(req, res, next, req.params.address, true, {
      location: "params",
    }),
  validateUserPermissions,
  validateUserReturnTo,
];

const validateUserDelete = [
  (req, res, next) =>
    validateExistingUser(req, res, next, req.params.address, true, {
      location: "params",
    }),
  validateDeleteReason,
];

module.exports.validateUserCreation = validateUserCreation;

module.exports.validateUserRetrieval = validateUserRetrieval;

module.exports.validateUserUpdate = validateUserUpdate;

module.exports.validateUserDelete = validateUserDelete;
