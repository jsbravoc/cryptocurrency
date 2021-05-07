module.exports = Object.freeze({
  MAXIMUM_FLOAT_PRECISION: 5,
  TRANSACTION_FAMILY: "cnk-cryptocurrency",
  TRANSACTION_FAMILY_VERSION: "1.0",
  TYPE: {
    USER: "USER",
    TRANSACTION: "TRANSACTION",
    TRANSFER: "TRANSFER",
  },
  ADDRESS_PREFIX: {
    TRANSACTION: "00",
    USER: "01",
    TRANSFER: "02",
  },
  USER_TYPE: {
    SENDER: "SENDER",
    RECIPIENT: "RECIPIENT",
  },
  HTTP_METHODS: {
    PUT: "PUT",
    POST: "POST",
    GET: "GET",
    DELETE: "DELETE",
  },
  LOCAL_ADDRESS: `${require("ip").address()}`,
});
