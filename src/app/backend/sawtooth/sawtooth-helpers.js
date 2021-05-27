const _ = require("lodash");
const secp256k1 = require("secp256k1");
const crypto = require("crypto");
const { protobuf } = require("sawtooth-sdk");
const axios = require("axios");

axios.defaults.timeout = 10 * 1000;

const privateKey = Buffer.from(
  process.env.SAWTOOTH_PRIVATE_KEY.slice(2),
  "hex"
);
const publicKey = secp256k1.publicKeyCreate(privateKey);
const publicKeyHex = Buffer.from(publicKey).toString("hex");

const hash512 = (x) => crypto.createHash("sha512").update(x).digest("hex");

const hash256 = (x) => crypto.createHash("sha256").update(x).digest("hex");

const sign = (dataBytes, privKey) => {
  const hash = hash256(dataBytes);
  return Buffer.from(
    secp256k1.ecdsaSign(
      Uint8Array.from(Buffer.from(hash, "hex")),
      Uint8Array.from(privKey)
    ).signature
  ).toString("hex");
};

function buildTransaction(
  transactionFamily,
  transactionFamilyVersion,
  inputs,
  outputs,
  payload
) {
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

  const transaction = protobuf.Transaction.create({
    header: transactionHeaderBytes,
    headerSignature: signature,
    payload: payloadBytes,
  });
  return transaction;
}

function buildBatch(transactions) {
  const batchHeaderBytes = protobuf.BatchHeader.encode({
    signerPublicKey: publicKeyHex,
    transactionIds: transactions.map((txn) => txn.headerSignature),
  }).finish();

  const signature = sign(batchHeaderBytes, privateKey);

  const batch = protobuf.Batch.create({
    header: batchHeaderBytes,
    headerSignature: signature,
    transactions,
  });

  return protobuf.BatchList.encode({
    batches: [batch],
  }).finish();
}

module.exports.sendTransaction = async function (transactions) {
  const txs = _.map(transactions, (t) => {
    const {
      transactionFamily,
      transactionFamilyVersion,
      inputs,
      outputs,
      payload,
    } = t;
    return buildTransaction(
      transactionFamily,
      transactionFamilyVersion,
      inputs,
      outputs,
      payload
    );
  });

  const batchListBytes = buildBatch(txs);

  const params = {
    headers: { "Content-Type": "application/octet-stream" },
    timeout: process.env.SAWTOOTH_REST_TIMEOUT || 5000,
  };
  return axios.post(
    `${process.env.SAWTOOTH_REST}/batches`,
    batchListBytes,
    params
  );
};

module.exports.queryState = async function (address) {
  const params = {
    headers: { "Content-Type": "application/json" },
  };
  let response;
  try {
    response = await axios.get(
      `${process.env.SAWTOOTH_REST}/state/${address}`,
      params
    );
  } catch (error) {
    return null;
  }
  if (!response || !response.data || !response.data.data) {
    return null;
  }

  const base = Buffer.from(response.data.data, "base64");
  const stateValue = JSON.parse(base.toString("utf8"));
  return stateValue;
};
