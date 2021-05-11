/*! cryptocurrency 2021-05-11 */
const crypto=require("crypto"),{InvalidTransaction}=require("sawtooth-sdk/processor/exceptions"),{TYPE}=require("./utils/constants"),{logFormatted,SEVERITY}=require("./utils/logger"),TP_FAMILY="cnk-cryptocurrency",TP_VERSION="1.0",hash512=t=>crypto.createHash("sha512").update(t).digest("hex"),getAddress=(t,e=64)=>hash512(t).slice(0,e),TRANSACTION_FAMILY="cnk-cryptocurrency",TP_NAMESPACE=getAddress(TRANSACTION_FAMILY,6),getTransactionAddress=t=>`${TP_NAMESPACE}00${getAddress(t,62)}`,getUserAddress=t=>`${TP_NAMESPACE}01${getAddress(t,62)}`,getTransferAddress=t=>`${TP_NAMESPACE}02${getAddress(t,62)}`,addressIntKey=(t,e)=>{switch(e){case"TRANSACTION":return getTransactionAddress(t);case"USER":return getUserAddress(t);case"TRANSFER":return getTransferAddress(t);default:return""}};addressIntKey.keysCanCollide=!0;const getContext=([t,e,s],r)=>{let a;try{a=JSON.parse(r)}catch(t){throw logFormatted(`Error at getContext - ${t}`,SEVERITY.ERROR,a),new InvalidTransaction("Transaction was not JSON parsable")}var{type:r}=a;switch(logFormatted(`Handling transaction with type ${r}`,SEVERITY.WARN,a),r){case TYPE.TRANSACTION:return t;case TYPE.USER:return e;case TYPE.TRANSFER:return s;default:throw logFormatted("Error at getContext - Transaction type was not defined",SEVERITY.ERROR,a),new InvalidTransaction("Transaction type was not defined")}},handlers={async delete([t,e,s],{transaction:r,txid:a}){logFormatted("Handling delete transaction",SEVERITY.NOTIFY,{transaction:r,txid:a});const n=getContext([t,e,s],r);var{output:r}=JSON.parse(r);await n.putState(a,r)},async post([t,e,s],{transaction:r,txid:a}){logFormatted("Handling post transaction",SEVERITY.NOTIFY,{transaction:r,txid:a});const n=getContext([t,e,s],r),{type:d,...o}=JSON.parse(r);await n.putState(a,o),logFormatted(`Added state ${a} -> ${getUserAddress(a)} ->`,SEVERITY.SUCCESS,o)},async put([t,e,s],{transaction:r,txid:a}){logFormatted("Handling put transaction",SEVERITY.NOTIFY,{transaction:r,txid:a});const n=getContext([t,e,s],r),{type:d,...o}=JSON.parse(r);await n.putState(a,o),logFormatted(`Updated state ${a} -> ${getUserAddress(a)} ->`,SEVERITY.SUCCESS,o)}};module.exports={TP_FAMILY:TP_FAMILY,TP_VERSION:TP_VERSION,TP_NAMESPACE:TP_NAMESPACE,handlers:handlers,addresses:{getTransactionAddress:getTransactionAddress,getUserAddress:getUserAddress,getTransferAddress:getTransferAddress}};