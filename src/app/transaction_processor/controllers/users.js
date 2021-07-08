const { getUserAddress, getRawState } = require("./common");
const {
  InvalidTransaction,
  InternalError,
} = require("sawtooth-sdk/processor/exceptions");
const { logFormatted, SEVERITY } = require("../utils/logger");
const User = require("../models/User");
async function postUser(context, user, timeout) {
  let addresses = await context.setState(
    {
      [getUserAddress(user.address)]: Buffer.from(JSON.stringify(user), "utf8"),
    },
    timeout
  );

  if (addresses.length === 0) {
    throw new InternalError("State Error!");
  }

  logFormatted(
    `Added transaction state ${user.address.slice(-5)}... -> ${getUserAddress(
      user.address
    ).slice(-5)}`,
    SEVERITY.SUCCESS,
    new User(user).toSimplifiedObject()
  );
}

module.exports.postUser = postUser;
