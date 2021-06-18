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
      let asset;
      let type;
      try {
        asset = JSON.parse(
          Buffer.from(transactionProcessRequest.payload, "utf8").toString()
        );
        httpMethod = asset.httpMethod.toLowerCase();
        type = asset.type;
        delete asset.httpMethod;
        delete asset.type;
      } catch (err) {
        console.error(`Transaction payload format error`, err);
        throw new InvalidTransaction(
          "Transaction payload format error",
          err.message
        );
      }
      if (!handlers[type]) {
        console.log("Transaction error type asset", asset);
        console.error(
          `Transaction type error, missing ${type}, expected type between ${Object.keys(
            handlers
          )}`
        );
        throw new InvalidTransaction(
          `Transaction type error, missing ${type}, expected type between ${Object.keys(
            handlers
          )}`
        );
      }
      if (true) {
        try {
          await handlers[type][httpMethod](context, asset);
        } catch (e) {
          console.log("ERROR during:", e);
          if (e instanceof InternalError) {
            //Catch InternalError and don't make the TP unavailable
            console.log(e);
          } else {
            throw e;
          }
        }
      } else {
        await handlers[type][httpMethod](context, asset);
      }
    }
  }
  return TPHandler;
};
