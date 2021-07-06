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

const { queryState, sendBatch } = require("../sawtooth/sawtooth_controller");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const SawtoothTransaction = require("../models/SawtoothTransaction");

const cacheManager = require("cache-manager");
const redisStore = require("cache-manager-redis");

//Wrap redisCache functionality
let redisCache = {
  get: () => Promise.resolve(undefined),
  set: () => Promise.resolve(undefined),
  del: () => Promise.resolve(undefined),
};

if (
  process.env.USE_REDIS === "true" &&
  process.env.REDIS_HOST !== undefined &&
  process.env.REDIS_PORT !== undefined
)
  redisCache = cacheManager.caching({
    store: redisStore,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    auth_pass: process.env.REDIS_PASSWORD,
    db: 0,
    ttl: 6000,
  });

//#region [AUXILIARY FUNCTIONS]

/**
 * Sets the redis cache store.
 *
 * @param {cacheManager.Cache | cacheManager.StoreConfig } cacheConfig - Redis cache manager.
 * @param {Boolean} useRedisStore - If false, redisCache can be set to any object.
 */

const configRedisCache = (cacheConfig, useRedisStore = true) => {
  if (!useRedisStore) {
    redisCache = cacheConfig;
  } else {
    redisCache = cacheManager.caching({
      store: redisStore,
      db: 0,
      ttl: 6000,
      ...cacheConfig,
    });
  }
};

/**
 * Returns the redis cache key for the given object.
 *
 * @param {TYPE} type - Type of the object.
 * @param {String} address - Address or txid of the object.
 * @returns {String} The redis cache key.
 */

const getRedisCacheKey = (type, address) => `${type}-${address}`;

/**
 * Sets an object in the redis cache store.
 *
 * @param {TYPE} type - Type of the object.
 * @param {String} address - Address or txid of the object.
 * @param {Transaction | User} object - Object to store.
 */

const storeObjectInCache = (type, address, object) => {
  return redisCache.set(
    getRedisCacheKey(type, address),
    JSON.stringify(object)
  );
};

/**
 * Retrieves an object from the redis cache store.
 *
 * @param {TYPE} type - Type of the object.
 * @param {String} address - Address or txid of the object.
 * @returns {Transaction | User | undefined } Object retrieved from cache.
 */

const retrieveObjectInCache = (type, address) => {
  return redisCache.get(getRedisCacheKey(type, address)).then((result) => {
    if (result === undefined) return result;
    return JSON.parse(result);
  });
};

/**
 * Deletes an object from the redis cache store.
 *
 * @param {TYPE} type - Type of the object.
 * @param {String} address - Address or txid of the object.
 */

const deleteObjectInCache = (type, address) => {
  return redisCache.del(getRedisCacheKey(type, address));
};

/**
 * Generates the sha512 of a string.
 *
 * @param {String} x - The string to hash.
 * @returns {String} The hashed string.
 */
const hash512 = (x) => crypto.createHash("sha512").update(x).digest("hex");

/**
 * Generates the address of a key with a predefined length.
 *
 * @param {String} key - The string to hash and generate an address,
 * @param {Number} [length] - The length of the resulting address (used to substring the string).
 * @returns {String} The hashed string with the desired length.
 */
const getAddress = (key, length = 64) => hash512(key).slice(0, length);

const PREFIX = getAddress(TRANSACTION_FAMILY, 6);

/**
 * Generates the address of a transaction.
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
 * Finds and returns a transaction in the blockchain.
 *
 * @param {TYPE} type - Type of transaction stored in the blockchain, such as TRANSACTION or USER ({@link TYPE}).
 * @param {String} txid - Transaction unique identification (before calculated address).
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @returns {Promise<Transaction|User|null>} Promise of the object if found or null if not found.
 */
