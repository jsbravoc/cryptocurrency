/** Users controller functionality
 * @module controllers/users
 */

const { SEVERITY, logFormatted } = require("../utils/logger");

const { HTTP_METHODS, TYPE } = require("../utils/constants");
const {
  findAllObjects,
  findByAddress,
  putObject,
  _putObject,
  hash512,
} = require("./common");

const {
  expandSupportingTransactions,
  findTransaction,
  createTransaction,
} = require("./cryptocurrency");
const Transaction = require("../models/Transaction");
const { ERRORS } = require("../utils/errors");

//#region [AUXILIARY FUNCTIONS]

/**
 * Finds a user in the blockchain.
 *
 * @param {String} address - Address of the user.
 * @param {Boolean} [removeSignature] - Boolean that indicates if the signature should be removed.
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @return {Promise<User|null>} Promise containing the user object or null if not found.
 */
const findUser = (address, removeType = true, res = null) =>
  findByAddress(TYPE.USER, address, removeType, res);

/**
 * Updates a user in the blockchain.
 *
 * @param {User} user - The user to update.
 * @param {Response} res - Express.js response object, used to access locals.
 * @param {String} [source] - Source function that invoked the request.
 * @return {Promise} Promise of the sawtooth REST API request response.
 */
// eslint-disable-next-line no-unused-vars
const _updateUser = (user, res, source = "[LOCAL USER UPDATE]") =>
  _putObject(TYPE.USER, HTTP_METHODS.PUT, source, user).then(
    ({ responseCode, msg, payload }) => {
      return res.status(responseCode).json({ msg, payload });
    }
  );

//#endregion

//#region [Express.js REQUEST HANDLERS]

/**
 * Finds and returns all (or up to limit query parameter) users.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {Boolean} [req.query.expand] - If true, latest & pending transactions which be expanded.
 * @param {Number} [req.query.limit] - Maximum number of users to return.
 * @param {Boolean} [req.query.simplifyUser] - If true, a simplified version of the users will be returned.
 * @param {Boolean} [req.query.simplifyTransactions] - If true, a simplified version of the users' transactions will be returned (only if the transaction are expanded).
 * @post Returns array of users in res object. If an error happens, response object has the error.
 */
const getUsers = (req, res) => {
  const limit = Number.isNaN(Number(req.query.limit))
    ? 0
    : Number(req.query.limit);
  const hidePublicKey = req.query.hidePublicKey === "true" || false;
  const objArray = [findAllObjects(TYPE.USER, "GET /users", limit, true, res)];
  const expand = req.query.expand === "true" || false;
  const simplifyUser = req.query.simplifyUser === "true" || false;
  const simplifyTransaction = req.query.simplifyTransaction === "true" || false;

  if (expand && !simplifyUser) {
    objArray.push(
      findAllObjects(TYPE.TRANSACTION, "GET /users", limit, true, res)
    );
  }
  return Promise.all(objArray)
    .then(([userList, transactionList]) => {
      if (!expand) {
        hidePublicKey && userList.forEach((user) => delete user.public_key);
        simplifyUser && userList.forEach((user) => user.toSimplifiedObject());
        return res.status(200).json(userList);
      }
      const dictionaryOfTransactions = {};
      (transactionList || []).forEach((obj) => {
        dictionaryOfTransactions[obj.address] = obj;
      });

      let promises = [];
      (userList || []).forEach((user) => {
        promises.push(
          (user.latest_transactions || []).map((txid) =>
            findTransaction(txid, true, res).then((transaction) =>
              expandSupportingTransactions(
                transaction,
                dictionaryOfTransactions
              )
            )
          )
        );
        promises.push(
          (user.pending_transactions || []).map((txid) =>
            findTransaction(txid, true, res).then((transaction) =>
              expandSupportingTransactions(
                transaction,
                dictionaryOfTransactions
              )
            )
          )
        );
      });
      promises = [].concat.apply([], promises);
      return { promises, userList };
    })
    .then(({ promises, userList }) => {
      if (Array.isArray(promises)) {
        Promise.all(promises).then((values) => {
          (values || []).forEach((tx) => {
            userList.forEach((user) => {
              const indexOfTx = (user.latest_transactions || []).indexOf(
                tx.address
              );
              const indexOfPendingTx = (
                user.pending_transactions || []
              ).indexOf(tx.address);
              if (indexOfTx > -1) {
                if (simplifyTransaction) {
                  user.latest_transactions[indexOfTx] = tx.toSimplifiedObject();
                } else user.latest_transactions[indexOfTx] = tx;
              }
              if (indexOfPendingTx > -1) {
                if (simplifyTransaction) {
                  user.pending_transactions[
                    indexOfPendingTx
                  ] = tx.toSimplifiedObject();
                } else user.pending_transactions[indexOfPendingTx] = tx;
              }
            });
          });
          const userPromises = [];
          Promise.all(userPromises).then(() => {
            hidePublicKey && userList.forEach((user) => delete user.public_key);
            return res.status(200).json(userList);
          });
        });
      }
    })
    .catch(() =>
      res.status(ERRORS.SAWTOOTH.UNAVAILABLE.errorCode).json({
        msg: req.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),
        error: req.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),
      })
    );
};

