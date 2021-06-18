/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
const { TYPE } = require("../utils/constants");
const BaseModel = require("./BaseModel");

/**
 * Represents a transaction of the blockchain.
 * @constructor
 * @param {Object} transaction - The transaction object to create.
 * @param {String} transaction.address - The address of the transaction.
 * @param {Number} transaction.amount - The amount of the transaction.
 * @param {String} transaction.recipient - The address of the recipient of the transaction.
 * @param {String} transaction.signature - The signature of the transaction.
 * @param {String} [transaction.sender] - The address of the sender of the transaction.
 * @param {String} [transaction.description] - The description of the transaction.
 * @param {Boolean} [transaction.valid] - Boolean representing if the transaction is valid or not.
 * @param {Date} [transaction.valid_thru] - Date till which the transaction will be valid.
 * @param {Array} [transaction.supporting_transactions] - The supporting transactions (namely the inputs) of the transaction.
 * @param {Boolean} [transaction.pending] - Boolean representing if the transaction is pending or not.
 * @param {Date} [transaction.creationDate] - Date of the transaction creation.
 * @param {String} transaction.creator - The address of the creator of the transaction.
 */
class Transaction extends BaseModel {
  constructor({
    amount,
    recipient,
    address,
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
    super(TYPE.TRANSACTION, address);
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

  /**
   * Checks if a valid transaction is still valid.
   * Note that this validity can only change if the date is past its valid date.
   * @returns {Boolean} true if the transaction could be valid, false otherwise. (Note that current invalid transactions would also return true)
   */
  checkValidity() {
    if (this.valid_thru && new Date(this.valid_thru) < new Date()) {
      return false;
    }
    return true;
  }

  /**
   * Returns the transaction as a key-sorted object with only amount, recipient, sender and creator properties.
   * Note that this signature method **must** match with front-end's project signature object.
   * @returns {Object} Key-sorted object with only amount, recipient, sender and creator properties.
   */
  toSignatureObject() {
    const { amount, recipient, sender, creator } = this;
    const obj = { amount, recipient, sender, creator };
    return Transaction.toSortedObject(obj);
  }

  /**
   * Returns the JSON stringified signature object of a transaction.
   * Note that this signature method **must** match with front-end's project signature string.
   * @returns {String} JSON stringified key-sorted object with only amount, recipient, sender and creator properties.
   */
  toSignatureString() {
    return JSON.stringify(this.toSignatureObject());
  }

  /**
   * Adds a transaction signature as a supporting transaction of the current transaction (also denoted as the input of the transaction).
   * @param {String} transactionSignature - Transaction signature to include as a supporting transaction of the current transaction.
   */
  addSupportingTransaction(transactionSignature) {
    if (
      !this.supporting_transactions ||
      !Array.isArray(this.supporting_transactions)
    ) {
      this.supporting_transactions = [];
    }
    this.supporting_transactions.push(transactionSignature);
  }

  /**
   * Returns a simplified representation of the object.
   *
   * @returns {String} Simplified representation of the transaction object.
   */
  toSimplifiedObject() {
    const obj = {
      address: this.address,
      recipient: this.recipient,
    };
    if (this.sender) {
      obj["sender"] = this.sender;
    }
    obj["amount"] = this.amount;
    obj["signature"] = this.signature;
    if (this.supporting_transactions) {
      obj["supporting_transactions"] = this.supporting_transactions.length;
    }

    return obj;
  }
}

module.exports = Transaction;
