/** Cryptocurrency controller functionality
 * @module controllers/cryptocurrency
 */

const { SEVERITY, logFormatted } = require("../utils/logger");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const {
  MAXIMUM_FLOAT_PRECISION,
  TYPE,
  USER_TYPE,
  HTTP_METHODS,
} = require("../utils/constants");
const {
  findAllAssets,
  findByAddress,
  getTransactionAddress,
  getUserAddress,
  hash512,
  _putAsset,
  putBatch,
} = require("./common");
const { ERRORS } = require("../utils/errors");

//#region [AUXILIARY FUNCTIONS]

/**
 * Creates a collision-free signature for a transaction.
 *
 * @param {String} signature - Signature of the transaction.
 * @param {Date} [creationDate]  - Transaction's creation date.
 * @return {String} New signature that avoids collisions.
 */
const createSignature = (signature, creationDate = new Date()) =>
  hash512(`${signature}${creationDate.getTime()}`);

/**
 * Finds a transaction in the blockchain.
 *
 * @param {String} address - Address of the transaction.
 * @param {Boolean} [removeSignature] - Boolean that indicates if the signature should be removed.
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @return {Promise<Transaction|null>} Promise containing the transaction object or null if not found.
 */
const findTransaction = (
  address,
  removeSignature = false,
  removeType = true,
  res = null
) => findByAddress(TYPE.TRANSACTION, address, removeSignature, removeType, res);

/**
 * Updates a transaction in the blockchain.
 *
 * @param {Transaction} transaction - The transaction to update.
 * @return {Promise<{ responseCode, msg, payload }| Error >} Promise of the sawtooth REST API request response.
 */
// eslint-disable-next-line no-unused-vars
const _updateTransaction = (transaction) =>
  _putAsset(
    TYPE.TRANSACTION,
    HTTP_METHODS.PUT,
    "PUT [LOCAL] /cryptocurrency",
    transaction
  );

/**
 * Fetches all the supporting transactions required for a transaction.
 *
 * @param {Transaction} transaction - The transaction which requires supporting transactions.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @return {Promise<{existingSender, existingRecipient, pendingAmount, usedTransactions}>} Promise of object containing {existingSender, existingRecipient, pendingAmount, usedTransactions}
 */
const getSupportingTransactions = (transaction, res = null) => {
  const { amount, recipient, sender } = transaction;
  let userPromises = [];

  userPromises.push(findByAddress(TYPE.USER, recipient, false, false, res));
  if (sender) {
    userPromises.push(findByAddress(TYPE.USER, sender, false, false, res));
  }

  return Promise.all(userPromises).then(
    ([existingRecipient, existingSender]) => {
      if (sender) {
        let pendingAmount = amount;
        let usedTransactions = [];
        const validTransactionsPromises = [];
        (existingSender.latest_transactions || []).forEach((txid) =>
          validTransactionsPromises.push(
            findTransaction(txid, false, true, res)
          )
        );
        return Promise.all(validTransactionsPromises).then(
          (supportingTransactions) => {
            for (
              let index = 0;
              index < supportingTransactions.length && pendingAmount > 0;
              index += 1
            ) {
              const usedTx = supportingTransactions[index];
              pendingAmount -= Number(usedTx.amount);
              usedTransactions.push(usedTx);
            }
            pendingAmount = Number(
              pendingAmount.toFixed(MAXIMUM_FLOAT_PRECISION)
            );
            return {
              existingSender,
              existingRecipient,
              pendingAmount,
              usedTransactions,
            };
          }
        );
      }
      return {
        pendingAmount: null,
        usedTransactions: null,
        existingRecipient,
        existingSender: null,
      };
    }
  );
};

/**
 * Expands the supporting transactions of a transaction.
 *
 * @param {Transaction} transaction - The transaction which will be expanded.
 * @param {Object<String, Transaction>} [dictionaryOfTransactions] - Key-value dictionary of transactions (address: transaction).
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @post transaction parameter will have its supporting transactions expanded.
 */