/**
 * Finds and returns the user with address = req.params.address
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {Boolean} [req.query.expand] - If true, latest & pending transactions which be expanded.
 * @param {Boolean} [req.query.simplifyUser] - If true, a simplified version of the user will be returned.
 * @param {Boolean} [req.query.simplifyTransaction] - If true, a simplified version of the users' transactions will be returned (only if the transaction are expanded).
 * @post Returns the user in res object. If an error happens, response object has the error.
 */
const getUserByAddress = (req, res) => {
  const expand = req.query.expand === "true" || false;
  const hidePublicKey = req.query.hidePublicKey === "true" || false;
  const simplifyUser = req.query.simplifyUser === "true" || false;
  const simplifyTransaction = req.query.simplifyTransaction === "true" || false;
  return findUser(req.params.address, true, res).then((user) => {
    hidePublicKey && delete user.public_key;
    if (!expand) {
      if (simplifyUser) user = user.toSimplifiedObject();
      return res.status(200).json(user);
    }
    return findAllObjects(
      TYPE.TRANSACTION,
      "GET /users",
      undefined,
      true,
      res
    ).then((transactionList) => {
      let promises = [];
      const dictionaryOfTransactions = {};
      (transactionList || []).forEach((obj) => {
        dictionaryOfTransactions[obj.address] = obj;
      });
      promises.push(
        (user.latest_transactions || []).map((txid) =>
          findTransaction(txid, true, res).then((transaction) => {
            return expandSupportingTransactions(
              transaction,
              dictionaryOfTransactions
            );
          })
        )
      );

      promises.push(
        (user.pending_transactions || []).map((txid) =>
          findTransaction(txid, true, res).then((transaction) => {
            return expandSupportingTransactions(
              transaction,
              dictionaryOfTransactions
            );
          })
        )
      );
      promises = [].concat.apply([], promises);
      return Promise.all(promises).then((values) => {
        values.forEach((tx) => {
          const indexOfTx = (user.latest_transactions || []).indexOf(
            tx.address
          );
          const indexOfPendingTx = (user.pending_transactions || []).indexOf(
            tx.address
          );
          if (indexOfTx > -1) {
            if (simplifyTransaction)
              user.latest_transactions[indexOfTx] = tx.toSimplifiedObject();
            else user.latest_transactions[indexOfTx] = tx;
          }
          if (indexOfPendingTx > -1) {
            if (simplifyTransaction)
              user.pending_transactions[
                indexOfPendingTx
              ] = tx.toSimplifiedObject();
            else user.pending_transactions[indexOfPendingTx] = tx;
          }
        });
        return res.status(200).json(user);
      });
    });
  });
};

const createUser = (req, res) =>
  putObject(TYPE.USER, HTTP_METHODS.POST, "POST /users", req, res);

const updateUser = (req, res) => {
  return findUser(req.params.address, false, res).then((existingUser) => {
    const { role, description, permissions, return_to, active } = req.body;
    if (role !== undefined) {
      existingUser.role = role;
    }
    if (description !== undefined) {
      existingUser.description = description;
    }
    if (permissions !== undefined) {
      existingUser.permissions = permissions;
    }
    if (return_to !== undefined) {
      existingUser.return_to = return_to;
    }
    if (active !== undefined) {
      existingUser.active = active;
    }
    return _updateUser(existingUser, res, "PUT /users");
  });
};

const deleteUser = (req, res) => {
  const reason = req.body.reason;
  return findUser(req.params.address, false, res).then((existingUser) => {
    const recipient = existingUser.return_to[reason];
    const promises = [];
    (existingUser.latest_transactions || []).forEach((txid) => {
      promises.push(findTransaction(txid, false, res));
    });
    return Promise.all(promises).then((arrayOfTransactions) => {
      let amountToSend = 0;
      (arrayOfTransactions || []).forEach((tx) => {
        amountToSend += tx.amount;
      });
      if (amountToSend > 0) {
        const transaction = new Transaction({
          amount: amountToSend,
          recipient,
          sender: req.params.address,
          description: `Resulting transaction of user's return_to ${reason}`,
          signature: hash512(
            `${
              existingUser.public_key
            },${amountToSend},${reason},${recipient},${new Date().toISOString()}`
          ),
        });
        req.body = transaction;
        existingUser.active = false;
        return createTransaction(req, res, { disableSender: true });
      } else {
        existingUser.active = false;
        return _updateUser(existingUser, res, "DELETE /users");
      }
    });
  });
};

//#endregion

module.exports.findUser = findUser;
module.exports.getUsers = getUsers;
module.exports.getUserByAddress = getUserByAddress;
module.exports.createUser = createUser;
module.exports.updateUser = updateUser;
module.exports.deleteUser = deleteUser;
