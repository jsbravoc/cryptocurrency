/** Express router providing user related routes
 * @module routers/cryptocurrency
 * @requires express
 */

/**
 * express module.
 * @const
 */
const express = require("express");

/**
 * Express.js router to mount cryptocurrency transactions-related functions on.
 * @type {object}
 * @const
 * @namespace cryptoRouter
 */
const router = express.Router();
const {
  createTransaction,
  getTransactionByAddress,
  getTransactions,
  updateTransaction,
} = require("../controllers/cryptocurrency");
const {
  validateTransactionAddress,
  validateTransactionUpdateRequest,
  verifyPostTransaction,
  inputValidation,
} = require("../validators/cryptocurrency");

/**
 * Route to retrieve transactions from the blockchain.
 * @name get/cryptocurrency
 * @function
 * @memberof module:routers/cryptocurrency~cryptoRouter
 * @inner
 * @param {String} path - Express path
 * @param {Function} callback - Express middleware.
 */
router.get("/", getTransactions);

/**
 * Route to create a transaction inside the blockchain.
 * @name post/cryptocurrency
 * @function
 * @memberof module:routers/cryptocurrency~cryptoRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.post("/", [inputValidation, verifyPostTransaction], createTransaction);

/**
 * Route to retrieve a transaction from the blockchain.
 * @name get/cryptocurrency/:address
 * @function
 * @memberof module:routers/cryptocurrency~cryptoRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.get(
  "/:address",
  [...validateTransactionAddress],
  getTransactionByAddress
);

/**
 * Route to update (and/or approve/reject) a transaction from the blockchain.
 * @name put/cryptocurrency/:address
 * @function
 * @memberof module:routers/cryptocurrency~cryptoRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.put(
  "/:address",
  [...validateTransactionAddress, ...validateTransactionUpdateRequest],
  updateTransaction
);

module.exports = router;
