"use strict";const{TransactionHandler}=require("sawtooth-sdk/processor/handler"),{InvalidTransaction,InternalError}=require("sawtooth-sdk/processor/exceptions");module.exports=function({TP_FAMILY:r,TP_VERSION:e,TP_NAMESPACE:t,handlers:n}){class o extends TransactionHandler{constructor(){super(r,[e],[t])}async apply(r,e){let t,o,a;try{o=JSON.parse(Buffer.from(r.payload,"utf8").toString()),t=o.httpMethod.toLowerCase(),a=o.type,delete o.httpMethod,delete o.type}catch(r){throw console.error("Transaction payload format error",r),new InvalidTransaction("Transaction payload format error",r.message)}if(!n[a])throw new InvalidTransaction(`Transaction type error, missing ${a}, expected type between ${Object.keys(n)}`);try{await n[a][t](e,o)}catch(r){if(console.log("ERROR during:",r),!(r instanceof InternalError))throw r;console.log(r)}}}return o};