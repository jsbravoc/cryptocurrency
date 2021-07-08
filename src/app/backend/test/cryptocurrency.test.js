/* eslint-disable no-undef */
const chai = require("chai");
// eslint-disable-next-line no-unused-vars
const should = chai.should();
const _ = require("lodash");
chai.use(require("chai-http"));
const { randomBytes } = require("crypto");
const { v4: uuidv4 } = require("uuid");
const API_URL = require("../app");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const CRYPTO_ENDPOINT = "/cryptocurrency";
const ENFORCER_ENDPOINT = "/validate";
const USERS_ENDPOINT = "/users";
const CONFIG_ENDPOINT = "/config";
const { expect } = chai;
const secp256k1 = require("secp256k1");
const ethers = require("ethers");
const users = {
  W10000: new User({ address: uuidv4() }),
  W1000: new User({ address: uuidv4() }),
  W0: new User({ address: uuidv4() }),
  NoCoinbase: new User({ address: uuidv4() }),
  CantTransferW1000: new User({ address: uuidv4() }),
  ToDeleteW1000: new User({ address: uuidv4() }),
  ToDelete: new User({ address: uuidv4() }),
  Inactive: new User({ address: uuidv4() }),
  Redis: new User({ address: uuidv4() }),
};
const createdVariables = {
  transactions: {
    user: {
      [users.W1000.address]: {},
      [users.W0.address]: {},
      [users.NoCoinbase.address]: {},
      [users.CantTransferW1000.address]: {},
      [users.ToDeleteW1000.address]: {},
      [users.ToDelete.address]: {},
      [users.Inactive.address]: {},
      [users.Redis.address]: {},
    },
    transaction: {
      [users.W1000.address]: {},
      [users.W0.address]: {},
      [users.NoCoinbase.address]: {},
      [users.CantTransferW1000.address]: {},
      [users.ToDeleteW1000.address]: {},
      [users.ToDelete.address]: {},
      [users.Inactive.address]: {},
      [users.Redis.address]: {},
    },
  },
};

//Note: This should be managed by the crypto wallet.
for (const name in users) {
  if (Object.hasOwnProperty.call(users, name)) {
    const user = users[name];
    let privKey;
    do {
      privKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privKey));
    const pubKey = secp256k1.publicKeyCreate(privKey);
    user.public_key = Buffer.from(pubKey).toString("hex");
    user.private_key = Buffer.from(privKey).toString("hex");
  }
}

const createFakePublicKey = (length = 66) => {
  const result = [];
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return result.join("");
};

//Note: This should be managed by the crypto wallet.
const getSignature = (user, signatureObj, isTransaction = true) => {
  let tx;
  let objToSign;
  if (isTransaction) {
    tx = new Transaction(signatureObj);
    objToSign = tx.toSignatureString();
  } else objToSign = JSON.stringify(signatureObj);

  const privateKey = user.private_key;
  try {
    const wrapped =
      "\x19Ethereum Signed Message:\n" + objToSign.length + objToSign;
    const hashSecp256 = ethers.utils.keccak256(
      "0x" + Buffer.from(wrapped).toString("hex")
    );
    const resp = secp256k1.ecdsaSign(
      Buffer.from(hashSecp256.slice(2), "hex"),
      Buffer.from(privateKey, "hex")
    );
    return (
      "0x" +
      Buffer.from(resp.signature).toString("hex") +
      (resp.recid + 27).toString(16)
    );
  } catch (error) {
    return new Error(error.message);
  }
};

const createUser = ({
  alias,
  coinbasePermission = true,
  transferToPermissions = null,
  active = true,
  returnTo = null,
  callback = null,
}) => {
  const permissions = {};
  const { address, public_key } = users[alias];
  const request = {
    address,
    public_key,
  };

  if (returnTo) {
    request.return_to = returnTo;
  }
  if (coinbasePermission) {
    permissions.coinbase = true;
  }
  if (typeof active === "boolean") {
    request.active = active;
  }
  if (transferToPermissions) {
    permissions.transfer_to = transferToPermissions;
  }
  request.permissions = permissions;
  chai
    .request(API_URL)
    .post(`${USERS_ENDPOINT}`)
    .send(request)
    .end(function (err, res) {
      return callback({ err, res, alias });
    });

  return true;
};

const createTransaction = ({
  recipientAlias,
  amount,
  pending,
  signature = null,
  senderAlias = null,
  creatorAlias = null,
  callback = null,
  valid_thru = null,
  description = null,
  creationDate = null,
}) => {
  let senderAddress;
  let creatorAddress;
  const request = {
    recipient: users[recipientAlias]
      ? users[recipientAlias].address
      : recipientAlias,
    amount,
  };

  if (typeof pending === "boolean") {
    request.pending = pending;
  }
  if (valid_thru) {
    request.valid_thru = valid_thru;
  }
  if (description) {
    request.description = description;
  }
  if (creationDate) {
    request.creationDate = creationDate;
  }
  if (senderAlias) {
    senderAddress = users[senderAlias]
      ? users[senderAlias].address
      : senderAlias;
    request.sender = senderAddress;
  }
  if (creatorAlias) {
    creatorAddress = users[creatorAlias]
      ? users[creatorAlias].address
      : creatorAlias;
    request.creator = creatorAddress;
  }

  let calculatedSignature;
  if (users[creatorAlias])
    calculatedSignature = getSignature(users[creatorAlias], request);
  else if (users[senderAlias])
    calculatedSignature = getSignature(users[senderAlias], request);
  else if (users[recipientAlias])
    calculatedSignature = getSignature(users[recipientAlias], request);

  request.signature = calculatedSignature || signature || uuidv4();

  //test empty signature
  if (signature === "") request.signature = "";

  chai
    .request(API_URL)
    .post(`${CRYPTO_ENDPOINT}`)
    .send(request)
    .end(function (err, res) {
      return callback({
        err,
        res,
        recipientAlias,
        senderAlias,
        amount,
        pending,
        signature: request.signature,
        address:
          res && res.body && res.body.payload ? res.body.payload.address : "",
      });
    });
  return true;
};

