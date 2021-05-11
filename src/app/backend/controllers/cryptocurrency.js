/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
const mongo = require("../database/utils/mongo");

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

//#region [AUXILIARY FUNCTIONS]

/**
 * Finds a transaction in the blockchain.
 *
 * @param {String} address - Address of the transaction.
 * @param {Boolean} [removeSignature] - Boolean that indicates if the signature should be removed.
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Object} [res] - Express.js response object, used to access locals.
 * @return {Promise} Promise containing the transaction object or null if not found.
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
 * @return {Promise} Promise of the sawtooth REST API request response.
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
 * @param {Object} [res] - Express.js response object, used to access locals.
 * @return {Promise} Promise of object containing {existingSender, existingRecipient, pendingAmount, usedTransactions}
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
        (existingSender.lastest_transactions || []).forEach((txid) =>
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
 * @param {Object} [dictionaryOfTransactions] - Key-value dictionary of transactions (address: transaction).
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
    } else if (typeof transaction === "string") {
      transaction = await findTransaction(transaction);
      await expandSupportingTransactions(
        transaction,
        dictionaryOfTransactions,
        res
      );
      return transaction;
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
    true
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
    .catch((err) =>
      res
        .status(503)
        .json({ msg: "Sawtooth service unavailable", error: { ...err } })
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
  return findTransaction(req.params.address, false, true, res)
    .then((tx) => {
      const expanded = req.query.expanded === "true" || false;
      if (!expanded) {
        return res.status(200).json(tx);
      }
      return expandSupportingTransactions(tx, undefined, res).then(() =>
        res.status(200).json(tx)
      );
    })
    .catch((err) =>
      res
        .status(503)
        .json({ msg: "Sawtooth service unavailable", error: { ...err } })
    );
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
  signature = hash512(
    `${signature}${(newTx.creationDate || new Date()).getTime()}`
  );
  newTx.signature = signature;

  let newChangeTransaction;
  let newSender;

  return getSupportingTransactions(newTx, res).then(
    ({
      pendingAmount,
      usedTransactions,
      existingRecipient,
      existingSender,
    }) => {
      // Set supporting transactions (array in Transaction and array of addresses)
      const transactionInput = [];

      if (valid) {
        (usedTransactions || []).forEach((utx) => {
          newTx.addSupportingTransaction(utx.signature);
          transactionInput.push(getTransactionAddress(utx.signature));
        });
      }

      // Create new transaction
      const transactionAddress = getTransactionAddress(newTx.signature);
      const transactionPayload = JSON.stringify({
        func: "post",
        args: {
          transaction: newTx.toString(false, false),
          txid: newTx.signature,
        },
      });
      const newTransaction = {
        inputs: [transactionAddress, ...transactionInput],
        outputs: [transactionAddress],
        payload: transactionPayload,
      };

      // Update recipient user
      let newRecipientUser = new User(existingRecipient);
      if (disableRecipient) newRecipientUser.active = false;
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

        if (valid) {
          // Remove used transactions, recalculate user balance
          if (Array.isArray(usedTransactions)) {
            // eslint-disable-next-line max-len
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
            // eslint-disable-next-line max-len
            //TODO: Use I18n
            const changeDescription = `Resulting change of transaction ${newTx.signature}:\n Sender: ${sender}\nRecipient: ${recipient}\nAmount: ${amount}\nChange: ${change}`;
            //TODO: Change creation of hash
            const hashedDecription = hash512(
              `${changeDescription},${new Date().toISOString()}`
            );
            let changeTransaction = new Transaction({
              amount: change,
              recipient: sender,
              description: changeDescription,
              signature: hashedDecription,
            });
            if (Array.isArray(usedTransactions)) {
              // eslint-disable-next-line max-len
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
              hashedDecription
            );
            const changeTransactionPayload = JSON.stringify({
              func: "post",
              args: { transaction: changeTransaction, txid: hashedDecription },
            });
            newChangeTransaction = {
              inputs: [changeTransactionAddress, ...transactionInput],
              outputs: [changeTransactionAddress],
              payload: changeTransactionPayload,
            };
          }
        } else {
          newSenderUser.addTransaction(
            USER_TYPE.RECIPIENT,
            amount,
            signature,
            valid
          );
        }

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
        HTTP_METHODS.POST,
        "POST /cryptocurrency",
        transactionsToSend
      )
        .then(({ responseCode }) => {
          delete newTx.type;
          //TODO: Use I18n
          return res
            .status(responseCode)
            .json({ msg: "Transaction created", payload: newTx });
        })
        .catch((err) => {
          logFormatted(
            `POST /cryptocurrency | BATCH Response: ${err}`,
            SEVERITY.ERROR
          );
          return res.status(500).json({ err });
        });
    }
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
        return _updateTransaction(existingTx)
          .then(({ responseCode }) => {
            delete existingTx.type;
            return res
              .status(responseCode)
              .json({ msg: "Transaction updated", payload: existingTx });
          })
          .catch((err) => {
            logFormatted(
              `POST /cryptocurrency | BATCH Response: ${err}`,
              SEVERITY.ERROR
            );
            return res.status(500).json({ err });
          });
      }
      if (!approve) {
        existingTx.valid = false;
        existingTx.pending = false;
      } else {
        existingTx.valid = true;
        existingTx.pending = false;
      }
      const { sender, recipient, amount, signature, valid } = existingTx;
      const transactionInput = [];
      let newChangeTransaction;
      let newSender;
      return getSupportingTransactions(existingTx, res).then(
        ({
          pendingAmount,
          usedTransactions,
          existingRecipient,
          existingSender,
        }) => {
          let newRecipientUser = new User(existingRecipient);
          let newRecipient;
          newRecipientUser.removePendingTransaction(signature);

          let newSenderUser;
          if (existingSender) {
            newSenderUser = new User(existingSender);
            newSenderUser.removePendingTransaction(signature);
          }
          if (existingTx.valid) {
            if (Array.isArray(usedTransactions)) {
              usedTransactions.forEach((utx) => {
                existingTx.addSupportingTransaction(utx.signature);
                transactionInput.push(getTransactionAddress(utx.signature));
              });
            }
            newRecipientUser.addTransaction(
              USER_TYPE.RECIPIENT,
              amount,
              signature,
              valid
            );

            // Update sender user
            if (newSenderUser) {
              // Remove used transactions, recalculate user balance
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
                const changeDescription = `Resulting change of transaction ${existingTx.signature}:\n Sender: ${sender}\nRecipient: ${recipient}\nAmount: ${amount}\nChange: ${change}`;
                const hashedDecription = hash512(
                  `changeDescription, ${new Date().toISOString()}`
                );
                let changeTransaction = new Transaction({
                  amount: change,
                  recipient: sender,
                  description: changeDescription,
                  signature: hashedDecription,
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
                  hashedDecription
                );
                const changeTransactionPayload = JSON.stringify({
                  func: "post",
                  args: {
                    transaction: changeTransaction,
                    txid: hashedDecription,
                  },
                });
                newChangeTransaction = {
                  inputs: [changeTransactionAddress, ...transactionInput],
                  outputs: [changeTransactionAddress],
                  payload: changeTransactionPayload,
                };
              }
            }
          }

          newRecipientUser = newRecipientUser.toString(false, false);
          const recipientAddress = getUserAddress(recipient);
          const recipientPayload = JSON.stringify({
            func: "post",
            args: { transaction: newRecipientUser, txid: recipient },
          });
          newRecipient = {
            inputs: [recipientAddress],
            outputs: [recipientAddress],
            payload: recipientPayload,
          };

          if (newSenderUser) {
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

          const transactionAddress = getTransactionAddress(
            existingTx.signature
          );
          const transactionPayload = JSON.stringify({
            func: "post",
            args: {
              transaction: existingTx.toString(false, false),
              txid: existingTx.signature,
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
            HTTP_METHODS.PUT,
            "PUT /cryptocurrency",
            transactionsToSend
          )
            .then(({ responseCode }) => {
              delete existingTx.type;
              return res
                .status(responseCode)
                .json({ msg: "Transaction updated", payload: existingTx });
            })
            .catch((err) => {
              logFormatted(
                `POST /cryptocurrency | BATCH Response: ${err}`,
                SEVERITY.ERROR
              );
              return res.status(500).json({ err });
            });
        }
      );
    }
  );
};

const getTransactionHistory = async (req, res) => {
  const page = req.query.page || 0;
  const PAGE_SIZE = 2;
  const mongoClient = await mongo.getClient();
  const userCollection = mongoClient
    .db("mydb")
    .collection("cnk-cryptocurrency_users");

  const history = [];
  const cursor = await userCollection
    .find({ root: req.root })
    .sort({ block_num: -1 })
    .skip(PAGE_SIZE * page)
    .limit(PAGE_SIZE);
  await new Promise((resolve) => {
    cursor.forEach((doc) => {
      history.push(doc);
    }, resolve);
  });
  return res.json(history);
};

//#endregion

module.exports.findTransaction = findTransaction;
module.exports.getSupportingTransactions = getSupportingTransactions;
module.exports.expandSupportingTransactions = expandSupportingTransactions;
module.exports.getTransactions = getTransactions;
module.exports.getTransactionByAddress = getTransactionByAddress;
module.exports.createTransaction = createTransaction;
module.exports.updateTransaction = updateTransaction;
module.exports.getTransactionHistory = getTransactionHistory;