const findByAddress = (type, txid, removeType = false, res = null) => {
  const queryCallback = (addressToQuery) =>
    queryState(addressToQuery)
      .then((response) => {
        storeObjectInCache(type, txid, response);
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
      return retrieveObjectInCache(type, txid).then((result) => {
        if (result) {
          return Promise.resolve(new Transaction(result).toObject(removeType));
        } else {
          return queryCallback(getTransactionAddress(txid));
        }
      });
    case TYPE.USER:
      if (res && res.locals && res.locals.user && res.locals.user[txid])
        return Promise.resolve(
          new User(res.locals.user[txid]).toObject(removeType)
        );
      return retrieveObjectInCache(type, txid).then((result) => {
        if (result) {
          return Promise.resolve(new User(result).toObject(removeType));
        } else {
          return queryCallback(getUserAddress(txid));
        }
      });
  }
};

/**
 * Finds and returns all transactions of a type.
 * @pre A request to an endpoint of a transaction is made. The endpoint must be GET /{transactionType}
 * @param {TYPE} type - Type of transaction, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {Number} [limit] - Maximum number of transactions to return.
 * @param {Boolean} [removeType] - Boolean that indicates if the type should be removed.
 * @param {Response} [res] - Express.js response object, used to access locals.
 * @returns {Promise<Array<Transaction|User>|Error>} - Promise of the object array returned by the Sawtooth API.
 */
const findAllObjects = (
  type,
  source,
  limit = 0,
  removeType = false,
  res = null
) => {
  let transactionName;
  let addressPrefix;
  switch (type) {
    case TYPE.TRANSACTION:
      transactionName = "transaction";
      addressPrefix = ADDRESS_PREFIX.TRANSACTION;
      break;
    case TYPE.USER:
      transactionName = "user";
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
      const objectList = _.chain(query.data.data)
        .filter(
          (item) => !_.isEmpty(JSON.parse(Buffer.from(item.data, "base64")))
        )
        .map((d) => {
          let base = JSON.parse(Buffer.from(d.data, "base64"));
          storeObjectInCache(type, base.address, base);
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
        `${source} | Querying all ${transactionName}s - ${
          objectList.length
        } ${transactionName}${objectList.length !== 1 ? "s" : ""} found`,
        objectList.length === 0 ? SEVERITY.ERROR : SEVERITY.SUCCESS
      );
      return objectList;
    });
};

/**
 * Creates an array of transactions (namely batches) for the Sawtooth REST API.
 *
 * @param {Array} inputs - Array of addresses that are the inputs (read access) of the transaction.
 * @param {Array} outputs - Array of addresses that are the outputs (write access) of the transaction.
 * @param {String} payload - JSON stringified object to insert into the blockchain. (Must include {func, args: {transaction, txid}})
 * @returns {Array} Array of transactions (namely Batches) for the Sawtooth REST API.
 */
const buildBatch = ({ inputs, outputs, payload }, ...args) => {
  let transactions = [
    new SawtoothTransaction({
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
 * Puts an transaction in the blockchain.
 *
 * @param {TYPE} type - Type of transaction, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {HTTP_METHODS} httpMethod - PUT or POST (defined in @see {@link HTTP_METHODS} constants).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {User|Transaction} object - Transaction object.
 * @returns {Promise<{ responseCode, msg, payload }| Error >}  Promise of the batch post request. If successfully resolved, contains responseCode, msg, payload
 */
const _putObject = (type, httpMethod, source, object) => {
  let txid = object.address;
  let txObject = object.toString(false, httpMethod);
  let txAddress;
  let txName;

  deleteObjectInCache(type, txid);
  switch (type) {
    case TYPE.TRANSACTION:
      txName = "Transaction";
      txAddress = getTransactionAddress(txid);
      break;

    case TYPE.USER:
      txName = "User";
      txAddress = getUserAddress(txid);
      break;
  }

  const batch = buildBatch({
    payload: txObject,
    inputs: [txAddress],
    outputs: [txAddress],
  });

  logFormatted(`${source} | BATCH Request:`, SEVERITY.NOTIFY, ...batch);

  return sendBatch(batch).then((sawtoothResponse) => {
    logFormatted(
      `${source}  | BATCH Response: ${sawtoothResponse.status} - ${sawtoothResponse.statusText}`,
      SEVERITY.SUCCESS
    );

    const responseCode = httpMethod === HTTP_METHODS.POST ? 201 : 200;
    const responseMessage = `${txName} ${
      httpMethod === HTTP_METHODS.POST ? "created" : "updated"
    }`;
    const objResponse = JSON.parse(txObject);
    delete objResponse.type;
    delete objResponse.httpMethod;
    return { responseCode, msg: responseMessage, payload: objResponse };
  });
};

/**
 * Builds a transaction of an object (User, Transaction, etc).
 *
 * @param {String} type - Type of object, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {HTTP_METHODS} httpMethod - PUT or POST (@see {@link HTTP_METHODS}).
 * @param {User|Transaction} object - Transaction object, such as {@link User}, {@link Transaction}.
 * @returns {SawtoothTransaction} Transaction of the Sawtooth REST API.
 */
const buildObjectTransaction = (type, httpMethod, object) => {
  let txObject;
  let txid;
  let txAddress;

  switch (type) {
    case TYPE.TRANSACTION:
      txid = object.address;
      txObject = object.toString(false, httpMethod);
      txAddress = getTransactionAddress(txid);
      break;

    case TYPE.USER:
      txid = object.address;
      txObject = object.toString(false, httpMethod);
      txAddress = getUserAddress(txid);
      break;
  }
  const txPayload = txObject;

  return new SawtoothTransaction({
    payload: txPayload,
    inputs: [txAddress],
    outputs: [txAddress],
  });
};

/**
 * Puts a batch of transactions into the blockchain.
 *
 * @param {HTTP_METHODS} httpMethod - PUT or POST (@see {@link HTTP_METHODS}).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {Array<SawtoothTransaction>} arrayOfObjects - Array of objects to be inserted into the blockchain.
 * @returns {Promise<{ responseCode, msg, payload }| Error >} Promise of the batch post request. If successfully resolved, contains responseCode, msg, payload
 */
const putBatch = (httpMethod, source, arrayOfObjects) => {
  const batch = buildBatch(...arrayOfObjects);

  arrayOfObjects.forEach((tx) => {
    const obj = JSON.parse(tx.payload);
    deleteObjectInCache(obj.type, obj.address);
  });
  logFormatted(`${source} | BATCH Request:`, SEVERITY.NOTIFY, batch);
  return sendBatch(batch).then((sawtoothResponse) => {
    logFormatted(
      `${source} | BATCH Response: ${sawtoothResponse.status} - ${sawtoothResponse.statusText}`,
      SEVERITY.SUCCESS
    );
    const responseCode = httpMethod === HTTP_METHODS.POST ? 201 : 200;
    const responseMessage = `Batch of ${arrayOfObjects.length} transaction${
      arrayOfObjects.length > 1 ? "s" : ""
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
 * Puts an object in the blockchain.
 *
 * @param {TYPE} type - Type of object, such as TRANSACTION or USER (@see {@link TYPE}).
 * @param {HTTP_METHODS} httpMethod - PUT or POST (@see {@link HTTP_METHODS}).
 * @param {String} source - Endpoint source that invoked function (used for logging).
 * @param {Request} req - Http request object.
 * @param {Response} res - Response object to handle Express request.
 * @returns {Promise<{ responseCode, msg, payload }| Error >} Promise of the Sawtooth REST API request response.
 */
const putObject = (type, httpMethod, source, req, res) => {
  let txObject;
  switch (type) {
    case TYPE.USER:
      txObject = new User(req.body);
      break;
  }
  return _putObject(type, httpMethod, source, txObject).then(
    ({ responseCode, msg, payload }) => {
      return res.status(responseCode).json({ msg, payload });
    }
  );
};

//#endregion
module.exports.configRedisCache = configRedisCache;
module.exports.hash512 = hash512;
module.exports.getTransactionAddress = getTransactionAddress;
module.exports.getUserAddress = getUserAddress;
module.exports.findByAddress = findByAddress;
module.exports.findAllObjects = findAllObjects;
module.exports._putObject = _putObject;
module.exports.buildObjectTransaction = buildObjectTransaction;
module.exports.putBatch = putBatch;
module.exports.putObject = putObject;
