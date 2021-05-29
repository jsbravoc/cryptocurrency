const { body } = require("express-validator");
const { TYPE } = require("../utils/constants");
const { ERRORS } = require("../utils/errors");
const {
  validate,
  createError,
  validateAssetExistence,
  createErrorObj,
} = require("./common");
const { findByAddress } = require("../controllers/common");
const Transaction = require("../models/Transaction");
const { MAXIMUM_FLOAT_PRECISION } = require("../utils/constants");
const { getPublicKey } = require("../utils/signature");
const { createSignature } = require("../controllers/cryptocurrency");
/**
 * Verifies if a transaction's request body is valid.
 * Conditions:
 *    recipient must be a non-empty String
 *    amount must be a float number greater than zero
 *    signature must be a non-empty String
 *    valid must be false if transaction is pending
 *    valid must be a boolean
 * *  pending must be a boolean
 *
 * @post Sanitizes and Allows the request to continue if the request body is valid, denies the request otherwise.
 */
const inputValidation = validate([
  body("recipient")
    .notEmpty()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,
        params: {
          propertyName: "recipient",
          value,
          param: "recipient",
        },
      })
    )
    .trim()
    .bail(),
  body("amount")
    .notEmpty()
    .isFloat({ gt: 0 })
    .toFloat()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,
        params: {
          propertyName: "amount",
          value,
          param: "amount",
        },
      })
    )
    .bail(),
  body("amount").customSanitizer((value) => {
    if (value) {
      return Number(value.toFixed(MAXIMUM_FLOAT_PRECISION));
    }
  }),
  body("signature")
    .notEmpty()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,
        params: {
          propertyName: "signature",
          value,
          param: "signature",
        },
      })
    )
    .trim()
    .bail(),
  body("sender").optional({ checkFalsy: true, checkNull: true }).trim(),
  body("valid_thru")
    .optional({ checkFalsy: true, checkNull: true })
    .isISO8601()
    .toDate()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,
        params: {
          propertyName: "valid_thru",
          value,
          param: "valid_thru",
        },
      })
    )
    .bail(),
  body("creationDate")
    .optional({ checkFalsy: true, checkNull: true })
    .isISO8601()
    .toDate()
    .withMessage((value, { req }) =>
      createErrorObj(req, {
        error: ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,
        params: {
          propertyName: "creationDate",
          value,
          param: "creationDate",
        },
      })
    )
    .bail(),
  body("supporting_transactions").customSanitizer(() => undefined),
  body("valid_thru").custom((value, { req }) => {
    if (value && new Date(value) < new Date())
      return Promise.reject(
        createErrorObj(req, {
          error: ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,
          params: {
            propertyName: "valid_thru",
            value,
            param: "valid_thru",
          },
        })
      );
    return true;
  }),
  body("valid").customSanitizer((value, { req }) => {
    if (
      req.body.pending !== null &&
      req.body.pending !== undefined &&
      (req.body.pending === true || req.body.pending === "true")
    ) {
      return false;
    }
    return value;
  }),
  body("pending").optional({ checkNull: true }).toBoolean(),
  body("valid").optional({ checkNull: true }).toBoolean(),
]);

/**
 * Verifies if a transaction already exists.
 *
 * @post Allows the request to continue if the transaction exists, denies the request otherwise.
 */
const validateExistingTransaction = (
  req,
  res,
  next,
  address,
  shouldExist,
  { location = "body" } = null
) => {
  return validateAssetExistence(
    TYPE.TRANSACTION,
    address,
    shouldExist,
    req,
    res,
    {
      location,
    }
  )
    .then(() => {
      next();
    })
    .catch((callback) => {
      return callback();
    });
};

