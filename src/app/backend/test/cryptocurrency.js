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
const { expect } = chai;
const secp256k1 = require("secp256k1");
const ethers = require("ethers");
const users = {
  W1000: new User({ address: uuidv4() }),
  W0: new User({ address: uuidv4() }),
  NoCoinbase: new User({ address: uuidv4() }),
  CantTransferW1000: new User({ address: uuidv4() }),
  ToDeleteW1000: new User({ address: uuidv4() }),
  Inactive: new User({ address: uuidv4() }),
};
const createdVariables = {
  transactions: {
    user: {
      [users.W1000.address]: {},
      [users.W0.address]: {},
      [users.NoCoinbase.address]: {},
      [users.CantTransferW1000.address]: {},
      [users.ToDeleteW1000.address]: {},
      [users.Inactive.address]: {},
    },
    transaction: {
      [users.W1000.address]: {},
      [users.W0.address]: {},
      [users.NoCoinbase.address]: {},
      [users.CantTransferW1000.address]: {},
      [users.ToDeleteW1000.address]: {},
      [users.Inactive.address]: {},
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
      });
    });
  return true;
};

describe(`Cryptocurrency Test Suite`, () => {
  before(function (done) {
    this.timeout(20000);

    const createdUserCallback = ({ res, alias, callback }) => {
      const address = users[alias].address;
      console.log(res.body);
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
                      callback: () => setTimeout(done, 5000),
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
        describe("Get all transactions (expanded)", () => {
          it("All transactions returned should be expanded", (done) => {
            chai
              .request(API_URL)
              .get(`${CRYPTO_ENDPOINT}`)
              .query({ expanded: true, limit: 5 })
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
                  .coinbase.payload.signature
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
                ].W0.payload.signature
              }`
            )
            .query({ expanded: true })
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
                  ].W0.payload.signature + "1",
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
          /*  Transactions signatures don't collide anymore.
          it("Already existing transaction with same signature should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${CRYPTO_ENDPOINT}`)
              .send({
                amount: 10,
                recipient: users.W1000.address,
                signature:
                  createdVariables.transactions.transaction[
                    users.CantTransferW1000.address
                  ].W0.payload.signature,
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
          }); */
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
          now.setSeconds(now.getSeconds() + 5);
          createTransaction({
            amount: 1,
            senderAlias: "W1000",
            recipientAlias: "W0",
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
          now.setSeconds(now.getSeconds() + 5);
          createTransaction({
            amount: 25,
            senderAlias: "CantTransferW1000",
            recipientAlias: "ToDeleteW1000",
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
    describe(`PUT ${CRYPTO_ENDPOINT}/:address`, () => {
      describe(`Transaction error validations`, () => {
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
                    .coinbase.payload.signature
                }`
              )
              .end(function (err, res) {
                expect(res.body.errors).to.be.an("array");
                expect(res).to.have.status(400);
                done();
              });
          });
          it("Approval signature that isn't signed by sender user throw an error", (done) => {
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
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                    .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
        it("Transaction should be rejected successfully", (done) => {
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
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
                  .send({ description: "New description", signature })
                  .end(function (err, res) {
                    expect(res).to.have.status(200);
                    setTimeout(() => {
                      chai
                        .request(API_URL)
                        .get(
                          `${CRYPTO_ENDPOINT}/${createdTransaction.signature}`
                        )
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
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                              `${CRYPTO_ENDPOINT}/${createdTransaction.signature}`
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
                  .put(`${CRYPTO_ENDPOINT}/${createdTransaction.signature}`)
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
                              `${CRYPTO_ENDPOINT}/${createdTransaction.signature}`
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
            now.setSeconds(now.getSeconds() + 2);
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "W0",
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
                        ].expiringTransactionToW0.signature
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
                            expect(res.body.lastest_transactions)
                              .to.be.an("array")
                              .that.does.not.include(
                                createdVariables.transactions.transaction[
                                  users.W1000.address
                                ].expiringTransactionToW0.signature
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
            now.setSeconds(now.getSeconds() + 60);
            createTransaction({
              amount: 1,
              senderAlias: "W1000",
              recipientAlias: "W0",
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
                        ].nonExpiringTransactionToW0.signature
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
                            expect(res.body.lastest_transactions)
                              .to.be.an("array")
                              .that.does.include(
                                createdVariables.transactions.transaction[
                                  users.W1000.address
                                ].nonExpiringTransactionToW0.signature
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
                    ].expiringTransaction.signature
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
                              ].expiringTransaction.signature
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
              expect(res.body.lastest_transactions)
                .to.be.an("array")
                .that.does.include(
                  createdVariables.transactions.transaction[
                    users.CantTransferW1000.address
                  ].expiringTransaction.signature
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
                        expect(res.body.lastest_transactions)
                          .to.be.an("array")
                          .that.does.not.include(
                            createdVariables.transactions.transaction[
                              users.CantTransferW1000.address
                            ].expiringTransaction.signature
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
        describe("Get all users (expanded)", function () {
          this.slow(1500);
          this.timeout(5000);
          it("All users returned should be expanded", (done) => {
            chai
              .request(API_URL)
              .get(`${USERS_ENDPOINT}`)
              .query({ expanded: true, limit: 5 })
              .end(function (err, res) {
                expect(res.body).to.be.an("array");
                /* res.body.forEach(user => {
                  const retrievedUser = new User(user);
                  console.log("USER LT", );
                  (Array.from(retrievedUser.lastest_transactions)||[]).forEach(transaction => expect(transaction).to.be.an("object"))
                  (Array.from(retrievedUser.pending_transactions)||[]).forEach(transaction => expect(transaction).to.be.an("object"))
                }) */
                expect(res).to.have.status(200);
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
                //expect(res.body.errors).to.be.an("array");
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
        it("User should be retrieved and expanded successfully", (done) => {
          chai
            .request(API_URL)
            .get(`${USERS_ENDPOINT}/${users.W1000.address}`)
            .query({ expanded: true })
            .end(function (err, res) {
              expect(res).to.have.status(200);
              const retrievedUser = new User(res.body);
              expect(res.body).to.be.an("object");
              /*  (Array.from(retrievedUser.lastest_transactions)).forEach(transaction => expect(transaction).to.be.an("object"))
              (Array.from(retrievedUser.pending_transactions)).forEach(transaction => expect(transaction).to.be.an("object")) */
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
              .send({ public_key: uuidv4() })
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
          it("Permission value that is not boolean should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: uuidv4(),
                public_key: uuidv4(),
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
                public_key: uuidv4(),
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
          it("Already existing user with same address should throw an error", (done) => {
            chai
              .request(API_URL)
              .post(`${USERS_ENDPOINT}`)
              .send({
                address: users.W1000.address,
                public_key: users.W1000.address,
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
                public_key: uuidv4(),
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
              public_key: uuidv4(),
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
        });
      });
      describe("User success validations", function () {
        this.slow(15000);
        this.timeout(20000);
        it("User should be deleted successfully", (done) => {
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
      });
    });
  });
});
