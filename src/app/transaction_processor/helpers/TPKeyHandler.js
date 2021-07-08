"use strict";

const { TransactionHandler } = require("sawtooth-sdk/processor/handler");
const {
  InvalidTransaction,
  InternalError,
} = require("sawtooth-sdk/processor/exceptions");
module.exports = function ({ TP_FAMILY, TP_VERSION, TP_NAMESPACE, handlers }) {
  class TPHandler extends TransactionHandler {
    constructor() {
      super(TP_FAMILY, [TP_VERSION], [TP_NAMESPACE]);
    }

    async apply(transactionProcessRequest, context) {
      let httpMethod;
      let txObject;
      let type;
      try {
        txObject = JSON.parse(
          Buffer.from(transactionProcessRequest.payload, "utf8").toString()
        );
        httpMethod = txObject.httpMethod.toLowerCase();
        type = txObject.type;
        delete txObject.httpMethod;
        delete txObject.type;
      } catch (err) {
        console.error(`Transaction payload format error`, err);
        throw new InvalidTransaction(
          "Transaction payload format error",
          err.message
        );
      }
      if (!handlers[type]) {
        throw new InvalidTransaction(
          `Transaction type error, missing ${type}, expected type between ${Object.keys(
            handlers
          )}`
        );
      }
      try {
        await handlers[type][httpMethod](context, txObject);
      } catch (e) {
        console.log("ERROR during:", e);
        if (e instanceof InternalError) {
          //Catch InternalError and don't make the TP unavailable
          console.log(e);
        } else {
          throw e;
        }
      }
    }
  }
  return TPHandler;
};
