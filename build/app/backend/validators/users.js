/*! cryptocurrency 2021-05-07 */
const{body}=require("express-validator"),_=require("lodash"),{findByAddress}=require("../controllers/common"),{validate,validateAssetExistence,createError,createErrorObj}=require("./common"),{TYPE}=require("../utils/constants"),{ERRORS}=require("../utils/errors"),validateExistingUser=(e,r,a,t,o,{location:s="body"}=null)=>validateAssetExistence(TYPE.USER,t,o,e,r,{location:s}).then(()=>{a()}).catch(e=>e()),inputValidation=validate([body("address").trim().not().isEmpty().withMessage((e,{req:r})=>createErrorObj(r,{error:ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT,params:{param:"address",value:e,message:"The address of the user is required"}})).bail(),body("public_key").trim().not().isEmpty().withMessage((e,{req:r})=>createErrorObj(r,{error:ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT,params:{param:"public_key",value:e,message:"The public key is required."}})).bail(),body("description").optional({checkFalsy:!0,checkNull:!0}).trim(),body("role").optional({checkFalsy:!0,checkNull:!0}).trim(),body("balance").customSanitizer(()=>0),body("lastest_transactions").customSanitizer(()=>[]),body("pending_transactions").customSanitizer(()=>[])]),validateUserReturnTo=(e,r,a)=>{if(e.body.return_to){const o=[];if("object"!=typeof e.body.return_to)return createError(e,r,{error:ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,params:{value:e.body.return_to,param:"return_to",expectedType:"object",receivedType:typeof e.body.return_to}});for(const s in e.body.return_to)if(Object.hasOwnProperty.call(e.body.return_to,s)){var t=e.body.return_to[s];if("string"!=typeof t)return createError(e,r,{error:ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,params:{value:e.body.return_to,propertyName:"return_to",param:"return_to",expectedType:"string",receivedType:typeof t}});o.push(validateAssetExistence(TYPE.USER,t,!0,e,r,{location:"body",param:"return_to"}))}return Promise.all(o).then(()=>a()).catch(e=>{e()})}return a()},validateUserPermissions=(e,r,a)=>{var t=e.body.permissions;if(t&&"object"==typeof t){for(const i in t)if(Object.hasOwnProperty.call(t,i)){var o=t[i];if("object"==typeof o&&"coinbase"!==i){for(const n in o)if(Object.hasOwnProperty.call(o,n)){var s=o[n];if("boolean"!=typeof s)return createError(e,r,{error:ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,params:{expectedType:"boolean",receivedType:typeof s,propertyName:"permissions",param:"permissions",value:e.body.permissions}})}}else if("boolean"!=typeof o)return createError(e,r,{error:ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,params:{expectedType:"boolean",receivedType:typeof o,propertyName:"permissions",param:"permissions",value:e.body.permissions}})}}else if(t&&"object"!=typeof t)return createError(e,r,{error:ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,params:{expectedType:"object",receivedType:typeof t,propertyName:"permissions",param:"permissions",value:e.body.permissions}});return a()},validateDeleteReason=(a,t,o)=>{const s=a.body.reason;return s&&"string"==typeof s?findByAddress(TYPE.USER,a.params.address,!1,!1,t).then(r=>_.isEmpty(r.return_to)?createError(a,t,{error:ERRORS.USER.LOGIC.NO_RETURN_TO_ADDRESSES,params:{address:a.params.address,param:"reason",value:s}}):r.return_to[s]?findByAddress(TYPE.USER,r.return_to[s],!1,!1,t).then(e=>e?!0!==e.active?createError(a,t,{error:ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE,params:{address:r.return_to[s],param:"reason",value:r.return_to[s]}}):o():createError(a,t,{error:ERRORS.USER.INPUT.USER_DOES_NOT_EXIST,params:{address:r.return_to[s],param:"reason",value:r.return_to[s]}})):createError(a,t,{error:ERRORS.USER.INPUT.UNDEFINED_RETURN_TO_REASON,params:{address:a.params.address,param:"reason",value:s,reason:s}})):s&&"string"!=typeof s?createError(a,t,{error:ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE,params:{expectedType:"string",receivedType:typeof s,propertyName:"reason",param:"reason",value:a.body.reason}}):createError(a,t,{error:ERRORS.USER.INPUT.NO_INPUT,params:{property:"reason",param:"reason",value:a.body.reason},location:"body"})},validateUserCreation=[inputValidation,validateUserPermissions,validateUserReturnTo,(e,r,a)=>validateExistingUser(e,r,a,e.body.address,!1,{location:"body"})],validateUserRetrieval=[(e,r,a)=>validateExistingUser(e,r,a,e.params.address,!0,{location:"params"})],validateUserUpdate=[(e,r,a)=>validateExistingUser(e,r,a,e.params.address,!0,{location:"params"}),validateUserPermissions,validateUserReturnTo],validateUserDelete=[(e,r,a)=>validateExistingUser(e,r,a,e.params.address,!0,{location:"params"}),validateDeleteReason];module.exports.validateUserCreation=validateUserCreation,module.exports.validateUserRetrieval=validateUserRetrieval,module.exports.validateUserUpdate=validateUserUpdate,module.exports.validateUserDelete=validateUserDelete;