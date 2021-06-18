/** Common controller functionality
 * @module controllers/common
 */

const _ = require("lodash");
const crypto = require("crypto");
const { default: axios } = require("axios");
const {
  ADDRESS_PREFIX,
  HTTP_METHODS,
  TYPE,
  TRANSACTION_FAMILY,
} = require("../utils/constants");
const { SEVERITY, logFormatted } = require("../utils/logger");

const { queryState, sendTransaction } = require("../sawtooth/sawtooth-helpers");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Asset = require("../models/Asset");

//#region [AUXILIARY FUNCTIONS]

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

//#endregion

//#region [SAWTOOTH REST API FUNCTIONS]

/**
 * Finds and returns an asset in the blockchain.
 *
 * @param {TYPE} type - Type of asset, such as TRANSACTION or USER ({@link TYPE}).
 * @param {String} txid - Asset unique identification (before calculated address).
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @return {Promise<Transaction|User|null>} Promise of the asset if found or null if not found.
 */
const findByAddress = (type, txid, removeType = false, res = null) => {
  let addressToQuery;

  switch (type) {
    case TYPE.TRANSACTION:
      if (
        res &&
        res.locals &&
        res.locals.transaction &&
        res.locals.transaction[txid]
      )
        return Promise.resolve(
          new Transaction(res.locals.transaction[txid]).toObject(removeType)
        );
      addressToQuery = getTransactionAddress(txid);
      break;
    case TYPE.USER:
      if (res && res.locals && res.locals.user && res.locals.user[txid])
        return Promise.resolve(
          new User(res.locals.user[txid]).toObject(removeType)
        );
      addressToQuery = getUserAddress(txid);
      break;
  }
  return queryState(addressToQuery)
    .then((response) => {
      switch (type) {
        case TYPE.TRANSACTION:
          if (res && res.locals) {
            if (!res.locals.transaction) res.locals.transaction = {};
            res.locals.transaction[response.address] = new Transaction(
              response
            );
          }
          response = new Transaction(response).toObject(removeType);

          break;
        case TYPE.USER:
          if (res && res.locals) {
            if (!res.locals.user) res.locals.user = {};
            res.locals.user[response.address] = new User(response);
          }
          response = new User(response).toObject(removeType);
          break;
      }
      return response;
    })
    .catch((err) => {
      //State not found. There is no state data at the address specified
      if (
        err.response &&
        err.response.data &&
        err.response.data.error &&
        err.response.data.error.code === 75
      ) {
        return null;
      } else return Promise.reject(err);
    });
};

/**
 * Finds and returns all assets of a type.
 * @pre A request to an endpoint of an asset is made. The endpoint must be GET /{asset}
 * @param {String} type - Type of asset, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {Number} [limit] - Maximum number of assets to return.
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @returns {Promise<Array<Transaction|User>|Error>} - Promise of the assets returned.
 */
const findAllAssets = (
  type,
  source,
  limit = 0,
  removeType = false,
  res = null
) => {
  let assetName;
  let addressPrefix;
  switch (type) {
    case TYPE.TRANSACTION:
      assetName = "transaction";
      addressPrefix = ADDRESS_PREFIX.TRANSACTION;
      break;
    case TYPE.USER:
      assetName = "user";
      addressPrefix = ADDRESS_PREFIX.USER;
      break;
  }
  const params = {
    headers: { "Content-Type": "application/json" },
  };
  return axios
    .get(
      `${process.env.SAWTOOTH_REST}/state?address=${PREFIX + addressPrefix}${
        limit !== 0 ? `&limit=${limit}` : ""
      }`,
      params
    )
    .then((query) => {
      const assetList = _.chain(query.data.data)
        .filter(
          (item) => !_.isEmpty(JSON.parse(Buffer.from(item.data, "base64")))
        )
        .map((d) => {
          let base = JSON.parse(Buffer.from(d.data, "base64"));
          switch (type) {
            case TYPE.TRANSACTION:
              if (res) {
                if (!res.locals.transaction) res.locals.transaction = {};
                res.locals.transaction[base.address] = new Transaction(base);
              }
              return new Transaction(base).toObject(removeType);
            case TYPE.USER:
              if (res) {
                if (!res.locals.user) res.locals.user = {};
                res.locals.user[base.address] = new User(base);
              }
              return new User(base).toObject(removeType);
          }
        })
        .flatten()
        .value();
      logFormatted(
        `${source} | Querying all ${assetName}s - ${
          assetList.length
        } ${assetName}${assetList.length !== 1 ? "s" : ""} found`,
        assetList.length === 0 ? SEVERITY.ERROR : SEVERITY.SUCCESS
      );
      return assetList;
    });
};

/**
 * Creates an array of assets (namely transactions) for the Sawtooth REST API.
 *
 * @param {Array} inputs - Array of addresses that are the inputs (read access) of the transaction.
 * @param {Array} outputs - Array of addresses that are the outputs (write access) of the transaction.
 * @param {String} payload - JSON stringified object to insert into the blockchain. (Must include {func, args: {transaction, txid}})
 * @returns {Array} Array of assets (namely transactions) for the Sawtooth REST API.
 */
const buildBatch = ({ inputs, outputs, payload }, ...args) => {
  let transactions = [
    new Asset({
      inputs,
      outputs,
      payload,
    }),
  ];
  // eslint-disable-next-line no-unused-vars
  (args || []).forEach((transaction) =>
    transactions.push(buildBatch(transaction))
  );

  return [].concat.apply([], transactions);
};

