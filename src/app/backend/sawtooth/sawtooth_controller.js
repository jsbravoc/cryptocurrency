/** Sawtooth controller functionality
 * @module controllers/sawtooth
 */
const secp256k1 = require("secp256k1");
const crypto = require("crypto");
const { protobuf } = require("sawtooth-sdk");
const axios = require("axios");
const SawtoothBatch = require("../models/SawtoothBatch");

/**
 * Generates the sha512 of a string.
 *
 * @param {String} x - The string to hash.
 * @returns {String} The hashed string.
 */
const hash512 = (x) => crypto.createHash("sha512").update(x).digest("hex");

/**
 * Generates the sha256 of a string.
 *
 * @param {String} x - The string to hash.
 * @returns {String} The hashed string.
 */
const hash256 = (x) => crypto.createHash("sha256").update(x).digest("hex");

const privateKey = Buffer.from(
  process.env.SAWTOOTH_PRIVATE_KEY.slice(2),
  "hex"
);
const publicKey = secp256k1.publicKeyCreate(privateKey);
const publicKeyHex = Buffer.from(publicKey).toString("hex");

/**
 * Generates the signature of a byte array, given a private key.
 *
 * @param {Uint8Array} dataBytes - The array of bytes to sign.
 * @param {String} privateKey - Hexadecimal representation of the private key.
 * @returns {String} The hexadecimal representation of the signature.
 */
const sign = (dataBytes, privateKey) => {
  const hash = hash256(dataBytes);
  return Buffer.from(
    secp256k1.ecdsaSign(
      Uint8Array.from(Buffer.from(hash, "hex")),
      Uint8Array.from(privateKey)
    ).signature
  ).toString("hex");
};

/**
 * Builds a complete Sawtooth REST API Transaction object from a SawtoothTransaction instance.
 *
 * @param {SawtoothTransaction} transaction - SawtoothTransaction object instance.
 * @param {String} transaction.transactionFamily - The transaction family of the transaction.
 * @param {String} transaction.transactionFamilyVersion - The transaction family version of the transaction.
 * @param {Array} transaction.inputs - Array of addresses that are the inputs (read access) of the transaction.
 * @param {Array} transaction.outputs - Array of addresses that are the outputs (write access) of the transaction.
 * @param {String} transaction.payload - JSON stringified object to insert into the blockchain.
 * @returns {protobuf.Transaction} Sawtooth REST API transaction object.
 */
const buildTransaction = ({
  transactionFamily,
  transactionFamilyVersion,
  inputs,
  outputs,
  payload,
}) => {
  const payloadBytes = Buffer.from(payload, "utf8");

  const transactionHeaderBytes = protobuf.TransactionHeader.encode({
    familyName: transactionFamily,
    familyVersion: transactionFamilyVersion,
    inputs,
    outputs,
    signerPublicKey: publicKeyHex,
    batcherPublicKey: publicKeyHex,
    dependencies: [],
    payloadSha512: hash512(payloadBytes),
    nonce: crypto.randomBytes(32).toString("hex"),
  }).finish();

  const signature = sign(transactionHeaderBytes, privateKey);

  return protobuf.Transaction.create({
    header: transactionHeaderBytes,
    headerSignature: signature,
    payload: payloadBytes,
  });
};

/**
 * Builds a complete Sawtooth REST API Batch object from a SawtoothBatch instance.
 *
 * @param {SawtoothBatch} batch - SawtoothBatch object instance.
 * @returns {protobuf.Batch} Sawtooth REST API batch object.
 */
const buildBatch = ({ transactions }) => {
  const batchHeaderBytes = protobuf.BatchHeader.encode({
    signerPublicKey: publicKeyHex,
    transactionIds: transactions.map((txn) => txn.headerSignature),
  }).finish();

  const signature = sign(batchHeaderBytes, privateKey);

  return protobuf.Batch.create({
    header: batchHeaderBytes,
    headerSignature: signature,
    transactions,
  });
};

/**
 * Sends a batch to the Sawtooth REST API.
 *
 * @param {Array<SawtoothTransaction>} transactions - List of transactions of the batch to send.
 * @returns {AxiosResponse} Sawtooth REST API response object.
 */
const sendBatch = (transactions) => {
  transactions = transactions.map((tx) => buildTransaction({ ...tx }));
  const batch = buildBatch(new SawtoothBatch({ transactions }));

  const batchListBytes = protobuf.BatchList.encode({
    batches: [batch],
  }).finish();

  const params = {
    headers: { "Content-Type": "application/octet-stream" },
    timeout: !isNaN(Number(process.env.SAWTOOTH_REST_TIMEOUT))
      ? Number(process.env.SAWTOOTH_REST_TIMEOUT)
      : 5000,
  };
  return axios.post(
    `${process.env.SAWTOOTH_REST}/batches`,
    batchListBytes,
    params
  );
};

/**
 * Queries the state of the blockchain, given an address to query.
 *
 * @param {String} address - Address to query.
 * @returns {AxiosResponse} Sawtooth REST API response object.
 */
const queryState = (address) => {
  const params = {
    headers: { "Content-Type": "application/json" },
  };
  return axios
    .get(`${process.env.SAWTOOTH_REST}/state/${address}`, params)
    .then((response) => {
      const base = Buffer.from(response.data.data, "base64");
      const stateValue = JSON.parse(base.toString("utf8"));
      return stateValue;
    });
};

module.exports.sendBatch = sendBatch;
module.exports.queryState = queryState;
