/**
 * @typedef {Object} app_errors
 * @property {Object} ERRORS An object representing all the posible errors that the application can create.
 * @global
 */

const errors = {
  ERRORS: {
    USER: {
      INPUT: {
        NO_INPUT: {
          errorCode: "100",
          error: (req, { property }) =>
            req.t("ERRORS.USER.INPUT.NO_INPUT.error", { property }),
          msg: (req, { property }) =>
            req.t("ERRORS.USER.INPUT.NO_INPUT.msg", { property }),
        },
        MISSING_REQUIRED_INPUT: {
          errorCode: "100a",
          error: (req, { parameter }) =>
            req.t("ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT.error", {
              parameter,
            }),
          msg: (req, { parameter }) =>
            req.t("ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT.msg", {
              parameter,
            }),
        },
        INCORRECT_INPUT: {
          errorCode: "100b",
          error: (req, { parameter }) =>
            req.t("ERRORS.USER.INPUT.INCORRECT_INPUT.error", {
              parameter,
            }),
          msg: (req, { parameter }) =>
            req.t("ERRORS.USER.INPUT.INCORRECT_INPUT.msg", {
              parameter,
            }),
        },
        INCORRECT_INPUT_TYPE: {
          errorCode: "110",
          error: (req, { expectedType, receivedType, propertyName }) =>
            req.t("ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE.error", {
              expectedType,
              receivedType,
              propertyName,
            }),
          msg: (req, { expectedType, receivedType, propertyName }) =>
            req.t("ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE.msg", {
              expectedType,
              receivedType,
              propertyName,
            }),
        },
        USER_EXISTS: {
          errorCode: "111a",
          error: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.USER_EXISTS.error", { address }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.USER_EXISTS.msg", { address }),
        },
        USER_DOES_NOT_EXIST: {
          errorCode: "111b",
          error: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.USER_DOES_NOT_EXIST.error", { address }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.USER_DOES_NOT_EXIST.msg", { address }),
        },

        NO_TRANSACTIONS: {
          errorCode: "112",
          error: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.NO_TRANSACTIONS.error", { address }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.NO_TRANSACTIONS.msg", { address }),
        },
        INSUFFICIENT_FUNDS: {
          errorCode: "113a",
          error: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS.error", { address }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS.msg", { address }),
        },
        INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS: {
          errorCode: "113b",
          error: (req, { address, amountPending, actualBalance }) =>
            req.t(
              "ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS.error",
              { address, amountPending, actualBalance }
            ),
          msg: (req, { address, amountPending, actualBalance }) =>
            req.t(
              "ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS.msg",
              { address, amountPending, actualBalance }
            ),
        },
        INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE: {
          errorCode: "114",
          error: (req, { address, actualBalance }) =>
            req.t(
              "ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE.error",
              { address, actualBalance }
            ),
          msg: (req, { address, actualBalance }) =>
            req.t(
              "ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE.msg",
              { address, actualBalance }
            ),
        },
        UNDEFINED_RETURN_TO_REASON: {
          errorCode: "115",
          error: (req, { address, reason }) =>
            req.t("ERRORS.USER.INPUT.UNDEFINED_RETURN_TO_REASON.error", {
              address,
              reason,
            }),
          msg: (req, { address, reason }) =>
            req.t("ERRORS.USER.INPUT.UNDEFINED_RETURN_TO_REASON.msg", {
              address,
              reason,
            }),
        },
      },
      LOGIC: {
        USER_IS_NOT_ACTIVE: {
          errorCode: "121",
          error: (req, { address }) =>
            req.t("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE.error", { address }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE.msg", { address }),
        },
        USER_DOES_NOT_HAVE_PERMISSIONS: {
          errorCode: "121",
          error: (req, { address }) =>
            req.t("ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS.error", {
              address,
            }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS.msg", {
              address,
            }),
        },
        USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS: {
          errorCode: "122",
          error: (req, { address, recipient }) =>
            req.t(
              "ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS.error",
              {
                address,
                recipient,
              }
            ),
          msg: (req, { address, recipient }) =>
            req.t(
              "ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS.msg",
              {
                address,
                recipient,
              }
            ),
        },
        NONEXISTENT_LASTEST_TRANSACTION: {
          errorCode: "123",
          error: (req, { address, transactionSignature }) =>
            req.t("ERRORS.USER.LOGIC.NONEXISTENT_LASTEST_TRANSACTION.error", {
              address,
              transactionSignature,
            }),
          msg: (req, { address, transactionSignature }) =>
            req.t("ERRORS.USER.LOGIC.NONEXISTENT_LASTEST_TRANSACTION.msg", {
              address,
              transactionSignature,
            }),
        },
        NONEXISTENT_PENDING_TRANSACTION: {
          errorCode: "124",
          error: (req, { address, transactionSignature }) =>
            req.t("ERRORS.USER.LOGIC.NONEXISTENT_PENDING_TRANSACTION.error", {
              address,
              transactionSignature,
            }),
          msg: (req, { address, transactionSignature }) =>
            req.t("ERRORS.USER.LOGIC.NONEXISTENT_PENDING_TRANSACTION.msg", {
              address,
              transactionSignature,
            }),
        },
        INCORRECT_RECIPIENT_LASTEST_TRANSACTION: {
          errorCode: "125",
          error: (req, { address, transactionSignature }) =>
            req.t(
              "ERRORS.USER.LOGIC.INCORRECT_RECIPIENT_LASTEST_TRANSACTION.error",
              {
                address,
                transactionSignature,
              }
            ),
          msg: (req, { address, transactionSignature }) =>
            req.t(
              "ERRORS.USER.LOGIC.INCORRECT_RECIPIENT_LASTEST_TRANSACTION.msg",
              {
                address,
                transactionSignature,
              }
            ),
        },
        NO_RETURN_TO_ADDRESSES: {
          errorCode: "126",
          error: (req, { address }) =>
            req.t("ERRORS.USER.LOGIC.NO_RETURN_TO_ADDRESSES.error", {
              address,
            }),
          msg: (req, { address }) =>
            req.t("ERRORS.USER.LOGIC.NO_RETURN_TO_ADDRESSES.msg", {
              address,
            }),
        },
      },
    },
    TRANSACTION: {
      INPUT: {
        NO_INPUT: {
          errorCode: "200",
          error: (req, { property }) =>
            req.t("ERRORS.TRANSACTION.INPUT.NO_INPUT.error", { property }),
          msg: (req, { property }) =>
            req.t("ERRORS.TRANSACTION.INPUT.NO_INPUT.msg", { property }),
        },
        MISSING_REQUIRED_INPUT: {
          errorCode: "200a",
          error: (req, { parameter }) =>
            req.t("ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT.error", {
              parameter,
            }),
          msg: (req, { parameter }) =>
            req.t("ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT.msg", {
              parameter,
            }),
        },
        INCORRECT_INPUT: {
          errorCode: "200b",
          error: (req, { parameter }) =>
            req.t("ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT.error", {
              parameter,
            }),
          msg: (req, { parameter }) =>
            req.t("ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT.msg", {
              parameter,
            }),
        },
        TRANSACTION_EXISTS: {
          errorCode: "211a",
          error: (req, { signature }) =>
            req.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS.error", {
              signature,
            }),
          msg: (req, { signature }) =>
            req.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS.msg", {
              signature,
            }),
        },
        TRANSACTION_DOES_NOT_EXIST: {
          errorCode: "211b",
          error: (req, { signature }) =>
            req.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST.error", {
              signature,
            }),
          msg: (req, { signature }) =>
            req.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST.msg", {
              signature,
            }),
        },
        TRANSACTION_IS_NOT_PENDING: {
          errorCode: "212",
          error: (req, { signature }) =>
            req.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_IS_NOT_PENDING.error", {
              signature,
            }),
          msg: (req, { signature }) =>
            req.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_IS_NOT_PENDING.msg", {
              signature,
            }),
        },
      },
      LOGIC: {
        NON_MATCHING_KEYS: {
          errorCode: "220",
          error: (req) =>
            req.t("ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS.error"),
          msg: (req) => req.t("ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS.msg"),
        },
        DECRYPTING_ERROR: {
          errorCode: "221",
          error: (req) =>
            req.t("ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR.error"),
          msg: (req) => req.t("ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR.msg"),
        },
      },
    },
  },
};
module.exports = Object.freeze({ ...errors });
