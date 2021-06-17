/* eslint-disable no-unused-vars */
const crypto = require("crypto");

const { InvalidTransaction } = require("sawtooth-sdk/processor/exceptions");
const { TYPE } = require("./utils/constants");
const { logFormatted, SEVERITY } = require("./utils/logger");

const TP_FAMILY = "cnk-cryptocurrency";
const TP_VERSION = "1.0";

const hash512 = (x) => crypto.createHash("sha512").update(x).digest("hex");

const getAddress = (key, length = 64) => hash512(key).slice(0, length);

const TRANSACTION_FAMILY = "cnk-cryptocurrency";

const TP_NAMESPACE = getAddress(TRANSACTION_FAMILY, 6);

const getTransactionAddress = (name) =>
  `${TP_NAMESPACE}00${getAddress(name, 62)}`;
const getUserAddress = (name) => `${TP_NAMESPACE}01${getAddress(name, 62)}`;

const addressIntKey = (key, addressType) => {
  switch (addressType) {
    case TYPE.TRANSACTION:
      return getTransactionAddress(key);
    case TYPE.USER:
      return getUserAddress(key);
  }
};
addressIntKey.keysCanCollide = true;

const getContext = ([transactionContext, userContext], transaction) => {
  let parsedTransaction;
  try {
    parsedTransaction = JSON.parse(transaction);
  } catch (error) {
    logFormatted(
      `Error at getContext - ${error}`,
      SEVERITY.ERROR,
      parsedTransaction
    );
    throw new InvalidTransaction("Transaction was not JSON parsable");
  }
  const { type } = parsedTransaction;
  logFormatted(
    `Handling transaction with type ${type}`,
    SEVERITY.WARN,
    parsedTransaction
  );
  switch (type) {
    case TYPE.TRANSACTION:
      return transactionContext;
    case TYPE.USER:
      return userContext;
    default:
      logFormatted(
        "Error at getContext - Transaction type was not defined",
        SEVERITY.ERROR,
        parsedTransaction
      );
      throw new InvalidTransaction("Transaction type was not defined");
  }
};

const handlers = {
  async delete([transactionContext, userContext], { transaction, txid }) {
    logFormatted("Handling delete transaction", SEVERITY.NOTIFY, {
      transaction,
      txid,
    });
    const contextHandler = getContext(
      [transactionContext, userContext],
      transaction
    );
    const { output } = JSON.parse(transaction);
    await contextHandler.putState(txid, output);
  },
  async post([transactionContext, userContext], { transaction, txid }) {
    logFormatted("Handling post transaction", SEVERITY.NOTIFY, {
      transaction,
      txid,
    });

    const contextHandler = getContext(
      [transactionContext, userContext],
      transaction
    );
    const { type, ...transactionObject } = JSON.parse(transaction);
    await contextHandler.putState(txid, transactionObject);

    logFormatted(`Added state ${txid} ->`, SEVERITY.SUCCESS, transactionObject);
  },
  async put([transactionContext, userContext], { transaction, txid }) {
    logFormatted("Handling put transaction", SEVERITY.NOTIFY, {
      transaction,
      txid,
    });

    const contextHandler = getContext(
      [transactionContext, userContext],
      transaction
    );
    const { type, ...transactionObject } = JSON.parse(transaction);
    await contextHandler.putState(txid, transactionObject);

    logFormatted(
      `Updated state ${txid} ->`,
      SEVERITY.SUCCESS,
      transactionObject
    );
  },
};

module.exports = {
  TP_FAMILY,
  TP_VERSION,
  TP_NAMESPACE,
  handlers,
  addresses: { getTransactionAddress, getUserAddress },
};
