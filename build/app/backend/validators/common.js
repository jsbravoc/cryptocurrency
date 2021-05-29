const{validationResult}=require("express-validator"),{findByAddress}=require("../controllers/common"),{TYPE}=require("../utils/constants"),{ERRORS}=require("../utils/errors"),{SEVERITY,logFormatted}=require("../utils/logger"),validate=r=>(a,o,t)=>Promise.all(r.map(r=>r.run(a))).then(()=>{const r=validationResult(a);if(r.isEmpty())return t();const e=[];(r.array()||[]).forEach(r=>r.msg&&e.push(r.msg)),o.status(400).json({errors:0<e.length?e:r.array()})}),createErrorObj=(r,{error:e,location:a,params:o,noLocation:t=!1})=>{const s={};return e.errorCode&&(s.errorCode=e.errorCode),o&&o.param&&(o.parameter=o.param),e.error&&(s.error=e.error(r,o)),e.msg&&(s.msg=e.msg(r,o)),!0!==t&&(s.location=a||"body"),o&&o.param&&(s.param=o.param),o&&o.value&&(s.value=o.value),logFormatted(`Validation error with code ${s.errorCode} - ${s.error}`,SEVERITY.WARN),{...s}},createError=(r,e,{error:a,location:o,params:t,statusCode:s=400,noLocation:l=!1})=>{l=createErrorObj(r,{error:a,location:o,params:t,noLocation:l});return e.status(s).json({errors:[{...l}]})},validateAssetExistence=(s,l,i,n,c,{location:d=null,param:E=null}={})=>{let r,e;switch(l=(l+"").trim(),s){case TYPE.TRANSACTION:r=ERRORS.TRANSACTION,e="signature";break;case TYPE.USER:r=ERRORS.USER,e="address";break;default:return Promise.reject(`Missing type ${s}`)}return l&&""!==l?findByAddress(s,l,!1,!1,c).then(r=>{var e=i&&null===r,a=!i&&null!==r;if(e||a){var o=`${s.toProperCase()} with address {${l}} ${e?"does not":"already"} exist${e?"":"s"}`;logFormatted(o,SEVERITY.ERROR);let r;switch(s){case TYPE.TRANSACTION:e?r={error:ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST,location:d||"params",params:{signature:l,param:E||"address",value:l}}:a&&(r={error:ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS,location:d||"body",params:{signature:l,param:E||"signature",value:l}});break;case TYPE.USER:e?r={error:ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,location:d||"query",params:{address:l,param:E||"address",value:l}}:a&&(r={error:ERRORS.USER.INPUT.USER_EXISTS,location:d||"body",params:{address:l,param:E||"address",value:l}})}return Promise.reject({callback:createError(n,c,r)})}const t={};return t[s]=r,Promise.resolve(t)}).catch(r=>r.callback?Promise.reject(()=>r.callback()):Promise.reject(()=>createError(n,c,{error:ERRORS.SAWTOOTH.UNAVAILABLE,statusCode:503,noLocation:!0}))):Promise.reject(()=>createError(n,c,{error:r.INPUT.NO_INPUT,location:d,params:{property:e,param:e,value:null}}))};module.exports.validateAssetExistence=validateAssetExistence,module.exports.validate=validate,module.exports.createError=createError,module.exports.createErrorObj=createErrorObj;