/** Express router providing user related routes
 * @module routers/users
 * @requires express
 */

/**
 * express module.
 * @const
 */
const express = require("express");
/**
 * Express.js router to mount user-related functions on.
 * @type {object}
 * @const
 * @namespace usersRouter
 */
const router = express.Router();
const {
  createUser,
  deleteUser,
  getUserByAddress,
  getUsers,
  updateUser,
} = require("../controllers/users");

const {
  validateUserCreation,
  validateUserRetrieval,
  validateUserUpdate,
  validateUserDelete,
} = require("../validators/users");

/**
 * Route to retrieve users from the blockchain.
 * @name get/users
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {String} path - Express path
 * @param {Function} callback - Express middleware.
 */
router.get("/", getUsers);

/**
 * Route to create a user inside the blockchain.
 * @name post/users
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.post("/", [...validateUserCreation], createUser);

/**
 * Route to retrieve a user from the blockchain.
 * @name get/users/:address
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.get("/:address", [...validateUserRetrieval], getUserByAddress);

/**
 * Route to update a user from the blockchain.
 * @name put/users/:address
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.put("/:address", [...validateUserUpdate], updateUser);

/**
 * Route to inactivate (disable) a user from the blockchain.
 * @name delete/users/:address
 * @function
 * @memberof module:routers/users~usersRouter
 * @inner
 * @param {String} path - Express path
 * @param {Array} validationChain - Express middleware validation chain.
 * @param {Function} callback - Express middleware.
 */
router.delete("/:address", [...validateUserDelete], deleteUser);

module.exports = router;
