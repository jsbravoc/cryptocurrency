/*! cryptocurrency 2021-05-19 */
const{ethers}=require("ethers"),secp256k1=require("secp256k1");module.exports.getPublicKey=(e,r)=>{try{var t="Ethereum Signed Message:\n"+e.length+e;const c=ethers.utils.keccak256("0x"+Buffer.from(t).toString("hex"));var s=secp256k1.ecdsaRecover(Uint8Array.from(Buffer.from(r.slice(2,-2),"hex")),parseInt(r.slice(-2),16)-27,Buffer.from(c.slice(2),"hex"),!0);return Buffer.from(s).toString("hex")}catch(e){return null}};