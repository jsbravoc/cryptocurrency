/*! cryptocurrency 2021-05-19 */
const _=require("lodash"),crypto=require("crypto"),{default:axios}=require("axios"),{ADDRESS_PREFIX,HTTP_METHODS,TYPE,TRANSACTION_FAMILY,LOCAL_ADDRESS}=require("../utils/constants"),{SEVERITY,logFormatted}=require("../utils/logger"),{queryState,sendTransaction}=require("../sawtooth/sawtooth-helpers"),Transaction=require("../models/Transaction"),User=require("../models/User"),Asset=require("../models/Asset"),hash512=s=>crypto.createHash("sha512").update(s).digest("hex"),getAddress=(s,e=64)=>hash512(s).slice(0,e),PREFIX=getAddress(TRANSACTION_FAMILY,6),getTransactionAddress=s=>PREFIX+ADDRESS_PREFIX.TRANSACTION+getAddress(s,62),getUserAddress=s=>PREFIX+ADDRESS_PREFIX.USER+getAddress(s,62),findByAddress=(e,s,t=!1,a=!1,r=null)=>{let o;switch(e){case TYPE.TRANSACTION:if(r&&r.locals&&r.locals.transaction&&r.locals.transaction[s])return Promise.resolve(new Transaction(r.locals.transaction[s]).toObject(t,a));o=getTransactionAddress(s);break;case TYPE.USER:if(r&&r.locals&&r.locals.user&&r.locals.user[s])return Promise.resolve(new User(r.locals.user[s]).toObject(t,a));o=getUserAddress(s)}return queryState(o).then(s=>{if(!s)return null;switch(e){case TYPE.TRANSACTION:r&&r.locals&&(r.locals.transaction||(r.locals.transaction={}),r.locals.transaction[s.signature]=new Transaction(s)),s=new Transaction(s).toObject(t,a);break;case TYPE.USER:r&&r.locals&&(r.locals.user||(r.locals.user={}),r.locals.user[s.address]=new User(s)),s=new User(s).toObject(t,a)}return s})},findAllAssets=(t,e,s=0,a=!1,r=!1,o=null)=>{let n,l;switch(t){case TYPE.TRANSACTION:n="transaction",l=ADDRESS_PREFIX.TRANSACTION;break;case TYPE.USER:n="user",l=ADDRESS_PREFIX.USER}return axios.get(`${process.env.SAWTOOTH_REST||`http://${LOCAL_ADDRESS}:8008`}/state?address=${PREFIX+l}${0!==s?`&limit=${s}`:""}`,{headers:{"Content-Type":"application/json"}}).then(s=>{s=_.chain(s.data.data).filter(s=>!_.isEmpty(JSON.parse(Buffer.from(s.data,"base64")))).map(s=>{var e=JSON.parse(Buffer.from(s.data,"base64"));switch(t){case TYPE.TRANSACTION:return o&&(o.locals.transaction||(o.locals.transaction={}),o.locals.transaction[e.address]=new Transaction(e)),new Transaction(e).toObject(a,r);case TYPE.USER:return o&&(o.locals.user||(o.locals.user={}),o.locals.user[e.address]=new User(e)),new User(e).toObject(a,r)}}).flatten().value();return logFormatted(`${e} | Querying all ${n}s - ${s.length} ${n}${1!==s.length?"s":""} found`,0===s.length?SEVERITY.ERROR:SEVERITY.SUCCESS),s})},buildBatch=({inputs:s,outputs:e,payload:t},...a)=>{let r=[new Asset({inputs:s,outputs:e,payload:t})];return(a||[]).forEach(s=>r.push(buildBatch(s))),[].concat.apply([],r)},_putAsset=(s,a,r,e)=>{let o,t,n,l;switch(s){case TYPE.TRANSACTION:l="Transaction",t=e.signature,o=e.toString(!1,!1),n=getTransactionAddress(t);break;case TYPE.USER:l="User",t=e.address,o=e.toString(!0,!1),n=getUserAddress(t)}s=JSON.stringify({func:a.toLowerCase(),args:{transaction:o,txid:t}}),s=buildBatch({payload:s,inputs:[n],outputs:[n]});return logFormatted(`${r} | BATCH Request:`,SEVERITY.NOTIFY,...s),sendTransaction(s).then(s=>{logFormatted(`${r}  | BATCH Response: ${s.status} - ${s.statusText}`,SEVERITY.SUCCESS);var e=a===HTTP_METHODS.POST?201:200,s=`${l} ${a===HTTP_METHODS.POST?"created":"updated"}`;const t=JSON.parse(o);return delete t.type,{responseCode:e,msg:s,payload:t}})},buildAssetTransaction=(s,e,t)=>{let a,r,o;switch(s){case TYPE.TRANSACTION:r=t.signature,a=t.toString(!1,!1),o=getTransactionAddress(r);break;case TYPE.USER:r=t.address,a=t.toString(!0,!1),o=getUserAddress(r)}e=JSON.stringify({func:e.toLowerCase(),args:{transaction:a,txid:r}});return new Asset({payload:e,inputs:[o],outputs:[o]})},putBatch=(a,r,o)=>{const n=buildBatch(...o);return logFormatted(`${r} | BATCH Request:`,SEVERITY.NOTIFY,...n),sendTransaction(n).then(s=>{logFormatted(`${r} | BATCH Response: ${s.status} - ${s.statusText}`,SEVERITY.SUCCESS);var e=a===HTTP_METHODS.POST?201:200,s=`Batch of ${o.length} transaction${1<o.length?"s":""} ${a===HTTP_METHODS.POST?"created":"updated"}`;const t=[];return n.forEach(s=>{const e=JSON.parse(s.payload);delete e.type,t.push(e)}),{responseCode:e,msg:s,payload:t}})},putAsset=(s,e,t,a,r)=>{let o;return s===TYPE.USER&&(o=new User(a.body)),_putAsset(s,e,t,o).then(({responseCode:s,msg:e,payload:t})=>r.status(s).json({msg:e,payload:t})).catch(s=>(logFormatted(`${t} | BATCH Response: ${s}`,SEVERITY.ERROR),r.status(500).json({err:s})))};module.exports.hash512=hash512,module.exports.getTransactionAddress=getTransactionAddress,module.exports.getUserAddress=getUserAddress,module.exports.findByAddress=findByAddress,module.exports.findAllAssets=findAllAssets,module.exports._putAsset=_putAsset,module.exports.buildAssetTransaction=buildAssetTransaction,module.exports.putBatch=putBatch,module.exports.putAsset=putAsset;