const expandSupportingTransactions = async (
  transaction,
  dictionaryOfTransactions,
  res = null
) => {
  if (!dictionaryOfTransactions) {
    dictionaryOfTransactions = {};
    const assetList = await findAllAssets(
      TYPE.TRANSACTION,
      "GET /cryptocurrency"
    );
    assetList.forEach((asset) => {
      dictionaryOfTransactions[asset.signature] = asset;
    });
  }
  if (transaction) {
    if (Array.isArray(transaction.supporting_transactions)) {
      for (
        let index = 0;
        index < transaction.supporting_transactions.length;
        index += 1
      ) {
        const stxid = transaction.supporting_transactions[index];
        const stx =
          typeof stxid === "object"
            ? stxid
            : dictionaryOfTransactions[stxid] ||
              (await findTransaction(stxid, false, true, res));
        if (
          stx &&
          Array.isArray(stx.supporting_transactions) &&
          typeof stx.supporting_transactions[0] === "string"
        ) {
          transaction.supporting_transactions[
            index
          ] = await expandSupportingTransactions(
            stx,
            dictionaryOfTransactions,
            res
          );
        } else {
          transaction.supporting_transactions[index] = stx;
        }
      }
    }
  }
  return transaction;
};

//#endregion

//#region [Express.js REQUEST HANDLERS]

/**
 * Finds and returns all (or up to limit query parameter) transactions.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {Boolean} [req.query.expanded] - If true supporting transactions which be expanded.
 * @param {Boolean} [req.query.hidePending] - If true, pending transactions will not be returned.
 * @param {Boolean} [req.query.hideInvalid] - If true, invalid transactions will not be returned.
 * @param {Number} [req.query.limit] - Maximum number of transactions to return.
 * @post Returns array of transactions in res object. If an error happens, response object has the error.
 */
const getTransactions = (req, res) => {
  const expanded = req.query.expanded === "true" || false;
  const hidePending = req.query.hidePending === "true" || false;
  const hideInvalid = req.query.hideInvalid === "true" || false;
  const limit = Number.isNaN(Number(req.query.limit))
    ? 0
    : Number(req.query.limit);
  return findAllAssets(
    TYPE.TRANSACTION,
    "GET /cryptocurrency",
    limit,
    false,
    true,
    res
  )
    .then((assetList) => {
      assetList = assetList.sort(
        (a, b) => new Date(a.creationDate) - new Date(b.creationDate)
      );
      if (hidePending) {
        assetList = assetList.filter((x) => !x.pending);
      }
      if (hideInvalid) {
        assetList = assetList.filter((x) => x.valid);
      }
      if (!expanded) {
        return res.json(assetList.map((transaction) => transaction.toObject()));
      }

      const dictionaryOfAssets = {};
      assetList.forEach((asset) => {
        dictionaryOfAssets[asset.signature] = asset;
      });
      const promises = [];
      assetList.forEach((tx) =>
        promises.push(expandSupportingTransactions(tx, dictionaryOfAssets, res))
      );
      Promise.all(promises).then(() => {
        return res
          .status(200)
          .json(assetList.map((transaction) => transaction.toObject()));
      });
    })
    .catch(() =>
      res.status(ERRORS.SAWTOOTH.UNAVAILABLE.errorCode).json({
        msg: req.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),
        error: req.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),
      })
    );
};

/**
 * Finds and returns the transaction with address = req.params.address
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {String} req.params.address - Transaction address to query.
 * @post Returns the transaction in res object. If an error happens, response object has the error.
 */
const getTransactionByAddress = (req, res) => {
  return findTransaction(req.params.address, false, true, res).then((tx) => {
    const expanded = req.query.expanded === "true" || false;
    if (!expanded) {
      return res.status(200).json(tx);
    }
    return expandSupportingTransactions(tx, undefined, res).then(() =>
      res.status(200).json(tx)
    );
  });
};

