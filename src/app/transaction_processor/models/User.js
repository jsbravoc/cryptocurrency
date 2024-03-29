/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const { TYPE, USER_TYPE } = require("../utils/constants");
const BaseModel = require("./BaseModel");
const Permissions = require("./Permissions");

/**
 * Represents a user of the blockchain.
 * @constructor
 * @param {Object} user - The user object to create.
 * @param {String} user.address - The unique address of the user.
 * @param {String} [user.active] - Represents if the user is active (can make transactions) or not.
 * @param {String} user.balance - Represents the balance of the user.
 * @param {String} [user.role] - The role of the user.
 * @param {String} [user.description] - The description of the user.
 * @param {String} user.public_key - The public key of the user.
 * @param {Object} [user.return_to] - Key-value object containing actions and addresses of users who will receive the user's transactions upon the action execution (ex. user_retire: 'cs_department')
 * @param {Permissions} [user.permissions] - User permissions in the system.
 * @param {Array<String>} [user.latest_transactions] - The latest transactions of the user.
 * @param {Array<String>} [user.pending_transactions] - The pending transactions of the user.
 */
class User extends BaseModel {
  constructor({
    address,
    role,
    active = true,
    balance,
    description,
    public_key,
    return_to,
    permissions,
    latest_transactions,
    pending_transactions,
  }) {
    super(TYPE.USER, address);
    this.role = role;
    this.description = description;
    this.public_key = public_key;
    this.balance = balance || 0;
    this.active = typeof active === "boolean" ? active : true;
    this.return_to = return_to || {};
    this.latest_transactions = latest_transactions || [];
    this.pending_transactions = pending_transactions || [];
    this.permissions = new Permissions(permissions);
  }

  /**
   * Removes an invalid transaction from the user, deducting their current account balance.
   *
   * @param {Transaction} transaction - The transaction object to delete.
   * @throws {Error} Throws error if the user does not have that transaction in latest_transactions.
   */
  removeInvalidTransaction(transaction) {
    const indexOfTransaction = this.latest_transactions.indexOf(
      transaction.address
    );
    const { amount } = transaction;
    this.balance -= amount;
    this.latest_transactions.splice(indexOfTransaction, 1);
  }

  /**
   * Removes a pending transaction from the user.
   *
   * @param {String} transaction - The transaction signature to remove from pending_transactions.
   * @throws {Error} Throws error if the user does not have that transaction signature in pending_transactions.
   */
  removePendingTransaction(transactionSignature) {
    if (Array.isArray(this.pending_transactions)) {
      const indexOfTransaction = this.pending_transactions.indexOf(
        transactionSignature
      );
      this.pending_transactions.splice(indexOfTransaction, 1);
    }
  }

  /**
   * Adds a transaction to the user if they are the recipient (adding to the account balance), removes it if they are the sender (subtracting to the account balance).
   *
   * @param {USER_TYPE} userType - The type of user in the transaction (recipient or sender).
   * @param {Number} amount - The amount of the transaction.
   * @param {String} transactionAddress - The address of the transaction.
   * @param {Boolean} [validTransaction] - True if the transaction is valid, false otherwise.
   * @throws {Error} Throws error if the sender user does not have that transaction address in latest_transactions.
   */
  addTransaction(
    userType,
    amount,
    transactionAddress,
    validTransaction = true
  ) {
    switch (userType) {
      case USER_TYPE.SENDER:
        if (validTransaction) {
          const indexOfTransaction = this.latest_transactions.indexOf(
            transactionAddress
          );
          this.balance -= amount;
          this.latest_transactions.splice(indexOfTransaction, 1);
        } else {
          this.pending_transactions.push(transactionAddress);
        }
        break;
      case USER_TYPE.RECIPIENT:
        if (validTransaction) {
          this.balance += amount;
          this.latest_transactions.push(transactionAddress);
        } else {
          this.pending_transactions.push(transactionAddress);
        }
        break;
    }
  }
  /**
   * Returns a simplified representation of the object.
   *
   * @returns {String} Simplified representation of the user object.
   */
  toSimplifiedObject() {
    return {
      address: this.address,
      balance: this.balance,
      latest_transactions: this.latest_transactions.length,
      pending_transactions: this.pending_transactions.length,
    };
  }
}

module.exports = User;
