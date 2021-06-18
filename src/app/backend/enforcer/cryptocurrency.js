/** Enforcer controller functionality
 * @module enforcer/cryptocurrency
 */
const {
  findByAddress,
  findAllAssets,
  buildAssetTransaction,
  putBatch,
} = require("../controllers/common");
const { TYPE, HTTP_METHODS } = require("../utils/constants");
const { logFormatted, SEVERITY } = require("../utils/logger");
const { createError } = require("../validators/common");
const { ERRORS } = require("../utils/errors");

/**
 * Returns the updated transaction object & asset in case its validity has changed.
 * This mainly handles expiring transactions (with valid_thru property).
 *
 * @param {String} address - Address of the transaction.
 * @param {Response} res- Express.js response object, used to access locals.
 * @return {Promise<{transactionObj: Transaction, assetObj: Asset}|null>}} Promise containing the asset and the updated transaction object if its validity has changed.
 */
const updateInvalidTransaction = (address, res) => {
  return findByAddress(TYPE.TRANSACTION, address, false, res).then(
    (transaction) => {
      if (
        transaction &&
        ((!transaction.pending &&
          transaction.checkValidity() !== transaction.valid) ||
          (transaction.pending && !transaction.checkValidity()))
      ) {
        transaction.valid = transaction.checkValidity();
        return {
          transactionObj: transaction,
          assetObj: buildAssetTransaction(
            TYPE.TRANSACTION,
            HTTP_METHODS.PUT,
            transaction
          ),
        };
      }
      return null;
    }
  );
};

/**
 * Returns a list of transactions to update to a user specified.
 * This mainly handles expiring transactions (with valid_thru property).
 *
 * @param {String} address - Address of the user.
 * @param {Array<String>} transactions - Array of known transactions that must be updated (used to limit blockchain queries to the minimum).
 * @param {Response} res- Express.js response object, used to access locals.
 * @return {Promise<Array<Asset>>} Promise containing a list of assets to post to the blockchain.
 */
const updateInvalidUserTransactions = (address, transactions, res) => {
  return findByAddress(TYPE.USER, address, false, res).then((user) => {
    const promises = [];
    const arrayOfTransactions = [];
    let requiresUpdate = false;
    if (user) {
      (Array.isArray(transactions) && transactions.length > 0
        ? (user.latest_transactions || []).filter(
            (x) => transactions.indexOf(x) > -1
          )
        : user.latest_transactions || []
      ).forEach((transaction) => {
        promises.push(
          updateInvalidTransaction(transaction, res).then((response) => {
            if (response) {
              const { transactionObj, assetObj } = response;
              requiresUpdate = true;
              user.removeInvalidTransaction(transactionObj);
              arrayOfTransactions.push(assetObj);
            }
          })
        );
      });
      (Array.isArray(transactions) && transactions.length > 0
        ? (user.pending_transactions || []).filter(
            (x) => transactions.indexOf(x) > -1
          )
        : user.pending_transactions || []
      ).forEach((transaction) => {
        promises.push(
          updateInvalidTransaction(transaction, res).then((response) => {
            if (response) {
              const { assetObj } = response;
              requiresUpdate = true;
              user.removePendingTransaction(transaction);
              arrayOfTransactions.push(assetObj);
            }
          })
        );
      });
    }
    return Promise.all(promises).then(() => {
      if (requiresUpdate) {
        arrayOfTransactions.push(
          buildAssetTransaction(TYPE.USER, HTTP_METHODS.PUT, user)
        );
      }
      return arrayOfTransactions;
    });
  });
};

/**
 * Updates the (now) invalid transactions in the Blockchain.
 * This mainly handles expiring transactions (with valid_thru property).
 * NOTE: users & transactions parameters **should** be passed. If not, the function will search for invalid transaction in all the transactions of all the users.
 * This call increment the processing time exponentially, and (if enough users & transactions exists), may break the REST API. (Devmode Algorithm at least).
 *
 * @param {String} source - String description of the initializer of the request, used for logging.
 * @param  {Array<String>} [users] - Array of known users to hold (now) invalid transactions.
 * @param {Array<String>} [transactions] - Array of known transactions that must be updated (used to limit blockchain queries to the minimum).
 * @param {Response} res- Express.js response object, used to access locals.
 * @return {Promise<Error | {responseCode, msg, payload}>} Promise containing the response of the Sawtooth REST API call.
 */
const updateInvalidUsersTransactions = (
  source,
  users = null,
  transactions = null,
  res
) => {
  const promises = [];
  const promiseOfUsers = [];
  if (Array.isArray(users) && users.length > 0) {
    users.forEach((user) => {
      promiseOfUsers.push(findByAddress(TYPE.USER, user, false, res));
    });
  } else {
    logFormatted(
      "Warning: Enforcer called without users query parameter, increasing load significantly",
      SEVERITY.WARN
    );
    promiseOfUsers.push(
      findAllAssets(TYPE.USER, source, undefined, false, res)
    );
  }
  return Promise.all(promiseOfUsers).then((users) => {
    const userList = [].concat.apply([], users);
    userList.forEach((user) => {
      if (user.address)
        promises.push(
          updateInvalidUserTransactions(user.address, transactions, res)
        );
    });
    return Promise.all(promises).then((arrayOfMultipleTransactions) => {
      const flattenedArray = [].concat.apply([], arrayOfMultipleTransactions);
      if (flattenedArray.length > 0) {
        return putBatch(HTTP_METHODS.PUT, source, flattenedArray);
      }
      return;
    });
  });
};

/**
 * Verifies and updates invalid user transactions.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {Function} next - Express.js next callback.
 * @param {String} [req.query.users] - Comma separated list of addresses of users to validate.
 * @param {String} [req.query.transactions] - Comma separated list of addresses of transactions to update.
 * @post Updates req.query.transactions invalid transactions of the users defined in req.query.users.
 */
const enforceValidTransactionsMiddleware = (req, res, next) => {
  let users;
  let transactions;
  if (req.query.users) {
    users = req.query.users.split(",");
  }
  if (req.query.transactions) {
    transactions = req.query.transactions.split(",");
  }
  return updateInvalidUsersTransactions("[ENFORCER]", users, transactions, res)
    .then(() => next())
    .catch((err) => {
      logFormatted(
        `Enforcer failed with error`,
        SEVERITY.ERROR,
        err.errno || err.message
      );
      return createError(req, res, {
        error: ERRORS.SAWTOOTH.UNAVAILABLE,
        statusCode: 503,
        noLocation: true,
      });
    });
};

module.exports.updateInvalidTransaction = updateInvalidTransaction;
module.exports.updateInvalidUserTransactions = updateInvalidUserTransactions;
module.exports.updateInvalidUsersTransactions = updateInvalidUsersTransactions;
module.exports.enforceValidTransactionsMiddleware = enforceValidTransactionsMiddleware;
