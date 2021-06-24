/* eslint-disable no-unused-vars */
const crypto = require("crypto");
const _ = require("lodash");
const {
  TYPE,
  TRANSACTION_FAMILY_VERSION,
  TRANSACTION_FAMILY,
} = require("./utils/constants");
const { logFormatted, SEVERITY } = require("./utils/logger");

//https://sawtooth.hyperledger.org/faq/transaction-processing/#my-tp-throws-an-exception-of-type-internalerror-but-the-apply-method-gets-stuck-in-an-endless-loop
//InternalErrors are transient errors, are retried,
//InvalidTransactions are not retired
const {
  InvalidTransaction,
  InternalError,
} = require("sawtooth-sdk/processor/exceptions");
const {
  inputValidation,
  postValidationChain,
} = require("./validators/cryptocurrency");
const { postTransaction } = require("./controllers/cryptocurrency");
const { postUser } = require("./controllers/users");
const { PREFIX } = require("./controllers/common");

const handlers = {
  [TYPE.TRANSACTION]: {
    async post(context, txObject) {
      logFormatted(
        `Handling post transaction with address ${txObject.address}`,
        SEVERITY.NOTIFY
      );
      try {
        await postValidationChain(context, txObject);
        await postTransaction(context, txObject);
      } catch (error) {
        console.error(error);
        throw new InvalidTransaction(error);
      }
    },
    async put(context, txObject) {
      logFormatted(
        `Handling put transaction with address ${txObject.address}`,
        SEVERITY.NOTIFY
      );
      await postTransaction(context, txObject);
    },
  },
  [TYPE.USER]: {
    async post(context, txObject) {
      logFormatted(
        `Handling post user with address ${txObject.address}`,
        SEVERITY.NOTIFY
      );
      await postUser(context, txObject);
    },
    async put(context, txObject) {
      logFormatted(
        `Handling put user with address ${txObject.address}`,
        SEVERITY.NOTIFY
      );
      await postUser(context, txObject);
    },
  },
};

module.exports = {
  TP_FAMILY: TRANSACTION_FAMILY,
  TP_VERSION: TRANSACTION_FAMILY_VERSION,
  TP_NAMESPACE: PREFIX,
  handlers,
};
