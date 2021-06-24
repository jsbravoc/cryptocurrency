const {
  TRANSACTION_FAMILY,
  TRANSACTION_FAMILY_VERSION,
} = require("../utils/constants");

/**
 * Represents a transaction of the blockchain using Sawtooth REST API.
 * @constructor
 * @param {String} [transactionFamily] - The transaction family of the transaction.
 * @param {String} [transactionFamilyVersion] - The transaction family version of the transaction.
 * @param {Array} inputs - Array of addresses that are the inputs (read access) of the transaction.
 * @param {Array} outputs - Array of addresses that are the outputs (write access) of the transaction.
 * @param {String} payload - JSON stringified object to insert into the blockchain.
 */
class SawtoothTransaction {
  constructor({
    transactionFamily = TRANSACTION_FAMILY,
    transactionFamilyVersion = TRANSACTION_FAMILY_VERSION,
    inputs,
    outputs,
    payload,
  }) {
    this.transactionFamily = transactionFamily;
    this.transactionFamilyVersion = transactionFamilyVersion;
    this.inputs = inputs;
    this.outputs = outputs;
    this.payload = payload;
  }
}

module.exports = SawtoothTransaction;
