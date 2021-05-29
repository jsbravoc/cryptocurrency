/** Express router providing user related routes
 * @module routers/enforcer
 * @requires express
 */

/**
 * express module.
 * @const
 */
const express = require("express");

/**
 * Express.js router to mount enforced validations-related functions on.
 * @type {object}
 * @const
 * @namespace enforcerRouter
 */
const router = express.Router();

const {
  enforceValidTransactionsMiddleware,
} = require("../enforcer/cryptocurrency");

/**
 * Route to enforce valid transaction in the blockchain.
 * @name post/enforcer
 * @function
 * @memberof module:routers/enforcer~enforcerRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.post("/", enforceValidTransactionsMiddleware, (req, res) =>
  res.status(200).json({ msg: "Ok" })
);

module.exports = router;
