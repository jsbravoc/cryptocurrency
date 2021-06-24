/**
 * @typedef APP_CONSTANTS
 * @property {number} MAXIMUM_FLOAT_PRECISION=5  The maximum float precision to avoid incorrect math operations.
 * @property {String} TRANSACTION_FAMILY="cnk-cryptocurrency"  The transaction family identifier for the transaction processor.
 * @property {String} TRANSACTION_FAMILY_VERSION="1.0"  The transaction family version for the transaction processor.
 * @property {Object} TYPE  The available types of the objects in the blockchain.
 * @property {Object} ADDRESS_PREFIX  The corresponding address prefixes for the object in the blockchain.
 * @property {Object} USER_TYPE  The types (or roles) of a user in a transaction.
 * @property {Object} HTTP_METHODS  The https methods available.
 * @property {String} LOCAL_ADDRESS  The current local IP address of the application.
 * @global
 */

/**
 * Enum for available http methods.
 * @readonly
 * @enum {String}
 */
const HTTP_METHODS = {
  /** Represents a PUT HTTP Method */
  PUT: "PUT",
  /** Represents a POST HTTP Method */
  POST: "POST",
  /** Represents a GET HTTP Method */
  GET: "GET",
  /** Represents a DELETE HTTP Method */
  DELETE: "DELETE",
};
/**
 * Enum for available objects type in the blockchain.
 * @readonly
 * @enum {String}
 */
const TYPE = {
  /** Represents a {@link User} object */
  USER: "USER",
  /** Represents a {@link Transaction} object */
  TRANSACTION: "TRANSACTION",
};

/**
 * Enum for available users (roles) in a transaction.
 * @readonly
 * @enum {String}
 */
const USER_TYPE = {
  /** Represents a sender user in a transaction */
  SENDER: "SENDER",
  /** Represents a recipient user in a transaction */
  RECIPIENT: "RECIPIENT",
};
const APP_CONSTANTS = {
  MAXIMUM_FLOAT_PRECISION: 5,
  TRANSACTION_FAMILY: "cnk-cryptocurrency",
  TRANSACTION_FAMILY_VERSION: "1.0",
  TYPE,
  ADDRESS_PREFIX: {
    TRANSACTION: "00",
    USER: "01",
  },
  USER_TYPE,
  HTTP_METHODS,
};
module.exports = Object.freeze({ ...APP_CONSTANTS });