describe(`Cryptocurrency Test Suite`, () => {
  before(function (done) {
    this.timeout(20000);

    const createdUserCallback = ({ res, alias, callback }) => {
      const address = users[alias].address;
      return expect(res).to.satisfy((res) => {
        createdVariables.transactions.user[address] = res.body;
        if (res.statusCode === 201) {
          console.log(
            `[Before hook]: User ${alias} created with address: ${address}`
          );
          if (callback) callback(res);
          return true;
        }
        return false;
      });
    };

    const createdTransactionCallback = ({
      recipientAlias,
      senderAlias,
      amount,
      pending,
      signature,
      res,
      callback,
    }) => {
      const recipientAddress = users[recipientAlias].address;
      const senderAddress = users[senderAlias]
        ? users[senderAlias].address
        : undefined;
      return expect(res).to.satisfy((res) => {
        if (!senderAlias && recipientAddress)
          createdVariables.transactions.transaction[recipientAddress].coinbase =
            res.body;
        else if (typeof pending === "boolean" && senderAddress)
          createdVariables.transactions.transaction[senderAddress].pending =
            res.body;
        else
          createdVariables.transactions.transaction[senderAddress][
            recipientAlias
          ] = res.body;
        if (res.statusCode === 201) {
          if (!senderAlias)
            console.log(
              `[Before hook]: User ${recipientAlias} received ${amount} CNKs, with signature: ${signature}`
            );
          else
            console.log(
              `[Before hook]: User ${senderAlias} sent${
                pending === true ? " pending " : " "
              }transaction of ${amount} CNKs to ${recipientAlias}, with signature: ${signature}`
            );
          if (callback) callback(res);
          return true;
        } else {
          console.log("ERR RESPONSE", res.body);
        }
        return false;
      });
    };

    createUser({
      alias: "W1000",
      coinbasePermission: true,
      callback: createdUserCallback,
    });
    createUser({
      alias: "W0",
      coinbasePermission: true,
      callback: createdUserCallback,
    });
    createUser({
      alias: "NoCoinbase",
      coinbasePermission: false,
      callback: createdUserCallback,
    });
    createUser({
      alias: "Inactive",
      coinbasePermission: true,
      active: false,
      callback: createdUserCallback,
    });
    createUser({
      alias: "CantTransferW1000",
      coinbasePermission: true,
      transferToPermissions: {
        [users.W1000.address]: false,
      },
      callback: createdUserCallback,
    });

    setTimeout(() => {
      createTransaction({
        recipientAlias: "W1000",
        amount: 1000,
        callback: ({
          err,
          res,
          recipientAlias,
          senderAlias,
          amount,
          signature,
        }) =>
          createdTransactionCallback({
            recipientAlias,
            senderAlias,
            amount,
            signature,
            err,
            res,
            callback: () =>
              setTimeout(() => {
                createUser({
                  alias: "ToDeleteW1000",
                  coinbasePermission: true,
                  returnTo: {
                    default: users.W1000.address,
                    inactive: users.Inactive.address,
                  },
                  callback: createdUserCallback,
                });
                createUser({
                  alias: "ToDelete",
                  coinbasePermission: true,
                  returnTo: {
                    default: users.W1000.address,
                  },
                  callback: createdUserCallback,
                });
                createTransaction({
                  recipientAlias: "CantTransferW1000",
                  amount: 1000,
                  callback: ({
                    err,
                    res,
                    recipientAlias,
                    senderAlias,
                    amount,
                    signature,
                  }) =>
                    createdTransactionCallback({
                      recipientAlias,
                      senderAlias,
                      amount,
                      signature,
                      err,
                      res,
                      callback: () => {
                        setTimeout(() => {
                          createTransaction({
                            senderAlias: "CantTransferW1000",
                            recipientAlias: "W0",
                            amount: 1,
                            callback: createdTransactionCallback,
                          });
                        }, 2500);
                      },
                    }),
                });
                createTransaction({
                  recipientAlias: "W0",
                  amount: 600,
                  pending: true,
                  senderAlias: "W1000",
                  creatorAlias: "W1000",
                  callback: ({
                    err,
                    res,
                    recipientAlias,
                    senderAlias,
                    amount,
                    signature,
                    pending,
                  }) =>
                    createdTransactionCallback({
                      recipientAlias,
                      senderAlias,
                      amount,
                      signature,
                      pending,
                      err,
                      res,
                      callback: () => setTimeout(done, 3500),
                    }),
                });
              }, 2500),
          }),
      });
    }, 2500);
  });
  describe(`${CRYPTO_ENDPOINT} Tests`, () => {
    describe(`GET ${CRYPTO_ENDPOINT}`, () => {
      describe(`Successful requests`, () => {
        describe("Get all transactions (non expanded)", () => {
          it("Non expanded transactions should be returned", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ limit: 5 })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((transaction) => {
                  (transaction.supporting_transactions || []).forEach(
                    (supporting_transaction) => {
                      expect(supporting_transaction).to.be.a("string");
                    }
                  );
                });
                done();
              });
          });
        });
        describe("Get all simplified transactions (non expanded & simplified)", () => {
          it("Non expanded transactions should be returned and should be simplified", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ limit: 5, simplifyTransaction: true })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((transaction) => {
                  if (transaction.supporting_transactions !== undefined)
                    expect(transaction.supporting_transactions).to.satisfy(
                      Number.isInteger
                    );
                });
                done();
              });
          });
        });
        describe("Get all transactions (expanded)", () => {
          it("All transactions returned should be expanded", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ expand: true, limit: 5 })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((transaction) => {
                  (transaction.supporting_transactions || []).forEach(
                    (supporting_transaction) => {
                      expect(supporting_transaction).to.be.an("object");
                    }
                  );
                });
                done();
              });
          });
        });
        describe("Get all transactions (expanded & simplified -> simplifyTransaction should prevail)", () => {
          it("Non expanded transactions should be returned and should be simplified", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ limit: 5, simplifyTransaction: true, expand: true })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((transaction) => {
                  if (transaction.supporting_transactions !== undefined)
                    expect(transaction.supporting_transactions).to.satisfy(
                      Number.isInteger
                    );
                });
                done();
              });
          });
        });
        describe("Get all transactions (hide pending)", () => {
          it("All transactions except those which are pending should be returned", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ limit: 5, hidePending: true })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((transaction) => {
                  if (transaction.pending !== undefined) {
                    expect(transaction.pending).to.equal(false);
                  }
                });
                done();
              });
          });
        });
        describe("Get all transactions (hide invalid)", () => {
          it("All transactions except those which are invalid should be returned", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ limit: 5, hideInvalid: true })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((transaction) => {
                  expect(transaction.valid).to.equal(true);
                });
                done();
              });
          });
        });
      });
    });
    describe(`GET ${CRYPTO_ENDPOINT}/:address`, () => {
      describe(`Transaction error validations`, () => {
        describe("Value validation", () => {
          it("Non existent transaction should throw an error", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}/${uuidv4()}`)
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Empty transaction signature should throw an error", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}/      /`)
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
        });
      });
      describe("Transaction success validations", function () {
        it("Transaction should be retrieved successfully", (done) => {
          chai
            .request(API_URL)
            .get(
              `${CRYPTO_ENDPOINT}/${
                createdVariables.transactions.transaction[users.W1000.address]
                  .coinbase.payload.address
              }`
            )
            .end(function (err, res) {
              expect(res).to.have.status(200);
              done();
            });
        });
        it("Transaction should be retrieved and expanded successfully", (done) => {
          chai
            .request(API_URL)
            .get(
              `${CRYPTO_ENDPOINT}/${
                createdVariables.transactions.transaction[
                  users.CantTransferW1000.address
                ].W0.payload.address
              }`
            )
            .query({ expand: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              (res.body.supporting_transactions || []).forEach(
                (supporting_transaction) => {
                  expect(supporting_transaction).to.be.an("object");
                }
              );
              done();
            });
        });
        it("Transaction should be retrieved and expanded successfully, with supporting transactions simplfied", (done) => {
          chai
            .request(API_URL)
            .get(
              `${CRYPTO_ENDPOINT}/${
                createdVariables.transactions.transaction[
                  users.CantTransferW1000.address
                ].W0.payload.address
              }`
            )
            .query({ expand: true, simplifySupportingTransactions: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              (res.body.supporting_transactions || []).forEach(
                (supporting_transaction) => {
                  expect(supporting_transaction).to.be.an("object");
                  if (
                    supporting_transaction.supporting_transactions !== undefined
                  )
                    expect(
                      supporting_transaction.supporting_transactions
                    ).to.satisfy(Number.isInteger);
                }
              );
              done();
            });
        });
        it("Transaction should be retrieved and simplified successfully", (done) => {
          chai
            .request(API_URL)
            .get(
              `${CRYPTO_ENDPOINT}/${
                createdVariables.transactions.transaction[
                  users.CantTransferW1000.address
                ].W0.payload.address
              }`
            )
            .query({ simplifyTransaction: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body.supporting_transactions).to.be.a("number");
              done();
            });
        });
      });
    });
    describe(`POST ${CRYPTO_ENDPOINT}`, () => {
      describe("Transaction errors validations", () => {
        describe("Empty values", () => {
          it("Empty request should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${CRYPTO_ENDPOINT}`)
              .send({})
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Empty recipient should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${CRYPTO_ENDPOINT}`)
              .send({ amount: 10, sender: "Anyone", signature: "Anything" })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "recipient",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Empty amount should throw an error", (done) => {
            createTransaction({
              senderAlias: "Anyone",
              recipientAlias: "Another User",
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, { param: "amount", location: "body" })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Empty signature should throw an error", (done) => {
            createTransaction({
              senderAlias: "Anyone",
              recipientAlias: "Another User",
              amount: 10,
              signature: "",
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "signature",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
        });
        describe("Value validation", () => {
          it("Negative transaction amount should throw an error", (done) => {
            createTransaction({
              senderAlias: "Anyone",
              recipientAlias: "Another User",
              amount: -10,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, { param: "amount", location: "body" })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Valid thru transaction date without ISO 8061 format should throw an error", (done) => {
            createTransaction({
              senderAlias: "Anyone",
              recipientAlias: "Another User",
              amount: 10,
              valid_thru: "2021-17-04",
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "valid_thru",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Creation date transaction date without ISO 8061 format should throw an error", (done) => {
            createTransaction({
              senderAlias: "Anyone",
              recipientAlias: "Another User",
              amount: 10,
              creationDate: "2021-17-04",
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "creationDate",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Past valid thru transaction date should throw an error", (done) => {
            createTransaction({
              senderAlias: "Anyone",
              recipientAlias: "Another User",
              amount: 10,
              valid_thru: "2021-04-17T03:42:03.642Z",
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "valid_thru",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
        });
        describe("Transaction validation", () => {
          it("Transaction signature that cannot be decrypted should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${CRYPTO_ENDPOINT}`)
              .send({
                amount: 10,
                recipient: users.W1000.address,
                signature:
                  createdVariables.transactions.transaction[
                    users.CantTransferW1000.address
                  ].W0.payload.address + "1",
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "signature",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Transaction signature that isn't signed by creator user throw an error", (done) => {
            let signature = getSignature(users.CantTransferW1000, {
              amount: 10,
              recipient: users.W1000.address,
            });
            chai
              .request(API_URL)
              .post(`${CRYPTO_ENDPOINT}`)
              .send({
                amount: 10,
                recipient: users.W1000.address,
                signature,
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "signature",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Transaction signature that doesn't match with its contents should throw an error", (done) => {
            let signature = getSignature(users.W1000, {
              amount: 100,
              recipient: users.W1000.address,
            });
            chai
              .request(API_URL)
              .post(`${CRYPTO_ENDPOINT}`)
              .send({
                amount: 10,
                recipient: users.W1000.address,
                signature,
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "signature",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Already existing transaction with same signature & contents should throw an error", (done) => {
            /**
             * Note that to avoid transaction address collisions, the transaction address is the hash of the creationDate & its contents
             * Thus, a same exact transaction with the same creationDate will collide and throw an error.
             */
            createTransaction({
              recipientAlias: "W1000",
              amount: 1000,
              creationDate:
                createdVariables.transactions.transaction[users.W1000.address]
                  .coinbase.payload.creationDate,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "signature",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Non existing sender should throw an error", (done) => {
            createTransaction({
              senderAlias: uuidv4(),
              recipientAlias: "W1000",
              amount: 10,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, { param: "sender", location: "body" })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Non existing recipient should throw an error", (done) => {
            createTransaction({
              senderAlias: "W1000",
              recipientAlias: uuidv4(),
              amount: 10,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "recipient",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Inactive recipient should throw an error", (done) => {
            createTransaction({
              senderAlias: "W1000",
              recipientAlias: "Inactive",
              amount: 1,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "recipient",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Inactive sender should throw an error", (done) => {
            createTransaction({
              recipientAlias: "W1000",
              senderAlias: "Inactive",
              amount: 1,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "sender",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Insufficient balance should throw an error", (done) => {
            createTransaction({
              senderAlias: "W1000",
              recipientAlias: "W0",
              amount: 1e308,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, { param: "amount", location: "body" })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Insufficient balance due to pending transaction should throw an error", (done) => {
            createTransaction({
              senderAlias: "W1000",
              recipientAlias: "W0",
              amount: 650,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, { param: "amount", location: "body" })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Coinbase transaction without permissions should throw an error", (done) => {
            createTransaction({
              recipientAlias: "NoCoinbase",
              amount: 650,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "recipient",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
          it("Transfer to explicitly denied recipient should throw an error", (done) => {
            createTransaction({
              recipientAlias: "W1000",
              senderAlias: "CantTransferW1000",
              amount: 100,
              callback: ({ res }) => {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "sender",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              },
            });
          });
        });
      });
      describe("Transaction success validations", function () {
        this.slow(15000);
        this.timeout(20000);
        it("Transaction should be created successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "W0",
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              setTimeout(() => {
                chai
                  .request(API_URL)
                  .get(`${USERS_ENDPOINT}/${users.W0.address}`)
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    res.body.should.have.property("balance").equal(2);
                    done();
                  });
              }, 3500);
            },
          });
        });
        it("Pending valid thru transaction should be created successfully", (done) => {
          const now = new Date();
          const creationDate = new Date();
          now.setSeconds(now.getSeconds() + 5);
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "W0",
            creationDate,
            valid_thru: now.toISOString(),
            pending: true,
            description: "Expiring transaction",
            callback: ({ res }) => {
              createdVariables.transactions.transaction[
                users.W1000.address
              ].expiringTransaction = res.body.payload;
              expect(res).to.have.status(201);
              setTimeout(() => {
                chai
                  .request(API_URL)
                  .get(`${USERS_ENDPOINT}/${users.W0.address}`)
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    res.body.should.have.property("balance").equal(2);
                    done();
                  });
              }, 3500);
            },
          });
        });
        it("Pending transaction should not change user's balance", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "W0",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              setTimeout(() => {
                chai
                  .request(API_URL)
                  .get(`${USERS_ENDPOINT}/${users.W0.address}`)
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    res.body.should.have.property("balance").equal(2);
                    done();
                  });
              }, 3500);
            },
          });
        });
        it("Valid thru transaction should be created successfully", (done) => {
          const now = new Date();
          const creationDate = new Date();
          now.setSeconds(now.getSeconds() + 5);
          createTransaction({
            amount: 25,
            senderAlias: "CantTransferW1000",
            recipientAlias: "ToDeleteW1000",
            creationDate,
            valid_thru: now.toISOString(),
            description: "Expiring valid transaction",
            callback: ({ res }) => {
              createdVariables.transactions.transaction[
                users.CantTransferW1000.address
              ].expiringTransaction = res.body.payload;
              expect(res).to.have.status(201);
              setTimeout(() => {
                chai
                  .request(API_URL)
                  .get(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    res.body.should.have.property("balance").equal(25);
                    done();
                  });
              }, 3500);
            },
          });
        });
      });
    });
    describe(`PUT ${CRYPTO_ENDPOINT}/:address`, function () {
      this.slow(8000);
      this.timeout(10000);
      describe(`Transaction error validations`, () => {
        describe("Empty values", () => {
          it("Empty request should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Approving a transaction without signature should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ approve: true })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Updating a transaction without signature should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ description: "new description" })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Updating a transaction without description should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                const signature = getSignature(
                  users.W1000,
                  { description: "new description" },
                  false
                );
                setTimeout(() => {
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .send({ signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
        });
        describe("Value validation", () => {
          it("Non existent transaction should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(`${CRYPTO_ENDPOINT}/${uuidv4()}`)
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Non boolean approve query parameter should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature = getSignature(
                    users.ToDeleteW1000,
                    { approve: "not-true" },
                    false
                  );
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ approve: "not-true", signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
        });
        describe("Transaction validation", function () {
          this.slow(9000);
          this.timeout(12000);
          it("Non pending transaction should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(
                `${CRYPTO_ENDPOINT}/${
                  createdVariables.transactions.transaction[users.W1000.address]
                    .coinbase.payload.address
                }`
              )
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Approval signature that isn't signed by sender user should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature = getSignature(
                    users.ToDeleteW1000,
                    { approve: true },
                    false
                  );
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ approve: true, signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Rejection signature that isn't signed by sender or recipient user should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature = getSignature(
                    users.W0,
                    { approve: false },
                    false
                  );
                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ approve: false, signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Approval signature that cannot be decrypted should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature =
                    getSignature(users.W1000, { approve: true }, false) + "1";

                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ approve: true, signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Approval signature that doesn't match with its contents should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature = getSignature(
                    users.W1000,
                    { approve: false },
                    false
                  );

                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .query({ approve: true, signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Update description signature that cannot be decrypted should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              description: "A description",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature =
                    getSignature(
                      users.W1000,
                      { description: "Another description" },
                      false
                    ) + "1";

                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .send({ description: "Another description", signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Update description signature that doesn't match with its contents should throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              description: "A description",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature = getSignature(
                    users.W1000,
                    { description: "Another description" },
                    false
                  );

                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .send({ description: "Different description", signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
          it("Update description signature that isn't signed by creator or sender throw an error", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "ToDeleteW1000",
              description: "A description",
              pending: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                const createdTransaction = res.body.payload;
                setTimeout(() => {
                  const signature = getSignature(
                    users.ToDeleteW1000,
                    { description: "Another description" },
                    false
                  );

                  chai
                    .request(API_URL)
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                    .send({ description: "Another description", signature })
                    .end(function (err, res) {
                      expect(res.body.errors).to.be.an("array");
                      expect(res).to.have.status(400);
                      done();
                    });
                }, 3500);
              },
            });
          });
        });
      });
      describe("Transaction success validations", function () {
        this.slow(20000);
        this.timeout(25000);
        it("Transaction should be approved successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "ToDeleteW1000",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              const createdTransaction = res.body.payload;
              setTimeout(() => {
                const signature = getSignature(
                  users.W1000,
                  { approve: true },
                  false
                );

                chai
                  .request(API_URL)
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                  .query({ approve: true, signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          //25 from valid expiring transaction
                          res.body.should.have
                            .property("balance")
                            .equal(25 + 1);
                          done();
                        });
                    }, 3500);
                  });
              }, 3500);
            },
          });
        });
        it("Transaction should be rejected by sender successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "NoCoinbase",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              const createdTransaction = res.body.payload;
              setTimeout(() => {
                const signature = getSignature(
                  users.W1000,
                  { approve: false },
                  false
                );
                chai
                  .request(API_URL)
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                  .query({ approve: false, signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${USERS_ENDPOINT}/${users.NoCoinbase.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          res.body.should.have.property("balance").equal(0);
                          done();
                        });
                    }, 3500);
                  });
              }, 3500);
            },
          });
        });
        it("Transaction should be rejected by recipient successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "NoCoinbase",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              const createdTransaction = res.body.payload;
              setTimeout(() => {
                const signature = getSignature(
                  users.NoCoinbase,
                  { approve: false },
                  false
                );
                chai
                  .request(API_URL)
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                  .query({ approve: false, signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${USERS_ENDPOINT}/${users.NoCoinbase.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          res.body.should.have.property("balance").equal(0);
                          done();
                        });
                    }, 3500);
                  });
              }, 3500);
            },
          });
        });
        it("Transaction should be updated successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "NoCoinbase",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              const createdTransaction = res.body.payload;
              setTimeout(() => {
                const signature = getSignature(
                  users.W1000,
                  { description: "New description" },
                  false
                );
                chai
                  .request(API_URL)
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                  .send({ description: "New description", signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          res.body.should.have
                            .property("description")
                            .equal("New description");
                          done();
                        });
                    }, 3500);
                  });
              }, 3500);
            },
          });
        });
        it("Transaction should be approved & updated successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "ToDeleteW1000",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              const createdTransaction = res.body.payload;
              setTimeout(() => {
                const signature = getSignature(
                  users.W1000,
                  { approve: true, description: "New description" },
                  false
                );
                chai
                  .request(API_URL)
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                  .query({ approve: true })
                  .send({ description: "New description", signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          res.body.should.have
                            .property("balance")
                            .equal(25 + 1 + 1);
                          chai
                            .request(API_URL)
                            .get(
                              `${CRYPTO_ENDPOINT}/${createdTransaction.address}`
                            )
                            .end(function (err, res) {
                              expect(res).to.have.status(200);
                              res.body.should.have
                                .property("description")
                                .equal("New description");
                              done();
                            });
                        });
                    }, 3500);
                  });
              }, 3500);
            },
          });
        });
        it("Transaction should be rejected & updated successfully", (done) => {
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "NoCoinbase",
            pending: true,
            callback: ({ res }) => {
              expect(res).to.have.status(201);
              const createdTransaction = res.body.payload;
              setTimeout(() => {
                const signature = getSignature(
                  users.W1000,
                  { approve: false, description: "New description" },
                  false
                );
                chai
                  .request(API_URL)
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.address}`)
                  .query({ approve: false })
                  .send({ description: "New description", signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${USERS_ENDPOINT}/${users.NoCoinbase.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          res.body.should.have.property("balance").equal(0);
                          chai
                            .request(API_URL)
                            .get(
                              `${CRYPTO_ENDPOINT}/${createdTransaction.address}`
                            )
                            .end(function (err, res) {
                              expect(res).to.have.status(200);
                              res.body.should.have
                                .property("description")
                                .equal("New description");
                              done();
                            });
                        });
                    }, 3500);
                  });
              }, 3500);
            },
          });
        });
      });
    });
  });
  describe(`${ENFORCER_ENDPOINT} Tests`, () => {
    describe(`POST ${ENFORCER_ENDPOINT}`, () => {
      describe(`POST ${ENFORCER_ENDPOINT}?users={users}&transactions={transactions}`, () => {
        describe("Enforcer success validations", function () {
          this.slow(20000);
          this.timeout(25000);
          it("Expiring lastest transactions should be deleted successfully", (done) => {
            const now = new Date();
            const creationDate = new Date();
            now.setSeconds(now.getSeconds() + 2);
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "W0",
              creationDate,
              valid_thru: now.toISOString(),
              description: "Expiring valid transaction",
              callback: ({ res }) => {
                createdVariables.transactions.transaction[
                  users.W1000.address
                ].expiringTransactionToW0 = res.body.payload;
                expect(res).to.have.status(201);
                setTimeout(() => {
                  chai
                    .request(API_URL)
                    .post(`${ENFORCER_ENDPOINT}`)
                    .query({
                      users: `${users.W0.address}`,
                      transactions: `${
                        createdVariables.transactions.transaction[
                          users.W1000.address
                        ].expiringTransactionToW0.address
                      }`,
                    })
                    .end(function (err, res) {
                      expect(res).to.have.status(200);
                      setTimeout(() => {
                        chai
                          .request(API_URL)
                          .get(`${USERS_ENDPOINT}/${users.W0.address}`)
                          .end(function (err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body.latest_transactions)
                              .to.be.an("array")
                              .that.does.not.include(
                                createdVariables.transactions.transaction[
                                  users.W1000.address
                                ].expiringTransactionToW0.address
                              );
                            res.body.should.have.property("balance").equal(2);
                            done();
                          });
                      }, 5000);
                    });
                }, 2500);
              },
            });
          });
          it("Non expiring lastest transactions should not be deleted", (done) => {
            const now = new Date();
            const creationDate = new Date();
            now.setSeconds(now.getSeconds() + 60);
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "W0",
              creationDate,
              valid_thru: now.toISOString(),
              description: "Expiring valid transaction",
              callback: ({ res }) => {
                createdVariables.transactions.transaction[
                  users.W1000.address
                ].nonExpiringTransactionToW0 = res.body.payload;
                expect(res).to.have.status(201);
                setTimeout(() => {
                  chai
                    .request(API_URL)
                    .post(`${ENFORCER_ENDPOINT}`)
                    .query({
                      users: `${users.W0.address}`,
                      transactions: `${
                        createdVariables.transactions.transaction[
                          users.W1000.address
                        ].nonExpiringTransactionToW0.address
                      }`,
                    })
                    .end(function (err, res) {
                      expect(res).to.have.status(200);
                      setTimeout(() => {
                        chai
                          .request(API_URL)
                          .get(`${USERS_ENDPOINT}/${users.W0.address}`)
                          .end(function (err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body.latest_transactions)
                              .to.be.an("array")
                              .that.does.include(
                                createdVariables.transactions.transaction[
                                  users.W1000.address
                                ].nonExpiringTransactionToW0.address
                              );
                            res.body.should.have.property("balance").equal(3);
                            done();
                          });
                      }, 5000);
                    });
                }, 2500);
              },
            });
          });
        });
      });
      describe(`POST ${ENFORCER_ENDPOINT}?users={users}`, () => {
        describe("Enforcer success validations", function () {
          this.slow(15000);
          this.timeout(20000);
          it("Pending valid thru transaction should be deleted successfully", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.pending_transactions)
                  .to.be.an("array")
                  .that.does.include(
                    createdVariables.transactions.transaction[
                      users.W1000.address
                    ].expiringTransaction.address
                  );
                chai
                  .request(API_URL)
                  .post(`${ENFORCER_ENDPOINT}`)
                  .query({
                    users: `${users.W1000.address},${users.W0.address}`,
                  })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
                        .end(function (err, res) {
                          expect(res).to.have.status(200);
                          expect(res.body.pending_transactions)
                            .to.be.an("array")
                            .that.does.not.include(
                              createdVariables.transactions.transaction[
                                users.W1000.address
                              ].expiringTransaction.address
                            );
                          done();
                        });
                    }, 5000);
                  });
              });
          });
        });
      });
      describe("Enforcer success validations", function () {
        this.slow(20000);
        this.timeout(30000);
        it("Expiring lastest transactions should be deleted successfully", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
            .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body.latest_transactions)
                .to.be.an("array")
                .that.does.include(
                  createdVariables.transactions.transaction[
                    users.CantTransferW1000.address
                  ].expiringTransaction.address
                );
              chai
                .request(API_URL)
                .post(`${ENFORCER_ENDPOINT}`)
                .end(function (err, res) {
                  expect(res).to.have.status(200);
                  setTimeout(() => {
                    chai
                      .request(API_URL)
                      .get(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
                      .end(function (err, res) {
                        expect(res).to.have.status(200);
                        expect(res.body.latest_transactions)
                          .to.be.an("array")
                          .that.does.not.include(
                            createdVariables.transactions.transaction[
                              users.CantTransferW1000.address
                            ].expiringTransaction.address
                          );
                        expect(res.body.balance).to.equal(2);
                        done();
                      });
                  }, 5000);
                });
            });
        });
      });
    });
  });
  describe(`${USERS_ENDPOINT} Tests`, () => {
    describe(`GET ${USERS_ENDPOINT}`, () => {
      describe(`Successful requests`, () => {
        describe("Get all users (non expanded)", () => {
          it("Non expanded users should be returned", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ limit: 5 })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                done();
              });
          });
        });
        describe("Get all simplified users (non expanded & simplified)", () => {
          it("Non expanded users should be returned", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ limit: 5, simplifyUser: true })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                done();
              });
          });
        });
        describe("Get all users and hide their public keys (non expanded)", () => {
          it("Non expanded users should be returned without exposing their public keys", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ limit: 5, hidePublicKey: true })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                expect(res).to.have.status(200);
                res.body.forEach((user) => {
                  expect(user).not.to.have.property("public_key");
                });
                done();
              });
          });
        });
        describe("Get all users (expanded)", function () {
          this.slow(1500);
          this.timeout(5000);
          it("All users returned should be expanded", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ expand: true, limit: 5 })
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an("array");
                res.body.forEach((user) => {
                  Array.from(user.latest_transactions).forEach((transaction) =>
                    expect(transaction).not.to.be.a("string")
                  );
                  Array.from(user.pending_transactions).forEach((transaction) =>
                    expect(transaction).not.to.be.a("string")
                  );
                });

                done();
              });
          });
        });
        describe("Get all users (expanded & simplified -> expanded should prevail)", function () {
          this.slow(1500);
          this.timeout(5000);
          it("All users returned should be expanded", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ expand: true, limit: 5 })
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an("array");
                res.body.forEach((user) => {
                  Array.from(user.latest_transactions).forEach((transaction) =>
                    expect(transaction).not.to.be.a("string")
                  );
                  Array.from(user.pending_transactions).forEach((transaction) =>
                    expect(transaction).not.to.be.a("string")
                  );
                });

                done();
              });
          });
        });
        describe("Get all users (expanded /w simplifiedTransaction)", function () {
          this.slow(1500);
          this.timeout(5000);
          it("All users returned should be expanded and their transactions simplified", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ expand: true, limit: 5, simplifyTransaction: true })
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an("array");
                res.body.forEach((user) => {
                  Array.from(user.latest_transactions).forEach(
                    (transaction) => {
                      expect(transaction).not.to.be.a("string");
                      if (transaction.supporting_transactions)
                        expect(transaction.supporting_transactions).to.be.a(
                          "number"
                        );
                    }
                  );
                  Array.from(user.pending_transactions).forEach(
                    (transaction) => {
                      expect(transaction).not.to.be.a("string");
                      if (transaction.supporting_transactions)
                        expect(transaction.supporting_transactions).to.be.a(
                          "number"
                        );
                    }
                  );
                });

                done();
              });
          });
        });
        describe("Get all users and hide their public keys (expanded)", function () {
          this.slow(1500);
          this.timeout(5000);
          it("All users returned should be expanded without exposing their public keys", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ expand: true, limit: 5, hidePublicKey: true })
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an("array");
                res.body.forEach((user) => {
                  expect(user).not.to.have.property("public_key");
                  Array.from(user.latest_transactions).forEach((transaction) =>
                    expect(transaction).not.to.be.a("string")
                  );
                  Array.from(user.pending_transactions).forEach((transaction) =>
                    expect(transaction).not.to.be.a("string")
                  );
                });

                done();
              });
          });
        });
      });
    });
    describe(`GET ${USERS_ENDPOINT}/:address`, () => {
      describe(`User error validations`, () => {
        describe("Value validation", () => {
          it("Non existent user should throw an error", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}/${uuidv4()}`)
              .end(function (err, res) {
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Empty user address should throw an error", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}/      /`)
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
        });
      });
      describe("User success validations", function () {
        it("User should be retrieved successfully", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an("object");
              done();
            });
        });
        it("User should be retrieved successfully without exposing public key", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .query({ hidePublicKey: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an("object");
              expect(res.body).not.to.have.property("public_key");
              done();
            });
        });
        it("User should be retrieved and expanded successfully", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .query({ expand: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              const user = res.body;
              expect(res.body).to.be.an("object");
              Array.from(user.latest_transactions).forEach((transaction) =>
                expect(transaction).not.to.be.a("string")
              );
              Array.from(user.pending_transactions).forEach((transaction) =>
                expect(transaction).not.to.be.a("string")
              );
              done();
            });
        });
        it("User should be retrieved and expanded successfully /w simplified transactions", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .query({ expand: true, simplifyTransaction: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              const user = res.body;
              expect(res.body).to.be.an("object");
              Array.from(user.latest_transactions).forEach((transaction) =>
                expect(transaction).not.to.be.a("string")
              );
              Array.from(user.pending_transactions).forEach((transaction) =>
                expect(transaction).not.to.be.a("string")
              );
              done();
            });
        });
        it("User should be retrieved and expanded successfully without exposing public key", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .query({ expand: true, hidePublicKey: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              const user = res.body;
              expect(res.body).to.be.an("object");
              expect(res.body).not.to.have.property("public_key");
              Array.from(user.latest_transactions).forEach((transaction) =>
                expect(transaction).not.to.be.a("string")
              );
              Array.from(user.pending_transactions).forEach((transaction) =>
                expect(transaction).not.to.be.a("string")
              );
              done();
            });
        });
      });
    });
    describe(`POST ${USERS_ENDPOINT}`, () => {
      describe("User errors validations", () => {
        describe("Empty values", () => {
          it("Empty request should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({})
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Empty address should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({ public_key: createFakePublicKey() })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "address",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Empty public_key should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({ address: uuidv4() })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "public_key",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
        describe("Value validation", () => {
          it("Permission value that is not a dictionary should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: createFakePublicKey(),
                permissions: "coinbase",
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "permissions",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Permission value that is not boolean should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: createFakePublicKey(),
                permissions: { coinbase: "TRUE" },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "permissions",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Nested permissions value (transfer_to) that is not boolean should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: createFakePublicKey(),
                permissions: {
                  transfer_to: { [users.W1000.address]: ["true"] },
                },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "permissions",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Return_to property that is not a dictionary should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: createFakePublicKey(),
                permissions: { coinbase: true },
                return_to: uuidv4(),
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "return_to",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Return_to value that is not string should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: createFakePublicKey(),
                permissions: { coinbase: true },
                return_to: { default: [uuidv4()] },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "return_to",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("public_key value that is not a 66-character string should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: uuidv4(),
                permissions: { coinbase: true },
                return_to: { default: [uuidv4()] },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "public_key",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
        describe("User validation", () => {
          it("Already existing user with same address should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: users.W1000.address,
                public_key: createFakePublicKey(),
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "address",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Return_to user that does not exist should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: createFakePublicKey(),
                permissions: { coinbase: true },
                return_to: { default: uuidv4() },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "return_to",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
      });
      describe("User success validations", function () {
        this.slow(15000);
        this.timeout(20000);
        it("User should be created successfully", (done) => {
          chai
            .request(API_URL)
            .post(`${USERS_ENDPOINT}`)
            .send({
              address: uuidv4(),
              public_key: createFakePublicKey(),
              permissions: { coinbase: true },
            })
            .end(function (err, res) {
              expect(res).to.have.status(201);
              done();
            });
        });
      });
    });
    describe(`PUT ${USERS_ENDPOINT}`, () => {
      describe("User errors validations", () => {
        describe("Value validation", () => {
          it("Permission value that is not boolean should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .send({
                permissions: { coinbase: "TRUE" },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "permissions",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Nested permissions value (transfer_to) that is not boolean should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .send({
                permissions: {
                  transfer_to: { [users.W1000.address]: ["true"] },
                },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "permissions",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Return_to value that is not string should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .send({
                permissions: { coinbase: true },
                return_to: { default: [uuidv4()] },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "return_to",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
        describe("User validation", () => {
          it("Non existing user should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(`${USERS_ENDPOINT}/${uuidv4()}`)
              .send({
                permissions: { coinbase: true },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "address",
                    location: "params",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Return_to user that does not exist should throw an error", (done) => {
            chai
              .request(API_URL)
              .put(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .send({
                permissions: { coinbase: true },
                return_to: { default: uuidv4() },
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "return_to",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
      });
      describe("User success validations", function () {
        this.slow(15000);
        this.timeout(20000);
        it("User should be updated successfully", (done) => {
          chai
            .request(API_URL)
            .put(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .send({
              role: "New role",
              description: "Updated user",
              active: true,
              permissions: { coinbase: true },
              return_to: { default: users.NoCoinbase.address },
            })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              done();
            });
        });
      });
    });
    describe(`DELETE ${USERS_ENDPOINT}`, () => {
      describe("User errors validations", () => {
        describe("Value validation", () => {
          it("Empty delete reason should throw an error", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
              .send({})
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "reason",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Non string delete reason should throw an error", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
              .send({ reason: ["a reason"] })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "reason",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
        describe("User validation", () => {
          it("Non existing user should throw an error", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${uuidv4()}`)
              .send({ reason: "default" })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "address",
                    location: "params",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Non existing delete reason should throw an error", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
              .send({
                reason: "undefined reason",
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "reason",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Inactive delete reason user should throw an error", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
              .send({
                reason: "inactive",
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "reason",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
          it("User without return to addresses should throw an error", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${users.W0.address}`)
              .send({
                reason: "inactive",
              })
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(
                  _.some(res.body.errors, {
                    param: "reason",
                    location: "body",
                  })
                ).to.be.true;
                expect(res).to.have.status(400);
                done();
              });
          });
        });
      });
      describe("User success validations", function () {
        this.slow(15000);
        this.timeout(20000);
        it("User should be deactivated & their balance should be transferred successfully (user with balance greater than zero)", (done) => {
          chai
            .request(API_URL)
            .delete(`${USERS_ENDPOINT}/${users.ToDeleteW1000.address}`)
            .send({
              reason: "default",
            })
            .end(function (err, res) {
              expect(res).to.have.status(201);
              done();
            });
        });
        it("User should be deactivated successfully (user with balance equal to zero)", (done) => {
          chai
            .request(API_URL)
            .delete(`${USERS_ENDPOINT}/${users.ToDelete.address}`)
            .send({
              reason: "default",
            })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              done();
            });
        });
      });
    });
  });
  describe(`${CONFIG_ENDPOINT} Tests`, () => {
    describe(`GET ${CONFIG_ENDPOINT}`, () => {
      describe(`Successful requests`, () => {
        describe("Get all environment variables", () => {
          it("All environment variables should be returned", (done) => {
            chai
              .request(API_URL)
              .get(`${CONFIG_ENDPOINT}`)
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.variables).to.be.an("object");
                done();
              });
          });
        });
      });
    });
    describe(`POST ${CONFIG_ENDPOINT}`, () => {
      describe(`Successful requests`, () => {
        describe("Get all environment variable", () => {
          it("Empty POST request should return all environment variables", (done) => {
            chai
              .request(API_URL)
              .post(`${CONFIG_ENDPOINT}`)
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.variables).to.be.an("object");
                done();
              });
          });
        });
        describe("Change environment variable", () => {
          it("USE_REDIS environment variable should be changed", (done) => {
            chai
              .request(API_URL)
              .post(`${CONFIG_ENDPOINT}`)
              .send({ USE_REDIS: "true" })
              .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.variables.USE_REDIS).to.eq("true");
                done();
              });
          });
        });
      });
    });
  });

  describe(`Functionality without Redis`, function () {
    this.timeout(8000);
    this.slow(5000);
    before(function (done) {
      this.timeout(8000);
      chai
        .request(API_URL)
        .post(`${CONFIG_ENDPOINT}`)
        .send({ USE_REDIS: "false" })
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body.variables.USE_REDIS).to.eq("false");
          done();
        });
    });
    describe(`${CRYPTO_ENDPOINT}`, () => {
      describe(`Wrap Redis' set & get function`, () => {
        describe(`GET ${CRYPTO_ENDPOINT}/:address`, () => {
          it("Should return the transaction specified", (done) => {
            chai
              .request(API_URL)
              .get(
                `${CRYPTO_ENDPOINT}/${
                  createdVariables.transactions.transaction[users.W1000.address]
                    .coinbase.payload.address
                }`
              )
              .end(function (err, res) {
                expect(res).to.have.status(200);
                done();
              });
          });
        });
      });
      describe(`Wrap Redis' del function`, () => {
        describe(`POST ${USERS_ENDPOINT}`, () => {
          it("Should create the user specified", (done) => {
            createUser({
              alias: "Redis",
              coinbasePermission: true,
              active: true,
              callback: ({ res }) => {
                expect(res).to.have.status(201);
                done();
              },
            });
          });
        });
      });
    });
    describe(`${USERS_ENDPOINT} fallback test`, () => {
      describe(`Redis fallback requests`, () => {
        describe(`GET ${USERS_ENDPOINT}/:address`, () => {
          it("Should return the user even if it has no connection to Sawtooth REST API", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .end(function (err, res) {
                expect(res).to.have.status(200);
                done();
              });
          });
        });
      });
    });
  });

  if (process.env.USE_REDIS === "true") {
    describe(`Redis cache fallback`, function () {
      this.timeout(8000);
      this.slow(5000);
      before(function (done) {
        const newUrl = `http://${uuidv4()}.com`;
        this.timeout(8000);
        chai
          .request(API_URL)
          .post(`${CONFIG_ENDPOINT}`)
          .send({ SAWTOOTH_REST: newUrl, USE_REDIS: "true" })
          .end(function (err, res) {
            expect(res).to.have.status(200);
            expect(res.body.variables.SAWTOOTH_REST).to.eq(newUrl);
            expect(res.body.variables.USE_REDIS).to.eq("true");
            done();
          });
      });
      describe(`${CRYPTO_ENDPOINT} fallback test`, () => {
        describe(`Redis fallback requests`, () => {
          describe(`GET ${CRYPTO_ENDPOINT}/:address`, () => {
            it("Should return the transaction even if it has no connection to Sawtooth REST API", (done) => {
              chai
                .request(API_URL)
                .get(
                  `${CRYPTO_ENDPOINT}/${
                    createdVariables.transactions.transaction[
                      users.W1000.address
                    ].coinbase.payload.address
                  }`
                )
                .end(function (err, res) {
                  expect(res).to.have.status(200);
                  done();
                });
            });
          });
        });
      });
      describe(`${USERS_ENDPOINT} fallback test`, () => {
        describe(`Redis fallback requests`, () => {
          describe(`GET ${USERS_ENDPOINT}/:address`, () => {
            it("Should return the user even if it has no connection to Sawtooth REST API", (done) => {
              chai
                .request(API_URL)
                .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
                .end(function (err, res) {
                  expect(res).to.have.status(200);
                  done();
                });
            });
          });
        });
      });
    });
  }
  describe(`Hyperledger Sawtooth Error Tests`, function () {
    this.timeout(8000);
    this.slow(5000);
    before(function (done) {
      const newUrl = `http://${uuidv4()}.com`;
      this.timeout(8000);
      chai
        .request(API_URL)
        .post(`${CONFIG_ENDPOINT}`)
        .send({ SAWTOOTH_REST: newUrl, USE_REDIS: "false" })
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body.variables.SAWTOOTH_REST).to.eq(newUrl);
          expect(res.body.variables.USE_REDIS).to.eq("false");
          done();
        });
    });
    describe(`${CRYPTO_ENDPOINT} errors test`, () => {
      describe(`Sawtooth-dependant requests`, () => {
        describe(`GET ${CRYPTO_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
        describe(`GET ${CRYPTO_ENDPOINT}/:address`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .get(
                `${CRYPTO_ENDPOINT}/${
                  createdVariables.transactions.transaction[users.W1000.address]
                    .coinbase.payload.address
                }`
              )
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
        describe(`POST ${CRYPTO_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "W0",
              pending: true,
              description: "Expiring transaction",
              callback: ({ res }) => {
                expect(res).to.have.status(503);
                done();
              },
            });
          });
        });
        describe(`PUT ${CRYPTO_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .put(
                `${CRYPTO_ENDPOINT}/${
                  createdVariables.transactions.transaction[users.W1000.address]
                    .coinbase.payload.address
                }`
              )
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
      });
    });
    describe(`${USERS_ENDPOINT} errors test`, () => {
      describe(`Sawtooth-dependant requests`, () => {
        describe(`GET ${USERS_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
        describe(`GET ${USERS_ENDPOINT}/:address`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
        describe(`POST ${USERS_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            createUser({
              alias: "W10000",
              coinbasePermission: true,
              callback: ({ res }) => {
                expect(res).to.have.status(503);
                done();
              },
            });
          });
        });
        describe(`PUT ${USERS_ENDPOINT}/:address`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .put(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .send({
                permissions: { coinbase: true },
              })
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
        describe(`DELETE ${USERS_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .delete(`${USERS_ENDPOINT}/${users.W1000.address}`)
              .send({ reason: "default" })
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
      });
    });
    describe(`${ENFORCER_ENDPOINT} errors test`, () => {
      describe(`Sawtooth-dependant requests`, () => {
        describe(`POST ${ENFORCER_ENDPOINT}`, () => {
          it("Should throw an error if Sawtooth REST connection fails", (done) => {
            chai
              .request(API_URL)
              .post(`${ENFORCER_ENDPOINT}`)
              .end(function (err, res) {
                expect(res).to.have.status(503);
                done();
              });
          });
        });
      });
    });
  });
});