const verifyPostTransaction = (req, res, next) => {
  const promises = [
    findByAddress(TYPE.USER, req.body.recipient, false, false, res),
  ];
  if (req.body.sender) {
    promises.push(findByAddress(TYPE.USER, req.body.sender, false, false, res));
  }
  return Promise.all(promises).then(([recipientUser, senderUser]) => {
    if (!recipientUser) {
      return createError(req, res, {
        error: ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,
        params: {
          address: req.body.recipient,
          param: "recipient",
          value: req.body.recipient,
        },
      });
    } else if (recipientUser && recipientUser.active === false) {
      return createError(req, res, {
        error: ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE,
        params: {
          address: recipientUser.address,
          param: "recipient",
          value: req.body.recipient,
        },
      });
    } else if (req.body.sender && !senderUser) {
      return createError(req, res, {
        error: ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,
        params: {
          address: req.body.sender,
          param: "sender",
          value: req.body.sender,
        },
      });
    } else if (senderUser && senderUser.active === false) {
      return createError(req, res, {
        error: ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE,
        params: {
          address: senderUser.address,
          param: "sender",
          value: senderUser.address,
        },
      });
    } else if (senderUser) {
      if (
        senderUser.permissions &&
        senderUser.permissions.transfer_to &&
        senderUser.permissions.transfer_to[req.body.recipient] === false
      ) {
        return createError(req, res, {
          error: ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS,
          params: {
            address: req.body.sender,
            recipient: req.body.recipient,
            param: "sender",
            value: req.body.sender,
          },
        });
      }
      if (senderUser.balance < req.body.amount) {
        return createError(req, res, {
          error: ERRORS.USER.INPUT.INSUFFICIENT_FUNDS,
          params: {
            address: req.body.sender,
            param: "amount",
            value: req.body.sender,
          },
        });
      } /*
        This cannot happen. Check utils/errors/index
         else if (
          !Array.isArray(senderUser.latest_transactions) ||
          senderUser.latest_transactions.length === 0
        ) {
          return createError(req, res, {
            error: ERRORS.USER.INPUT.NO_TRANSACTIONS,
            params: {
              address: req.body.sender,
              param: "sender",
              value: req.body.sender,
            },
          });
        } */ else {
        let amountToFulfill = req.body.amount;
        let actualBalance = 0;
        let returnedError = false;
        const lastestTxPromises = [];
        (senderUser.latest_transactions || []).forEach((txid) => {
          lastestTxPromises.push(
            findByAddress(TYPE.TRANSACTION, txid, false, false, res).then(
              (supportingTransaction) => {
                amountToFulfill -= supportingTransaction.amount;
                actualBalance += supportingTransaction.amount;
              }
            )
          );
        });
        return Promise.all(lastestTxPromises).then(() => {
          const copyOfAmountToFulfill = amountToFulfill;
          let amountPending = 0;
          const pendingTxPromises = [];

          (senderUser.pending_transactions || []).forEach((txid) => {
            pendingTxPromises.push(
              findByAddress(TYPE.TRANSACTION, txid, false, false, res).then(
                (pendingTransaction) => {
                  //The user created a pending transaction, owing money to pending's transaction recipient (until approved or rejected)
                  if (
                    pendingTransaction.sender === req.body.sender &&
                    pendingTransaction.creator === req.body.sender
                  ) {
                    amountPending += pendingTransaction.amount;
                    amountToFulfill += pendingTransaction.amount;
                    actualBalance -= pendingTransaction.amount;
                  }
                }
              )
            );
          });

          return Promise.all(pendingTxPromises).then(() => {
            if (amountToFulfill > 0) {
              returnedError = true;
              if (amountToFulfill !== copyOfAmountToFulfill)
                return createError(req, res, {
                  error:
                    ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS,
                  params: {
                    address: req.body.sender,
                    param: "amount",
                    value: req.body.sender,
                    amountPending,
                    actualBalance,
                  },
                });
            }

            return next();
          });
        });
      }
    } else if (
      recipientUser &&
      recipientUser.permissions &&
      recipientUser.permissions.coinbase !== true
    ) {
      return createError(req, res, {
        error: ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS,
        params: {
          address: req.body.recipient,
          param: "recipient",
          value: req.body.recipient,
          requiredPermission: "coinbase",
        },
      });
    } else {
      return next();
    }
  });
};

/**
 * Verifies if a transaction is pending.
 *
 * @post Allows the request to continue if the transaction is pending, denies the request otherwise.
 */
const validatePendingTransaction = async (req, res, next) => {
  const { address } = req.params;
  return findByAddress(TYPE.TRANSACTION, address, false, false, res).then(
    (transaction) => {
      if (transaction.pending) {
        return next();
      }
      return createError(req, res, {
        error: ERRORS.TRANSACTION.INPUT.TRANSACTION_IS_NOT_PENDING,
        params: {
          signature: req.params.address,
          param: "address",
          value: req.params.address,
        },
      });
    }
  );
};

/**
 * Validation chain of a transaction get/put request
 */
const validateTransactionAddress = [
  (req, res, next) =>
    validateExistingTransaction(req, res, next, req.params.address, true, {
      location: "params",
    }),
];

const validateTransactionSignature = (req, res, next) => {
  if (process.env.DISABLE_INTEGRITY_VALIDATION === "true") return next();
  const { creator, sender, recipient, signature } = req.body;
  const transaction = new Transaction(req.body).toSignatureString();
  const expectedPublicKey = getPublicKey(transaction, signature);
  if (expectedPublicKey) {
    return findByAddress(
      TYPE.USER,
      creator || sender || recipient,
      false,
      false,
      res
    ).then((user) => {
      if (user.public_key !== expectedPublicKey) {
        return createError(req, res, {
          error: ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,
          params: {
            param: "signature",
            value: req.body.signature,
          },
        });
      }
      return next();
    });
  } else
    return createError(req, res, {
      error: ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR,
      params: {
        param: "signature",
        value: req.body.signature,
      },
    });
};

