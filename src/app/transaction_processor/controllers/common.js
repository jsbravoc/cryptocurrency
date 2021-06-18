const crypto = require("crypto");
const {
  ADDRESS_PREFIX,
  HTTP_METHODS,
  TYPE,
  TRANSACTION_FAMILY,
} = require("../utils/constants");
const _ = require("lodash");
const {
  InvalidTransaction,
  InternalError,
} = require("sawtooth-sdk/processor/exceptions");
/**
 * Generates the sha512 of a string
 *
 * @param {String} x - The string to hash.
 * @returns {String} The hashed string.
 */
const hash512 = (x) => crypto.createHash("sha512").update(x).digest("hex");

/**
 * Generates the address of a key with a predefined length
 *
 * @param {String} key - The string to hash and generate an address,
 * @param {Number} [length] - The length of the resulting address (used to substring the string).
 * @returns {String} The hashed string with the desired length.
 */
const getAddress = (key, length = 64) => hash512(key).slice(0, length);

const PREFIX = getAddress(TRANSACTION_FAMILY, 6);

/**
 * Generates the address of a transaction
 *
 * @param {String} txid - Unique transaction id.
 * @returns {String} The generated address of the transaction.
 */
const getTransactionAddress = (txid) =>
  PREFIX + ADDRESS_PREFIX.TRANSACTION + getAddress(txid, 62);

/**
 * Generates the address of a user.
 *
 * @param {String} userId - Unique user id.
 * @returns {String} The generated address of the user.
 */
const getUserAddress = (userId) =>
  PREFIX + ADDRESS_PREFIX.USER + getAddress(userId, 62);

async function getRawState(context, addressRaw, timeout) {
  let possibleAddressValues = await context.getState([addressRaw], timeout);
  let stateValueRep = possibleAddressValues[addressRaw];

  if (!stateValueRep || stateValueRep.length == 0) {
    return null;
  }
  return stateValueRep;
}

async function getState(context, address, key, timeout) {
  const rawState = await getRawState(context, address(key), timeout);
  if (_.isUndefined(rawState)) {
    return;
  }

  let values = JSON.parse(Buffer.from(rawState, "utf8").toString());
  if (!_.isArray(values)) {
    throw new InternalError("State Error");
  }

  let f = _.find(values, (v) => {
    return v.key === key;
  });
  if (f) {
    return f.value;
  }
  return;
}

async function putState(context, address, key, value, timeout) {
  let addresses = await context.setState(
    {
      [address(key)]: Buffer.from(JSON.stringify(value), "utf8"),
    },
    timeout
  );

  if (addresses.length === 0) {
    throw new InternalError("State Error!");
  }
}

async function deleteState(context, address, key, timeout) {
  const rawState = await getRawState(context, address(key), timeout);
  if (_.isUndefined(rawState)) {
    return;
  }

  let toSave;
  let values = JSON.parse(Buffer.from(rawState, "utf8").toString());
  if (!_.isArray(values)) {
    throw new InternalError("State Error");
  }
  toSave = _.filter(values, (v) => {
    return v.key !== key;
  });

  if (toSave.length > 0) {
    let addresses = await context.setState(
      {
        [address(key)]: Buffer.from(JSON.stringify(toSave), "utf8"),
      },
      timeout
    );

    if (addresses.length === 0) {
      throw new InternalError("State Error!");
    }
    return;
  }

  let addresses = await context.deleteState([address(key)], timeout);
  if (addresses.length === 0) {
    throw new InternalError("State Error!");
  }
}

module.exports.PREFIX = PREFIX;
module.exports.hash512 = hash512;
module.exports.getRawState = getRawState;
module.exports.getTransactionAddress = getTransactionAddress;
module.exports.getUserAddress = getUserAddress;
