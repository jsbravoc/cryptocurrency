/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
const { TYPE } = require("../utils/constants");
const BaseModel = require("./BaseModel");

/**
 * Represents a transaction of the blockchain.
 * @constructor
 * @param {Number} amount - The amount of the transaction.
 * @param {String} recipient- The address of the recipient of the transaction.
 * @param {String} [sender] - The address of the sender of the transaction.
 * @param {String} [description] - The description of the transaction.
 * @param {Boolean} [valid] - Boolean representing if the transaction is valid or not.
 * @param {Date} [valid_thru] - Date till which the transaction will be valid.
 * @param {Array} [supporting_transactions] - The supporting transactions (namely the inputs) of the transaction.
 * @param {Boolean} [pending] - Boolean representing if the transaction is pending or not.
 * @param {Date} [creationDate] - Date of the transaction creation.
 * @param {String} creator - The address of the creator of the transaction.
 */
class Transaction extends BaseModel {
  constructor({
    amount,
    recipient,
    sender,
    description,
    valid = true,
    valid_thru,
    signature,
    supporting_transactions,
    pending,
    creationDate = new Date(),
    creator,
    txid,
  }) {
    super(TYPE.TRANSACTION);
    this.amount = amount;
    this.recipient = recipient;
    this.signature = signature || txid;
    this.creationDate = creationDate;
    this.valid = valid === null || valid === undefined ? true : valid;
    this.creator = creator || sender || recipient;
    if (sender !== null && sender !== undefined) {
      this.sender = sender;
    }
    if (description !== null && description !== undefined) {
      this.description = description;
    }
    if (valid_thru !== null && valid_thru !== undefined) {
      this.valid_thru = new Date(valid_thru);
    }

    if (pending !== null && pending !== undefined) {
      this.pending = pending;
    }
    if (
      supporting_transactions !== null &&
      supporting_transactions !== undefined
    ) {
      this.supporting_transactions = supporting_transactions;
    }
  }

  checkValidity() {
    if (new Date(this.valid_thru) < new Date()) {
      return false;
    }
    return true;
  }

  toSignatureObject() {
    const { amount, recipient, sender, creator } = this;
    const obj = { amount, recipient, sender, creator };
    return Transaction.toSortedObject(obj);
  }

  toSignatureString() {
    return JSON.stringify(this.toSignatureObject());
  }

  addSupportingTransaction(transactionSignature) {
    if (
      !this.supporting_transactions ||
      !Array.isArray(this.supporting_transactions)
    ) {
      this.supporting_transactions = [];
    }
    this.supporting_transactions.push(transactionSignature);
  }
}

module.exports = Transaction;