/**
 * Creates a transaction in the blockchain.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {Object} disableOptions - Options to disable the sender and/or recipient with the transaction.
 * @param {Boolean} disableOptions.disableSender - If true, the sender will be disabled upon the transaction creation.
 * @param {Boolean} disableOptions.disableRecipient - If true, the recipient will be disabled upon the transaction creation.
 * @post Returns and object containing a msg and payload in res object. If an error happens, response object has the error.
 */
const createTransaction = (
  req,
  res,
  { disableSender = false, disableRecipient = false } = null
) => {
  const newTx = new Transaction(req.body);
  const { sender, recipient, amount, valid } = newTx;
  let { signature } = newTx;
  //Avoid transaction collisions
  signature = createSignature(signature, newTx.creationDate);
  newTx.signature = signature;

  return createTransactionPayload(
    newTx,
    amount,
    signature,
    sender,
    recipient,
    valid,
    HTTP_METHODS.POST,
    {
      disableSender: disableSender || false,
      disableRecipient: disableRecipient || false,
    },
    req,
    res
  );
};

/**
 * Updates a transaction in the blockchain.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Response object to handle Express request.
 * @param {String} req.params.address - Transaction address to update.
 * @param {Boolean} [req.query.approve] - If true, the transaction will be approved, otherwise it will be rejected.
 * @post Returns the transaction in res object. If an error happens, response object has the error.
 */
const updateTransaction = (req, res) => {
  let approve;
  if (req.query.approve) approve = req.query.approve === "true" || false;

  return findTransaction(req.params.address, false, false, res).then(
    (existingTx) => {
      if (req.body.description) {
        existingTx.description = req.body.description;
      }
      if (approve === undefined) {
        return _updateTransaction(existingTx).then(({ responseCode }) => {
          delete existingTx.type;
          return res.status(responseCode).json({
            msg: req.t("MESSAGES.SUCCESSFUL_REQUEST.TRANSACTION.UPDATE"),
            payload: existingTx,
          });
        });
      }
      existingTx.valid = approve;
      existingTx.pending = false;
      const { sender, recipient, amount, signature, valid } = existingTx;
      return createTransactionPayload(
        existingTx,
        amount,
        signature,
        sender,
        recipient,
        valid,
        HTTP_METHODS.PUT,
        {
          disableSender: false,
          disableRecipient: false,
        },
        req,
        res
      );
    }
  );
};

