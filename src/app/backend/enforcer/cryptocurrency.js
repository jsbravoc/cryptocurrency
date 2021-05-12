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

const updateInvalidTransaction = (address, res) => {
  return findByAddress(TYPE.TRANSACTION, address, false, false, res).then(
    (transaction) => {
      if (
        transaction &&
        (transaction.checkValidity() !== transaction.valid ||
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

const updateInvalidUserTransactions = (address, res) => {
  return findByAddress(TYPE.USER, address, false, false, res).then((user) => {
    const promises = [];
    const arrayOfTransactions = [];
    let requiresUpdate = false;
    if (user) {
      (user.lastest_transactions || []).forEach((transaction) => {
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
      (user.pending_transactions || []).forEach((transaction) => {
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

const updateInvalidUsersTransactions = (source, users = null, res) => {
  const promises = [];
  const promiseOfUsers = [];
  if (Array.isArray(users) && users.length > 0) {
    users.forEach((user) => {
      promiseOfUsers.push(findByAddress(TYPE.USER, user, false, false, res));
    });
  } else {
    promiseOfUsers.push(
      findAllAssets(TYPE.USER, source, undefined, false, false, res)
    );
  }
  return Promise.all(promiseOfUsers).then((users) => {
    const userList = [].concat.apply([], users);
    userList.forEach((user) => {
      if (user.address)
        promises.push(updateInvalidUserTransactions(user.address, res));
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

const enforceValidTransactionsMiddleware = (req, res, next) => {
  let users;
  if (req.query.users) {
    users = req.query.users.split(",");
  }
  updateInvalidUsersTransactions("[ENFORCER]", users, res)
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
};

module.exports.updateInvalidTransaction = updateInvalidTransaction;
module.exports.updateInvalidUserTransactions = updateInvalidUserTransactions;
module.exports.updateInvalidUsersTransactions = updateInvalidUsersTransactions;
module.exports.enforceValidTransactionsMiddleware = enforceValidTransactionsMiddleware;
