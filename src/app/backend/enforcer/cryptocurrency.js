const Transaction = require("../models/Transaction");
const User = require("../models/User");
const {
  findByAddress,
  findAllAssets,
  buildAssetTransaction,
  putBatch,
} = require("../controllers/common");
const { TYPE, HTTP_METHODS } = require("../utils/constants");
const { logFormatted, SEVERITY } = require("../utils/logger");

const updateInvalidTransaction = (address) => {
  return findByAddress(TYPE.TRANSACTION, address).then((transaction) => {
    if (transaction && transaction.checkValidity() !== transaction.valid) {
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
  });
};

const updateInvalidUserTransactions = (address) => {
  return findByAddress(TYPE.USER, address).then((user) => {
    const promises = [];
    const arrayOfTransactions = [];
    let requiresUpdate = false;
    if (user) {
      (user.lastest_transactions || []).forEach((transaction) => {
        promises.push(
          updateInvalidTransaction(transaction).then((response) => {
            if (response) {
              const { transactionObj, assetObj } = response;
              requiresUpdate = true;
              user.removeInvalidTransaction(transactionObj);
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

const updateInvalidUsersTransactions = (source) => {
  const promises = [];
  return findAllAssets(TYPE.USER, source).then((users) => {
    users.forEach((user) => {
      user.address &&
        promises.push(updateInvalidUserTransactions(user.address, source));
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

const enforceValidTransactionsMiddleware = (req, res, next) =>
  updateInvalidUsersTransactions("[ENFORCER]")
    .then((response) => {
      if (response) {
        (response.payload || []).forEach(({ args }) => {
          let { transaction } = args;
          transaction = JSON.parse(transaction);
          switch (transaction.type) {
            case TYPE.TRANSACTION:
              if (!res.locals.transaction) {
                res.locals.transaction = {};
              }
              res.locals.transaction[transaction.signature] = new Transaction(
                transaction
              ).toObject(false, true);

              break;
            case TYPE.USER:
              if (!res.locals.user) {
                res.locals.user = {};
              }
              res.locals.user[transaction.address] = new User(
                transaction
              ).toObject(true, true);
              break;

            default:
              break;
          }
        });
      }
      return next();
    })
    .catch((err) => {
      logFormatted(`Enforcer failed with error`, SEVERITY.ERROR, err);
      next();
    });

module.exports.updateInvalidTransaction = updateInvalidTransaction;
module.exports.updateInvalidUserTransactions = updateInvalidUserTransactions;
module.exports.updateInvalidUsersTransactions = updateInvalidUsersTransactions;
module.exports.enforceValidTransactionsMiddleware = enforceValidTransactionsMiddleware;