const createTransactionPayload = (
  transaction,
  amount,
  signature,
  sender,
  recipient,
  valid,
  method = "POST",
  options = { disableRecipient: false, disableSender: false },
  req,
  res
) => {
  const { disableRecipient, disableSender } = options;
  let newChangeTransaction;
  let newSender;
  return getSupportingTransactions(transaction, res).then(
    ({
      pendingAmount,
      usedTransactions,
      existingRecipient,
      existingSender,
    }) => {
      // Update recipient user
      let newRecipientUser = new User(existingRecipient);
      if (disableRecipient) newRecipientUser.active = false;
      if (method === HTTP_METHODS.PUT)
        newRecipientUser.removePendingTransaction(signature);

      // Set supporting transactions (array in Transaction and array of addresses)
      const transactionInput = [];

      if (valid) {
        (usedTransactions || []).forEach((utx) => {
          transaction.addSupportingTransaction(utx.signature);
          transactionInput.push(getTransactionAddress(utx.signature));
        });
      }
      newRecipientUser.addTransaction(
        USER_TYPE.RECIPIENT,
        amount,
        signature,
        valid
      );
      newRecipientUser = newRecipientUser.toString(false, false);
      const recipientAddress = getUserAddress(recipient);
      const recipientPayload = JSON.stringify({
        func: "post",
        args: { transaction: newRecipientUser, txid: recipient },
      });
      const newRecipient = {
        inputs: [recipientAddress],
        outputs: [recipientAddress],
        payload: recipientPayload,
      };

      // Update sender user
      if (existingSender) {
        let newSenderUser = new User(existingSender);
        if (disableSender) newSenderUser.active = false;
        if (method === HTTP_METHODS.PUT)
          newSenderUser.removePendingTransaction(signature);

        if (valid) {
          if (Array.isArray(usedTransactions)) {
            usedTransactions.forEach((tx) =>
              newSenderUser.addTransaction(
                USER_TYPE.SENDER,
                tx.amount,
                tx.signature,
                valid
              )
            );
          }

          const change = -pendingAmount;
          if (change > 0) {
            const changeDescription = req.t(
              "MESSAGES.CHANGE_TRANSACTION_DESCRIPTION",
              {
                signature: transaction.signature,
                input: -pendingAmount + amount,
                amount,
                change,
              }
            );
            const changeTxSignature = hash512(
              `changeof:${transaction.signature}`
            );
            let changeTransaction = new Transaction({
              amount: change,
              recipient: sender,
              description: changeDescription,
              signature: changeTxSignature,
            });
            if (Array.isArray(usedTransactions)) {
              usedTransactions.forEach((utx) =>
                changeTransaction.addSupportingTransaction(utx.signature)
              );
            }

            newSenderUser.addTransaction(
              USER_TYPE.RECIPIENT,
              changeTransaction.amount,
              changeTransaction.signature
            );

            changeTransaction = changeTransaction.toString(false, false);

            const changeTransactionAddress = getTransactionAddress(
              changeTxSignature
            );
            const changeTransactionPayload = JSON.stringify({
              func: "post",
              args: {
                transaction: changeTransaction,
                txid: changeTxSignature,
              },
            });
            newChangeTransaction = {
              inputs: [changeTransactionAddress, ...transactionInput],
              outputs: [changeTransactionAddress],
              payload: changeTransactionPayload,
            };
          }
        }
        newSenderUser.addTransaction(
          USER_TYPE.RECIPIENT,
          amount,
          signature,
          valid
        );

        newSenderUser = newSenderUser.toString(false, false);
        const senderAddress = getUserAddress(sender);
        const senderPayload = JSON.stringify({
          func: "post",
          args: { transaction: newSenderUser, txid: sender },
        });
        newSender = {
          inputs: [senderAddress],
          outputs: [senderAddress],
          payload: senderPayload,
        };
      }

      // Create new transaction
      const transactionAddress = getTransactionAddress(transaction.signature);
      const transactionPayload = JSON.stringify({
        func: "post",
        args: {
          transaction: transaction.toString(false, false),
          txid: transaction.signature,
        },
      });
      const newTransaction = {
        inputs: [transactionAddress, ...transactionInput],
        outputs: [transactionAddress],
        payload: transactionPayload,
      };

      const transactionsToSend = [{ ...newTransaction }];
      if (newRecipient) {
        transactionsToSend.push({ ...newRecipient });
      }
      if (newSender) {
        transactionsToSend.push({ ...newSender });
      }
      if (newChangeTransaction) {
        transactionsToSend.push({ ...newChangeTransaction });
      }
      return putBatch(
        method,
        `${method} /cryptocurrency`,
        transactionsToSend
      ).then(({ responseCode }) => {
        delete transaction.type;
        return res.status(responseCode).json({
          msg:
            method === HTTP_METHODS.POST
              ? req.t("MESSAGES.SUCCESSFUL_REQUEST.TRANSACTION.CREATION")
              : req.t("MESSAGES.SUCCESSFUL_REQUEST.TRANSACTION.UPDATE"),
          payload: transaction,
        });
      });
    }
  );
};

//#endregion

module.exports.createSignature = createSignature;
module.exports.findTransaction = findTransaction;
module.exports.getSupportingTransactions = getSupportingTransactions;
module.exports.expandSupportingTransactions = expandSupportingTransactions;
module.exports.getTransactions = getTransactions;
module.exports.getTransactionByAddress = getTransactionByAddress;
module.exports.createTransaction = createTransaction;
module.exports.updateTransaction = updateTransaction;
