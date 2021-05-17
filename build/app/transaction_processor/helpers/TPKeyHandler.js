/*! cryptocurrency 2021-05-17 */
"use strict";const _=require("underscore"),{TransactionHandler}=require("sawtooth-sdk/processor/handler"),{InvalidTransaction,InternalError}=require("sawtooth-sdk/processor/exceptions"),{ethers}=require("ethers"),secp256k1=require("secp256k1");async function getRawState(t,e,r){e=(await t.getState([e],r))[e];if(e&&0!=e.length)return e}async function getState(t,e,r,a){a=await getRawState(t,e(r),a);if(!_.isUndefined(a)){a=JSON.parse(Buffer.from(a,"utf8").toString());if(!_.isArray(a))throw new InternalError("State Error");a=_.find(a,t=>t.key===r);return a?a.value:void 0}}async function putState(t,e,a,n,r){var o=await getRawState(t,e(a),r);let i;if(_.isUndefined(o))i=[{key:a,value:n}];else{let e=JSON.parse(Buffer.from(o,"utf8").toString());if(!_.isArray(e))throw new InternalError("State Error");let r=!1;for(let t=0;t<e.length;t++)if(e[t].key===a){e[t].value=n,r=!0;break}r||e.push({key:a,value:n}),i=e}if(0===(await t.setState({[e(a)]:Buffer.from(JSON.stringify(i),"utf8")},r)).length)throw new InternalError("State Error!")}async function deleteState(t,e,r,a){var n=await getRawState(t,e(r),a);if(!_.isUndefined(n)){var n=JSON.parse(Buffer.from(n,"utf8").toString());if(!_.isArray(n))throw new InternalError("State Error");if(0<(n=_.filter(n,t=>t.key!==r)).length){if(0===(await t.setState({[e(r)]:Buffer.from(JSON.stringify(n),"utf8")},a)).length)throw new InternalError("State Error!")}else if(0===(await t.deleteState([e(r)],a)).length)throw new InternalError("State Error!")}}function getPublicKey(t,e){t="Ethereum Signed Message:\n"+t.length+t;const r=ethers.utils.keccak256("0x"+Buffer.from(t).toString("hex"));e=secp256k1.ecdsaRecover(Uint8Array.from(Buffer.from(e.slice(2,-2),"hex")),parseInt(e.slice(-2),16)-27,Buffer.from(r.slice(2),"hex"),!0);return Buffer.from(e).toString("hex")}module.exports=function({TP_FAMILY:t,TP_VERSION:e,TP_NAMESPACE:r,handlers:n,addresses:o}){class a extends TransactionHandler{constructor(){super(t,[e],[r])}async apply(t,s){let e,r;try{var a=JSON.parse(Buffer.from(t.payload,"utf8").toString());r=a.func,e=a.args;var{}=e}catch(t){throw new InvalidTransaction("Bad transaction Format")}a=_.map(o,a=>{let r,n,o,i;return a.keysCanCollide?(r=getState,n=putState,o=deleteState,i=getRawState):(r=async(t,e,r,a)=>{a=await getRawState(t,e(r),a);if(a)return console.log("state: ",a),JSON.parse(Buffer.from(a).toString("utf8"))},n=(t,e,r,a,n)=>t.setState({[e(r)]:Buffer.from(JSON.stringify(a),"utf8")},n),o=(t,e,r,a)=>t.deleteState([e(r)],a)),{getRawState:function(t,e){return i(s,t,e)},getState:function(t,e){return r(s,a,t,e)},putState:function(t,e,r){return n(s,a,t,e,r)},deleteState:function(t,e){return o(s,a,t,e)},addEvent:function(){return s.addEvent.apply(s,[...arguments])},addReceiptData:function(){return s.addReceiptData.apply(s,[...arguments])},context:s,transactionProcessRequest:t,publicKey:void 0}});if("dev"===process.env.NODE_ENV)try{await n[r](a,e)}catch(t){if(!(t instanceof InternalError))throw t;console.log(t)}else await n[r](a,e)}}return a},module.exports.getState=getState,module.exports.putState=putState,module.exports.deleteState=deleteState;