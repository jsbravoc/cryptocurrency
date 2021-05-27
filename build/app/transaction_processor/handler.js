const crypto=require("crypto"),{InvalidTransaction}=require("sawtooth-sdk/processor/exceptions"),{TYPE}=require("./utils/constants"),{logFormatted,SEVERITY}=require("./utils/logger"),TP_FAMILY="cnk-cryptocurrency",TP_VERSION="1.0",hash512=t=>crypto.createHash("sha512").update(t).digest("hex"),getAddress=(t,e=64)=>hash512(t).slice(0,e),TRANSACTION_FAMILY="cnk-cryptocurrency",TP_NAMESPACE=getAddress(TRANSACTION_FAMILY,6),getTransactionAddress=t=>`${TP_NAMESPACE}00${getAddress(t,62)}`,getUserAddress=t=>`${TP_NAMESPACE}01${getAddress(t,62)}`,addressIntKey=(t,e)=>{switch(e){case"TRANSACTION":return getTransactionAddress(t);case"USER":return getUserAddress(t)}};addressIntKey.keysCanCollide=!0;const getContext=([t,e],s)=>{let a;try{a=JSON.parse(s)}catch(t){throw logFormatted(`Error at getContext - ${t}`,SEVERITY.ERROR,a),new InvalidTransaction("Transaction was not JSON parsable")}var{type:s}=a;switch(logFormatted(`Handling transaction with type ${s}`,SEVERITY.WARN,a),s){case TYPE.TRANSACTION:return t;case TYPE.USER:return e;default:throw logFormatted("Error at getContext - Transaction type was not defined",SEVERITY.ERROR,a),new InvalidTransaction("Transaction type was not defined")}},handlers={async delete([t,e],{transaction:s,txid:a}){logFormatted("Handling delete transaction",SEVERITY.NOTIFY,{transaction:s,txid:a});const r=getContext([t,e],s);var{output:s}=JSON.parse(s);await r.putState(a,s)},async post([t,e],{transaction:s,txid:a}){logFormatted("Handling post transaction",SEVERITY.NOTIFY,{transaction:s,txid:a});const r=getContext([t,e],s),{type:n,...d}=JSON.parse(s);await r.putState(a,d),logFormatted(`Added state ${a} -> ${getUserAddress(a)} ->`,SEVERITY.SUCCESS,d)},async put([t,e],{transaction:s,txid:a}){logFormatted("Handling put transaction",SEVERITY.NOTIFY,{transaction:s,txid:a});const r=getContext([t,e],s),{type:n,...d}=JSON.parse(s);await r.putState(a,d),logFormatted(`Updated state ${a} -> ${getUserAddress(a)} ->`,SEVERITY.SUCCESS,d)}};module.exports={TP_FAMILY:TP_FAMILY,TP_VERSION:TP_VERSION,TP_NAMESPACE:TP_NAMESPACE,handlers:handlers,addresses:{getTransactionAddress:getTransactionAddress,getUserAddress:getUserAddress}};