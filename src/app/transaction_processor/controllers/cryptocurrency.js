const { getTransactionAddress, getRawState } = require("./common");
const {
  InvalidTransaction,
  InternalError,
} = require("sawtooth-sdk/processor/exceptions");
const { logFormatted, SEVERITY } = require("../utils/logger");
const Transaction = require("../models/Transaction");
async function postTransaction(context, transaction, timeout) {
  let addresses = await context.setState(
    {
      [getTransactionAddress(transaction.address)]: Buffer.from(
        JSON.stringify(transaction),
        "utf8"
      ),
    },
    timeout
  );

  if (addresses.length === 0) {
    throw new InternalError("State Error!");
  }

  logFormatted(
    `Added transaction state ${transaction.address.slice(
      -5
    )} ... -> ${getTransactionAddress(transaction.address).slice(-5)}`,
    SEVERITY.SUCCESS,
    new Transaction(transaction).toSimplifiedObject()
  );
}

module.exports.postTransaction = postTransaction;
