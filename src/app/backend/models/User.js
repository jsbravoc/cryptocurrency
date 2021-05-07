/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const { TYPE, USER_TYPE } = require("../utils/constants");
const BaseModel = require("./BaseModel");
const Permissions = require("./Permissions");

/**
 * Represents a user of the blockchain.
 * @constructor
 * @param {String} address - The unique address of the user.
 * @param {String} [role] - The role of the user.
 * @param {String} [description] - The description of the user.
 * @param {String} public_key - The public key of the user.
 * @param {Object} [return_to] - Key-value object containing actions and addresses of users who will receive the user's transactions upon the action execution (ex. user_retire: 'cs_department')
 * @param {Permissions} permissions - The permissions of the user.
 * @param {String} signature - The signature of the user.
 */
class User extends BaseModel {
  constructor({
    address,
    signature,
    role,
    active,
    balance,
    description,
    public_key,
    return_to,
    permissions,
    lastest_transactions,
    pending_transactions,
  }) {
    super(TYPE.USER);
    this.address = address;
    this.role = role;
    this.description = description;
    this.public_key = public_key;
    this.balance = balance || 0;
    this.active = typeof active === "boolean" ? active : true;
    this.return_to = return_to || {};
    this.lastest_transactions = lastest_transactions || [];
    this.pending_transactions = pending_transactions || [];
    this.permissions = new Permissions(permissions);
    if (signature) this.signature = signature;
    else this.signature = address;
  }

  removeInvalidTransaction(transaction) {
    const indexOfTransaction = this.lastest_transactions.indexOf(
      transaction.signature
    );
    if (indexOfTransaction <= -1) {
      throw new Error("User error: Tried to remove nonexistent transaction");
    }
    const { amount } = transaction;
    this.balance -= amount;
    this.lastest_transactions.splice(indexOfTransaction, 1);
  }

  removePendingTransaction(transactionSignature) {
    if (Array.isArray(this.pending_transactions)) {
      const indexOfTransaction = this.pending_transactions.indexOf(
        transactionSignature
      );
      if (indexOfTransaction <= -1) {
        throw new Error(
          "User error: Sender tried to use remove pending unexistent transaction"
        );
      }
      this.pending_transactions.splice(indexOfTransaction, 1);
    }
  }

  addTransaction(
    userType,
    amount,
    transactionSignature,
    validTransaction = true
  ) {
    if (!Array.isArray(this.lastest_transactions)) {
      this.lastest_transactions = [];
    }
    switch (userType) {
      case USER_TYPE.SENDER:
        if (validTransaction) {
          // eslint-disable-next-line no-case-declarations
          const indexOfTransaction = this.lastest_transactions.indexOf(
            transactionSignature
          );
          if (indexOfTransaction <= -1) {
            throw new Error(
              "User error: Sender tried to use nonexistent transaction"
            );
          }
          this.balance -= amount;
          this.lastest_transactions.splice(indexOfTransaction, 1);
        } else {
          this.pending_transactions.push(transactionSignature);
        }
        break;
      case USER_TYPE.RECIPIENT:
        if (validTransaction) {
          this.balance += amount;
          this.lastest_transactions.push(transactionSignature);
        } else {
          this.pending_transactions.push(transactionSignature);
        }
        break;
      default:
        break;
    }
  }
}

module.exports = User;