/**
 * Puts an asset in the blockchain.
 *
 * @param {TYPE} type - Type of asset, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {HTTP_METHODS} httpMethod - PUT or POST (defined in @see {@link HTTP_METHODS} constants).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {User|Transaction} object - Asset object.
 * @returns {Promise<{ responseCode, msg, payload }| Error >}  Promise of the batch post request. If successfully resolved, contains responseCode, msg, payload
 */
const _putAsset = (type, httpMethod, source, object) => {
  let asset;
  let txid;
  let assetAddress;
  let assetName;

  txid = object.address;
  asset = object.toString(false, httpMethod);

  switch (type) {
    case TYPE.TRANSACTION:
      assetName = "Transaction";
      assetAddress = getTransactionAddress(txid);
      break;

    case TYPE.USER:
      assetName = "User";
      assetAddress = getUserAddress(txid);
      break;
  }

  const assetPayload = asset;

  const batch = buildBatch({
    payload: assetPayload,
    inputs: [assetAddress],
    outputs: [assetAddress],
  });

  logFormatted(`${source} | BATCH Request:`, SEVERITY.NOTIFY, ...batch);

  return sendTransaction(batch).then((sawtoothResponse) => {
    logFormatted(
      `${source}  | BATCH Response: ${sawtoothResponse.status} - ${sawtoothResponse.statusText}`,
      SEVERITY.SUCCESS
    );
    const responseCode = httpMethod === HTTP_METHODS.POST ? 201 : 200;
    const responseMessage = `${assetName} ${
      httpMethod === HTTP_METHODS.POST ? "created" : "updated"
    }`;
    const objResponse = JSON.parse(asset);
    delete objResponse.type;
    delete objResponse.httpMethod;
    return { responseCode, msg: responseMessage, payload: objResponse };
  });
};

/**
 * Builds a transaction of an asset (User, Transaction, etc).
 *
 * @param {String} type - Type of asset, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {HTTP_METHODS} httpMethod - PUT or POST (@see {@link HTTP_METHODS}).
 * @param {User|Transaction} object - Asset object, such as {@link User}, {@link Transaction}.
 * @returns {Asset} Asset (namely a transaction) of the Sawtooth REST API.
 */
const buildAssetTransaction = (type, httpMethod, object) => {
  let asset;
  let txid;
  let assetAddress;

  switch (type) {
    case TYPE.TRANSACTION:
      txid = object.address;
      asset = object.toString(false, httpMethod);
      assetAddress = getTransactionAddress(txid);
      break;

    case TYPE.USER:
      txid = object.address;
      asset = object.toString(false, httpMethod);
      assetAddress = getUserAddress(txid);
      break;
  }
  const assetPayload = asset;

  return new Asset({
    payload: assetPayload,
    inputs: [assetAddress],
    outputs: [assetAddress],
  });
};

/**
 * Puts a batch of assets into the blockchain.
 *
 * @param {HTTP_METHODS} httpMethod - PUT or POST (@see {@link HTTP_METHODS}).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {Object} arrayOfAssets - Array of assets to be inserted into the blockchain.
 * @returns {Promise<{ responseCode, msg, payload }| Error >} Promise of the batch post request. If successfully resolved, contains responseCode, msg, payload
 */
const putBatch = (httpMethod, source, arrayOfAssets) => {
  const batch = buildBatch(...arrayOfAssets);

  logFormatted(`${source} | BATCH Request:`, SEVERITY.NOTIFY, batch);
  return sendTransaction(batch).then((sawtoothResponse) => {
    logFormatted(
      `${source} | BATCH Response: ${sawtoothResponse.status} - ${sawtoothResponse.statusText}`,
      SEVERITY.SUCCESS
    );
    const responseCode = httpMethod === HTTP_METHODS.POST ? 201 : 200;
    const responseMessage = `Batch of ${arrayOfAssets.length} transaction${
      arrayOfAssets.length > 1 ? "s" : ""
    } ${httpMethod === HTTP_METHODS.POST ? "created" : "updated"}`;
    const arrayOfPayloads = [];
    batch.forEach((transaction) => {
      const payload = JSON.parse(transaction.payload);
      delete payload.type;
      arrayOfPayloads.push(payload);
    });

    return { responseCode, msg: responseMessage, payload: arrayOfPayloads };
  });
};

//#endregion

//#region [Express.js REQUEST HANDLERS]

/**
 * Puts an asset in the blockchain.
 *
 * @param {String} type - Type of asset, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {HTTP_METHODS} httpMethod - PUT or POST (@see {@link HTTP_METHODS}).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {Request} req - Http request object.
 * @param {Response} res - Response object to handle Express request.
 * @return {Promise<{ responseCode, msg, payload }| Error >} Promise of the Sawtooth REST API request response.
 */
const putAsset = (type, httpMethod, source, req, res) => {
  let asset;
  switch (type) {
    case TYPE.USER:
      asset = new User(req.body);
      break;
  }
  return _putAsset(type, httpMethod, source, asset).then(
    ({ responseCode, msg, payload }) => {
      return res.status(responseCode).json({ msg, payload });
    }
  );
};

//#endregion

module.exports.hash512 = hash512;
module.exports.getTransactionAddress = getTransactionAddress;
module.exports.getUserAddress = getUserAddress;
module.exports.findByAddress = findByAddress;
module.exports.findAllAssets = findAllAssets;
module.exports._putAsset = _putAsset;
module.exports.buildAssetTransaction = buildAssetTransaction;
module.exports.putBatch = putBatch;
module.exports.putAsset = putAsset;
