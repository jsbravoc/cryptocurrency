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
    async post(context, asset) {
      logFormatted(
        `Handling post transaction with address ${asset.address}`,
        SEVERITY.NOTIFY
      );
      try {
        //await postValidationChain(context, asset);
        await postTransaction(context, asset);
      } catch (error) {
        console.error(error);
        throw new InvalidTransaction(error);
      }
    },
    async put(context, asset) {
      logFormatted(
        `Handling put transaction with address ${asset.address}`,
        SEVERITY.NOTIFY
      );
      await postTransaction(context, asset);
    },
  },
  [TYPE.USER]: {
    async post(context, asset) {
      logFormatted(
        `Handling post user with address ${asset.address}`,
        SEVERITY.NOTIFY
      );
      await postUser(context, asset);
    },
    async put(context, asset) {
      logFormatted(
        `Handling put user with address ${asset.address}`,
        SEVERITY.NOTIFY
      );
      await postUser(context, asset);
    },
  },
};

module.exports = {
  TP_FAMILY: TRANSACTION_FAMILY,
  TP_VERSION: TRANSACTION_FAMILY_VERSION,
  TP_NAMESPACE: PREFIX,
  handlers,
};
