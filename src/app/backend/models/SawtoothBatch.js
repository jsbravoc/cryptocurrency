// eslint-disable-next-line no-unused-vars
const { protobuf } = require("sawtooth-sdk");
/**
 * Represents a batch using Sawtooth REST API.
 * @constructor
 * @param {Object} batch - The batch to create.
 * @param {Array<protobuf.Transaction>} batch.transactions - Dependent transactions to insert into the blockchain.
 */
class SawtoothBatch {
  constructor({ transactions }) {
    this.transactions = transactions;
  }
}

module.exports = SawtoothBatch;
