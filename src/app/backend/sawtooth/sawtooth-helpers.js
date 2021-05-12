const _ = require("lodash");
const secp256k1 = require("secp256k1");
const crypto = require("crypto");
const { protobuf } = require("sawtooth-sdk");
const axios = require("axios");

axios.defaults.timeout = 10 * 1000;
/* const { CancelToken } = require("axios"); */

const privateKey = Buffer.from(
  (
    process.env.SAWTOOTH_PRIVATE_KEY ||
    "0x7f664d71e4200b4a2989558d1f6006d0dac9771a36a546b1a47c384ec9c4f04b"
  ).slice(2),
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
    // In this example, we're signing the batch with the same private key,
    // but the batch can be signed by another party, in which case, the
    // public key will need to be associated with that key.
    batcherPublicKey: publicKeyHex,
    // In this example, there are no dependencies.  This list should include
    // an previous transactioun header signatures that must be applied for
    // this transaction to successfully commit.
    // For example,
    // dependencies: ['540a6803971d1880ec73a96cb97815a95d374cbad5d865925e5aa0432fcf1931539afe10310c122c5eaae15df61236079abbf4f258889359c4d175516934484a'],
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
  //--------------------------------------
  // Optional
  // If sending to sign outside

  // const txnListBytes = protobuf.TransactionList.encode({transactions}).finish()

  // const txnBytes2 = transaction.finish()

  // let transactions = protobuf.TransactionList.decode(txnListBytes).transactions;

  //----------------------------------------

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
    `${process.env.SAWTOOTH_REST || `http://${LOCAL_ADDRESS}:8008`}/batches`,
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
      `http://localhost:8008/state/${address}`,
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

/* const { Stream } = require("sawtooth-sdk/messaging/stream");
const {
  Message,
  EventList,
  EventSubscription,
  EventFilter,
  // StateChangeList,
  ClientEventsSubscribeRequest,
  ClientEventsSubscribeResponse,
} = require("sawtooth-sdk/protobuf");
const { logFormatted } = require("../utils/logger"); */
const { LOCAL_ADDRESS } = require("../utils/constants");
/* 
const PREFIX = hash512("intkey").substring(0, 6);
const NULL_BLOCK_ID = "0000000000000000";

const VALIDATOR_HOST =
  process.env.VALIDATOR_HOST || `tcp://${LOCAL_ADDRESS}:4004`; */
// const VALIDATOR_HOST = 'tcp://localhost:4004';
/* logFormatted(`Connecting to validator at ${VALIDATOR_HOST}`);
const stream = new Stream(VALIDATOR_HOST);

module.exports.subscribeToSawtoothEvents = () =>
  new Promise((resolve) => {
    stream.connect(() => {
      stream.onReceive(handleEvent);
      subscribe().then(resolve);
      console.log("Connected");
    });
  });

const handleEvent = (msg) => {
  // const mmm = EventList.decode(msg.content).events
  // console.log('events', mmm);
  if (msg.messageType === Message.MessageType.CLIENT_EVENTS) {
    const { events } = EventList.decode(msg.content);
    // console.log(events)
    _.forEach(events, (e) => {
      if (e.eventType == "myevent") {
        // console.log(e)
        // console.log('EVENT - data:', Buffer.from(e.data, 'utf8').toString('utf8'))
      } else if (e.eventType === "sawtooth/block-commit") {
        // console.log(e);
      } else if (e.eventType === "sawtooth/state-delta") {
        // let a = protobuf.StateChangeList.decode(e.data);
        // console.log(a.stateChanges[0].value.toString('utf8'));
      }
    });
    // deltas.handle(getBlock(events), getChanges(events))
  } else {
    console.warn("Received message of unknown type:", msg.messageType);
  }
};

const subscribe = () => {
  const blockSub = EventSubscription.create({
    eventType: "sawtooth/block-commit",
  });
  const deltaSub = EventSubscription.create({
    eventType: "sawtooth/state-delta",
    filters: [
      EventFilter.create({
        key: "address",
        matchString: `^${PREFIX}.*`,
        filterType: EventFilter.FilterType.REGEX_ANY,
      }),
    ],
  });

  const mySub = EventSubscription.create({
    eventType: "myevent",
  });

  return stream
    .send(
      Message.MessageType.CLIENT_EVENTS_SUBSCRIBE_REQUEST,
      ClientEventsSubscribeRequest.encode({
        lastKnownBlockIds: [NULL_BLOCK_ID],
        subscriptions: [blockSub, deltaSub, mySub],
      }).finish()
    )
    .then((response) => ClientEventsSubscribeResponse.decode(response))
    .then((decoded) => {
      const status = _.findKey(
        ClientEventsSubscribeResponse.Status,
        (val) => val === decoded.status
      );
      if (status !== "OK") {
        throw new Error(`Validator responded with status "${status}"`);
      }
    });
}; */
