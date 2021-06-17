/** Users controller functionality
 * @module controllers/users
 */

const { SEVERITY, logFormatted } = require("../utils/logger");

const { HTTP_METHODS, TYPE } = require("../utils/constants");
const {
  findAllAssets,
  findByAddress,
  putAsset,
  _putAsset,
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
const findUser = (
  address,
  removeSignature = true,
  removeType = true,
  res = null
) => findByAddress(TYPE.USER, address, removeSignature, removeType, res);

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
  _putAsset(TYPE.USER, HTTP_METHODS.PUT, source, user).then(
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
 * @post Returns array of users in res object. If an error happens, response object has the error.
 */
const getUsers = (req, res) => {
  const limit = Number.isNaN(Number(req.query.limit))
    ? 0
    : Number(req.query.limit);
  const hidePublicKey = req.query.hidePublicKey === "true" || false;
  const assetArray = [
    findAllAssets(TYPE.USER, "GET /users", limit, true, true, res),
  ];
  const expanded = req.query.expanded === "true" || false;

  if (expanded) {
    assetArray.push(
      findAllAssets(TYPE.TRANSACTION, "GET /users", limit, false, true, res)
    );
  }
  return Promise.all(assetArray)
    .then(([userList, transactionList]) => {
      if (!expanded) {
        hidePublicKey && userList.forEach((user) => delete user.public_key);
        return res.status(200).json(userList);
      }
      const dictionaryOfTransactions = {};
      (transactionList || []).forEach((asset) => {
        dictionaryOfTransactions[asset.signature] = asset;
      });

      let promises = [];
      (userList || []).forEach((user) => {
        promises.push(
          (user.latest_transactions || []).map((txid) =>
            findTransaction(txid).then((transaction) =>
              expandSupportingTransactions(
                transaction,
                dictionaryOfTransactions
              )
            )
          )
        );
        promises.push(
          (user.pending_transactions || []).map((txid) =>
            findTransaction(txid).then((transaction) =>
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
                tx.signature
              );
              const indexOfPendingTx = (
                user.pending_transactions || []
              ).indexOf(tx.signature);
              if (indexOfTx > -1) {
                user.latest_transactions[indexOfTx] = tx;
              }
              if (indexOfPendingTx > -1) {
                user.pending_transactions[indexOfPendingTx] = tx;
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
 * @post Returns the user in res object. If an error happens, response object has the error.
 */
const getUserByAddress = (req, res) => {
  const expanded = req.query.expanded === "true" || false;
  const hidePublicKey = req.query.hidePublicKey === "true" || false;
  return findUser(req.params.address, true, true, res).then((user) => {
    hidePublicKey && delete user.public_key;
    if (!expanded) {
      return res.status(200).json(user);
    }
    return findAllAssets(
      TYPE.TRANSACTION,
      "GET /users",
      0,
      false,
      true,
      res
    ).then((transactionList) => {
      let promises = [];
      const dictionaryOfTransactions = {};
      (transactionList || []).forEach((asset) => {
        dictionaryOfTransactions[asset.signature] = asset;
      });
      promises.push(
        (user.latest_transactions || []).map((txid) =>
          findTransaction(txid).then((transaction) => {
            return expandSupportingTransactions(
              transaction,
              dictionaryOfTransactions
            );
          })
        )
      );

      promises.push(
        (user.pending_transactions || []).map((txid) =>
          findTransaction(txid).then((transaction) => {
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
            tx.signature
          );
          const indexOfPendingTx = (user.pending_transactions || []).indexOf(
            tx.signature
          );
          if (indexOfTx > -1) {
            user.latest_transactions[indexOfTx] = tx;
          }
          if (indexOfPendingTx > -1) {
            user.pending_transactions[indexOfPendingTx] = tx;
          }
        });
        return res.status(200).json(user);
      });
    });
  });
};

const createUser = (req, res) =>
  putAsset(TYPE.USER, HTTP_METHODS.POST, "POST /users", req, res);

const updateUser = (req, res) => {
  return findUser(req.params.address, true, true, res).then((existingUser) => {
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
  return findUser(req.params.address, true, true, res).then((existingUser) => {
    const recipient = existingUser.return_to[reason];
    const promises = [];
    (existingUser.latest_transactions || []).forEach((txid) => {
      promises.push(findTransaction(txid));
    });
    return Promise.all(promises).then((arrayOfTransactions) => {
      let amountToSend = 0;
      (arrayOfTransactions || []).forEach((tx) => {
        amountToSend += tx.amount;
      });
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
