/** Express router providing user related routes
 * @module routers/dev/config
 * @requires express
 */

/**
 * express module
 * @const
 */
const express = require("express");

/**
 * Express.js router to mount config-related functions on.
 * @type {object}
 * @const
 * @namespace devConfig
 */
const router = express.Router();
const { getConfig, changeConfig } = require("../../controllers/dev/config");

/**
 * Route to get current environment variables
 * @name get/config
 * @function
 * @memberof module:routers/dev/config~devConfig
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.get("/", getConfig);

/**
 * DEV ONLY: Route to change environment variables.
 * @name post/config
 * @function
 * @memberof module:routers/dev/config~devConfig
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.post("/", changeConfig);

module.exports = router;
