const { ethers } = require("ethers");
const secp256k1 = require("secp256k1");

module.exports.getPublicKey = (msg, signature) => {
  try {
    const wrapped = "\x19Ethereum Signed Message:\n" + msg.length + msg;
    const hashSecp256 = ethers.utils.keccak256(
      "0x" + Buffer.from(wrapped).toString("hex")
    );
    const publicKey = secp256k1.ecdsaRecover(
      Uint8Array.from(Buffer.from(signature.slice(2, -2), "hex")),
      parseInt(signature.slice(-2), 16) - 27,
      Buffer.from(hashSecp256.slice(2), "hex"),
      true
    );
    return Buffer.from(publicKey).toString("hex");
  } catch (error) {
    return null;
  }
};