const validateTransactionApproval = (req, res, next) => {
  if (process.env.DISABLE_INTEGRITY_VALIDATION === "true") return next();
  const { address } = req.params;
  const { approve } = req.query;
  const signature = req.query.signature || req.body.signature;
  if (approve === undefined) return next();
  else if (signature === undefined)
    return createError(req, res, {
      error: ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,
      location: "query",
      params: {
        param: "signature",
        propertyName: "signature",
      },
    });
  else if (approve !== "true" && approve !== "false") {
    return createError(req, res, {
      error: ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,
      location: "query",
      params: {
        param: "approve",
        propertyName: "approve",
      },
    });
  }

  return findByAddress(TYPE.TRANSACTION, address, false, false, res).then(
    (transaction) => {
      const signatureObj = { approve: approve === "true" };
      if (req.body.description) {
        signatureObj.description = req.body.description;
      }
      const expectedPublicKey = getPublicKey(
        JSON.stringify(signatureObj),
        signature
      );
      if (expectedPublicKey) {
        const promises = [];

        promises.push(
          findByAddress(TYPE.USER, transaction.sender, false, false, res)
        );
        //transaction can be rejected by recipient
        if (approve === "false")
          promises.push(
            findByAddress(TYPE.USER, transaction.recipient, false, false, res)
          );
        return Promise.all(promises).then(([sender, recipient]) => {
          if (
            recipient &&
            recipient.public_key !== expectedPublicKey &&
            sender.public_key !== expectedPublicKey
          ) {
            return createError(req, res, {
              error: ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,
              location: "query",
              params: {
                param: "signature",
                value: req.params.signature,
              },
            });
          }
          if (!recipient && sender.public_key !== expectedPublicKey) {
            return createError(req, res, {
              error: ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,
              location: "query",
              params: {
                param: "signature",
                value: req.params.signature,
              },
            });
          }
          return next();
        });
      } else
        return createError(req, res, {
          error: ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR,
          location: "query",
          params: {
            param: "signature",
            value: req.params.signature,
          },
        });
    }
  );
};

const validateTransactionUpdate = (req, res, next) => {
  if (process.env.DISABLE_INTEGRITY_VALIDATION === "true") return next();
  const { address } = req.params;
  const { approve } = req.query;
  const { description, signature } = req.body;
  //Validated by validateTransactionApproval
  if (approve !== undefined) return next();
  else if (signature === undefined)
    return createError(req, res, {
      error: ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,
      location: "body",
      params: {
        param: "signature",
        propertyName: "signature",
      },
    });
  else if (description === undefined)
    return createError(req, res, {
      error: ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,
      location: "body",
      params: {
        param: "description",
        propertyName: "description",
      },
    });
  return findByAddress(TYPE.TRANSACTION, address, false, false, res).then(
    (transaction) => {
      const expectedPublicKey = getPublicKey(
        JSON.stringify({ description }),
        signature
      );
      if (expectedPublicKey) {
        const promises = [
          findByAddress(TYPE.USER, transaction.creator, false, false, res),
          findByAddress(TYPE.USER, transaction.sender, false, false, res),
        ];
        return Promise.all(promises).then(([creator, sender]) => {
          if (
            creator.public_key !== expectedPublicKey &&
            sender.public_key !== expectedPublicKey
          ) {
            return createError(req, res, {
              error: ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,
              params: {
                param: "signature",
                value: req.body.signature,
              },
            });
          }
          return next();
        });
      } else
        return createError(req, res, {
          error: ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR,
          params: {
            param: "signature",
            value: req.body.signature,
          },
        });
    }
  );
};

/**
 * Validation chain of a transaction update request
 */
const validateTransactionUpdateRequest = [
  validatePendingTransaction,
  validateTransactionApproval,
  validateTransactionUpdate,
];
module.exports.validateTransactionAddress = validateTransactionAddress;
module.exports.validateTransactionUpdateRequest = validateTransactionUpdateRequest;
module.exports.verifyPostTransaction = [
  (req, res, next) =>
    validateExistingTransaction(
      req,
      res,
      next,
      createSignature(req.body.signature, req.body.creationDate),
      false,
      {
        location: "body",
      }
    ),
  verifyPostTransaction,
  validateTransactionSignature,
];
module.exports.inputValidation = inputValidation;
