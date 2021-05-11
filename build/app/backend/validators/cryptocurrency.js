/*! cryptocurrency 2021-05-11 */
const{body}=require("express-validator"),{TYPE}=require("../utils/constants"),{ERRORS}=require("../utils/errors"),{validate,createError,validateAssetExistence,createErrorObj}=require("./common"),{findByAddress}=require("../controllers/common"),Transaction=require("../models/Transaction"),{MAXIMUM_FLOAT_PRECISION}=require("../utils/constants"),{getPublicKey}=require("../utils/signature"),inputValidation=validate([body("recipient").notEmpty().withMessage((r,{req:e})=>createErrorObj(e,{error:ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,params:{param:"recipient",value:r}})).trim().bail(),body("amount").notEmpty().isFloat({gt:0}).toFloat().withMessage((r,{req:e})=>createErrorObj(e,{error:ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,params:{param:"amount",value:r}})).bail(),body("amount").customSanitizer(r=>{if(r)return Number(r.toFixed(MAXIMUM_FLOAT_PRECISION))}),body("signature").notEmpty().withMessage((r,{req:e})=>createErrorObj(e,{error:ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,params:{param:"signature",value:r}})).trim().bail(),body("sender").optional({checkFalsy:!0,checkNull:!0}).trim(),body("valid_thru").optional({checkFalsy:!0,checkNull:!0}).isISO8601().toDate().withMessage((r,{req:e})=>createErrorObj(e,{error:ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,params:{param:"valid_thru",value:r,message:"The valid_thru date must be in ISO 8601 format"}})).bail(),body("supporting_transactions").customSanitizer(()=>{}),body("creationDate").customSanitizer(()=>{}),body("valid_thru").custom((r,{req:e})=>!(r&&new Date(r)<new Date)||Promise.reject(createErrorObj(e,{error:ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,params:{param:"valid_thru",value:r,message:"The valid_thru date must be after the transaction creation date"}}))),body("valid").customSanitizer((r,{req:e})=>(null===e.body.pending||void 0===e.body.pending||!0!==e.body.pending&&"true"!==e.body.pending)&&r),body("pending").optional({checkNull:!0}).toBoolean(),body("valid").optional({checkNull:!0}).toBoolean()]),validateExistingTransaction=(r,e,a,t,s,{location:n="body"}=null)=>validateAssetExistence(TYPE.TRANSACTION,t,s,r,e,{location:n}).then(()=>{a()}).catch(r=>r()),verifyPostTransaction=(i,d,R)=>{const r=[findByAddress(TYPE.USER,i.body.recipient,!1,!1,d)];return i.body.sender&&r.push(findByAddress(TYPE.USER,i.body.sender,!1,!1,d)),Promise.all(r).then(([r,e])=>{if(r){if(r&&!1===r.active)return createError(i,d,{error:ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE,params:{address:i.body.recipient.address,param:"recipient",value:i.body.recipient.address}});if(i.body.sender&&!e)return createError(i,d,{error:ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,params:{address:i.body.sender,param:"sender",value:i.body.sender}});if(e&&!1===e.active)return createError(i,d,{error:ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE,params:{address:i.body.sender,param:"sender",value:i.body.sender}});if(e){if(e.permissions&&e.permissions.transfer_to&&!1===e.permissions.transfer_to[i.body.recipient])return createError(i,d,{error:ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS,params:{address:i.body.sender,recipient:i.body.recipient,param:"sender",value:i.body.sender}});if(e.balance<i.body.amount)return createError(i,d,{error:ERRORS.USER.INPUT.INSUFFICIENT_FUNDS,params:{address:i.body.sender,param:"amount",value:i.body.sender}});if(Array.isArray(e.lastest_transactions)&&0!==e.lastest_transactions.length){let s=i.body.amount,n=0,o=!1;const a=[];return(e.lastest_transactions||[]).forEach(e=>{a.push(findByAddress(TYPE.TRANSACTION,e,!1,!1,d).then(r=>r?r.recipient!==i.body.sender?(o=!0,createError(i,d,{error:ERRORS.USER.LOGIC.INCORRECT_RECIPIENT_LASTEST_TRANSACTION,params:{address:i.body.sender,param:"sender",value:i.body.sender,transactionSignature:e}})):(s-=r.amount,void(n+=r.amount)):(o=!0,createError(i,d,{error:ERRORS.USER.LOGIC.NONEXISTENT_LASTEST_TRANSACTION,params:{address:i.body.sender,param:"sender",value:i.body.sender,transactionSignature:e}}))))}),Promise.all(a).then(()=>{if(!o){const r=s;let a=0;const t=[];return(e.pending_transactions||[]).forEach(e=>{t.push(findByAddress(TYPE.TRANSACTION,e,!1,!1,d).then(r=>r?void(r.creator===i.body.sender&&(a+=r.amount,s+=r.amount,n-=r.amount)):(o=!0,createError(i,d,{error:ERRORS.USER.LOGIC.NONEXISTENT_PENDING_TRANSACTION,params:{address:i.body.sender,param:"sender",value:i.body.sender,transactionSignature:e}}))))}),Promise.all(t).then(()=>{if(!o)return 0<s?(o=!0,s!==r?createError(i,d,{error:ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS,params:{address:i.body.sender,param:"amount",value:i.body.sender,amountPending:a,actualBalance:n}}):createError(i,d,{error:ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE,params:{address:i.body.sender,param:"amount",value:i.body.sender,actualBalance:n}})):R()})}})}return createError(i,d,{error:ERRORS.USER.INPUT.NO_TRANSACTIONS,params:{address:i.body.sender,param:"sender",value:i.body.sender}})}return r&&r.permissions&&!0!==r.permissions.coinbase?createError(i,d,{error:ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS,params:{address:i.body.recipient,param:"recipient",value:i.body.recipient,requiredPermission:"coinbase"}}):R()}return createError(i,d,{error:ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,params:{address:i.body.recipient,param:"recipient",value:i.body.recipient}})})},validatePendingTransaction=async(e,a,t)=>{var{address:r}=e.params;return findByAddress(TYPE.TRANSACTION,r,!1,!1,a).then(r=>r.pending?t():createError(e,a,{error:ERRORS.TRANSACTION.INPUT.TRANSACTION_IS_NOT_PENDING,params:{signature:e.params.address,param:"address",value:e.params.address}}))},validateTransactionAddress=[(r,e,a)=>validateExistingTransaction(r,e,a,r.params.address,!0,{location:"params"})],validateTransactionSignature=(e,a,t)=>{if("true"===process.env.DISABLE_INTEGRITY_VALIDATION)return t();var{creator:r,sender:s,recipient:n,signature:o}=e.body,i=new Transaction(e.body).toSignatureString();const d=getPublicKey(i,o);return d?findByAddress(TYPE.USER,r||s||n,!1,!1,a).then(r=>r.public_key!==d?createError(e,a,{error:ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,params:{param:"signature",value:e.body.signature}}):t()):createError(e,a,{error:ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR,params:{param:"signature",value:e.body.signature}})},validateTransactionApproval=(s,n,o)=>{if("true"===process.env.DISABLE_INTEGRITY_VALIDATION)return o();var{address:r}=s.params;const{approve:i}=s.query,d=s.query.signature||s.body.signature;return void 0===i?o():void 0===d?createError(s,n,{error:ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,location:"query",params:{param:"signature"}}):"true"!==i&&"false"!==i?createError(s,n,{error:ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT,location:"query",params:{param:"signature"}}):findByAddress(TYPE.TRANSACTION,r,!1,!1,n).then(r=>{const e={approve:"true"===i};s.body.description&&(e.description=s.body.description);const a=getPublicKey(JSON.stringify(e),d);if(a){const t=[];return t.push(findByAddress(TYPE.USER,r.sender,!1,!1,n)),"false"===i&&t.push(findByAddress(TYPE.USER,r.recipient,!1,!1,n)),Promise.all(t).then(([r,e])=>(!e||e.public_key===a||r.public_key===a)&&(e||r.public_key===a)?o():createError(s,n,{error:ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,location:"query",params:{param:"signature",value:s.params.signature}}))}return createError(s,n,{error:ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR,location:"query",params:{param:"signature",value:s.params.signature}})})},validateTransactionUpdate=(t,s,n)=>{if("true"===process.env.DISABLE_INTEGRITY_VALIDATION)return n();var{address:r}=t.params,{approve:e}=t.query;const{description:o,signature:i}=t.body;return void 0!==e?n():void 0===i?createError(t,s,{error:ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,location:"body",params:{param:"signature"}}):void 0===o?createError(t,s,{error:ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT,location:"body",params:{param:"description"}}):findByAddress(TYPE.TRANSACTION,r,!1,!1,s).then(r=>{const a=getPublicKey(JSON.stringify({description:o}),i);if(a){r=[findByAddress(TYPE.USER,r.creator,!1,!1,s),findByAddress(TYPE.USER,r.sender,!1,!1,s)];return Promise.all(r).then(([r,e])=>r.public_key!==a&&e.public_key!==a?createError(t,s,{error:ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS,params:{param:"signature",value:t.body.signature}}):n())}return createError(t,s,{error:ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR,params:{param:"signature",value:t.body.signature}})})},validateTransactionUpdateRequest=[validatePendingTransaction,validateTransactionApproval,validateTransactionUpdate];module.exports.validateTransactionAddress=validateTransactionAddress,module.exports.validateTransactionUpdateRequest=validateTransactionUpdateRequest,module.exports.verifyPostTransaction=[(r,e,a)=>validateExistingTransaction(r,e,a,r.body.signature,!1,{location:"body"}),verifyPostTransaction,validateTransactionSignature],module.exports.inputValidation=inputValidation;