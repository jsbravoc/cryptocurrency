const { getTransactionAddress, getRawState } = require("./common");
const {
  InvalidTransaction,
  InternalError,
} = require("sawtooth-sdk/processor/exceptions");
const { logFormatted, SEVERITY } = require("../utils/logger");
async function postTransaction(context, transaction, timeout) {
  //Note that transaction.address => getTransactionAddress(transaction.address) (L492 in controllers/cryptocurrency)
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
    `Added transaction state ${transaction.address} -> ${getTransactionAddress(
      transaction.address
    )}`,
    SEVERITY.SUCCESS,
    transaction
  );
}

module.exports.postTransaction = postTransaction;
