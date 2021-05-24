/*! cryptocurrency 2021-05-23 */
const{SEVERITY,logFormatted}=require("../utils/logger"),Transaction=require("../models/Transaction"),User=require("../models/User"),{MAXIMUM_FLOAT_PRECISION,TYPE,USER_TYPE,HTTP_METHODS}=require("../utils/constants"),{findAllAssets,findByAddress,getTransactionAddress,getUserAddress,hash512,_putAsset,putBatch}=require("./common"),findTransaction=(t,n=!1,e=!0,r=null)=>findByAddress(TYPE.TRANSACTION,t,n,e,r),_updateTransaction=t=>_putAsset(TYPE.TRANSACTION,HTTP_METHODS.PUT,"PUT [LOCAL] /cryptocurrency",t),getSupportingTransactions=(t,e=null)=>{const{amount:i,recipient:n,sender:r}=t;let s=[];return s.push(findByAddress(TYPE.USER,n,!1,!1,e)),r&&s.push(findByAddress(TYPE.USER,r,!1,!1,e)),Promise.all(s).then(([t,a])=>{if(r){let r=i,s=[];const n=[];return(a.latest_transactions||[]).forEach(t=>n.push(findTransaction(t,!1,!0,e))),Promise.all(n).then(n=>{for(let t=0;t<n.length&&0<r;t+=1){var e=n[t];r-=Number(e.amount),s.push(e)}return r=Number(r.toFixed(MAXIMUM_FLOAT_PRECISION)),{existingSender:a,existingRecipient:t,pendingAmount:r,usedTransactions:s}})}return{pendingAmount:null,usedTransactions:null,existingRecipient:t,existingSender:null}})},expandSupportingTransactions=async(n,e,r=null)=>{if(!e){e={};const t=await findAllAssets(TYPE.TRANSACTION,"GET /cryptocurrency");t.forEach(t=>{e[t.signature]=t})}if(n)if(Array.isArray(n.supporting_transactions))for(let t=0;t<n.supporting_transactions.length;t+=1){var s=n.supporting_transactions[t],s="object"==typeof s?s:e[s]||await findTransaction(s,!1,!0,r);s&&Array.isArray(s.supporting_transactions)&&"string"==typeof s.supporting_transactions[0]?n.supporting_transactions[t]=await expandSupportingTransactions(s,e,r):n.supporting_transactions[t]=s}else if("string"==typeof n)return n=await findTransaction(n),await expandSupportingTransactions(n,e,r),n;return n},getTransactions=(n,r)=>{const s="true"===n.query.expanded||!1,a="true"===n.query.hidePending||!1,i="true"===n.query.hideInvalid||!1;var t=Number.isNaN(Number(n.query.limit))?0:Number(n.query.limit);return findAllAssets(TYPE.TRANSACTION,"GET /cryptocurrency",t,!1,!0,r).then(t=>{if(t=t.sort((t,n)=>new Date(t.creationDate)-new Date(n.creationDate)),a&&(t=t.filter(t=>!t.pending)),i&&(t=t.filter(t=>t.valid)),!s)return r.json(t.map(t=>t.toObject()));const n={};t.forEach(t=>{n[t.signature]=t});const e=[];t.forEach(t=>e.push(expandSupportingTransactions(t,n,r))),Promise.all(e).then(()=>r.status(200).json(t.map(t=>t.toObject())))}).catch(t=>r.status(503).json({msg:n.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),error:{...t}}))},getTransactionByAddress=(n,e)=>findTransaction(n.params.address,!1,!0,e).then(t=>{return"true"!==n.query.expanded?e.status(200).json(t):expandSupportingTransactions(t,void 0,e).then(()=>e.status(200).json(t))}).catch(t=>e.status(503).json({msg:n.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),error:t.message})),createTransaction=(t,n,{disableSender:e=!1,disableRecipient:r=!1}=null)=>{const s=new Transaction(t.body);var{sender:a,recipient:i,amount:o,valid:u}=s,{signature:d}=s,d=hash512(`${d}${(s.creationDate||new Date).getTime()}`);return s.signature=d,createTransactionPayload(s,o,d,a,i,u,HTTP_METHODS.POST,{disableSender:e||!1,disableRecipient:r||!1},t,n)},updateTransaction=(i,o)=>{let u;return i.query.approve&&(u="true"===i.query.approve||!1),findTransaction(i.params.address,!1,!1,o).then(n=>{if(i.body.description&&(n.description=i.body.description),void 0===u)return _updateTransaction(n).then(({responseCode:t})=>(delete n.type,o.status(t).json({msg:i.t("MESSAGES.SUCCESSFUL_REQUEST.TRANSACTION.UPDATE"),payload:n}))).catch(t=>(logFormatted(`PUT /cryptocurrency | BATCH Response: ${t}`,SEVERITY.ERROR),o.status(500).json({err:t})));n.valid=u,n.pending=!1;var{sender:t,recipient:e,amount:r,signature:s,valid:a}=n;return createTransactionPayload(n,r,s,t,e,a,HTTP_METHODS.PUT,{disableSender:!1,disableRecipient:!1},i,o)})},createTransactionPayload=(d,c,T,p,g,S,l="POST",t={disableRecipient:!1,disableSender:!1},E,A)=>{const{disableRecipient:y,disableSender:f}=t;let m,P;return getSupportingTransactions(d,A).then(({pendingAmount:t,usedTransactions:r,existingRecipient:n,existingSender:s})=>{let e=new User(n);y&&(e.active=!1),l===HTTP_METHODS.PUT&&e.removePendingTransaction(T);const a=[];S&&(r||[]).forEach(t=>{d.addSupportingTransaction(t.signature),a.push(getTransactionAddress(t.signature))}),e.addTransaction(USER_TYPE.RECIPIENT,c,T,S),e=e.toString(!1,!1);n=getUserAddress(g),n={inputs:[n],outputs:[n],payload:JSON.stringify({func:"post",args:{transaction:e,txid:g}})};if(s){let e=new User(s);if(f&&(e.active=!1),l===HTTP_METHODS.PUT&&e.removePendingTransaction(T),S){Array.isArray(r)&&r.forEach(t=>e.addTransaction(USER_TYPE.SENDER,t.amount,t.signature,S));s=-t;if(0<s){var i=E.t("MESSAGES.CHANGE_TRANSACTION_DESCRIPTION",{signature:d.signature,input:-t+c,amount:c,change:s}),o=hash512(`changeof:${d.signature}`);let n=new Transaction({amount:s,recipient:p,description:i,signature:o});Array.isArray(r)&&r.forEach(t=>n.addSupportingTransaction(t.signature)),e.addTransaction(USER_TYPE.RECIPIENT,n.amount,n.signature),n=n.toString(!1,!1);i=getTransactionAddress(o),o=JSON.stringify({func:"post",args:{transaction:n,txid:o}});m={inputs:[i,...a],outputs:[i],payload:o}}}else l===HTTP_METHODS.POST&&e.addTransaction(USER_TYPE.RECIPIENT,c,T,S);e=e.toString(!1,!1);i=getUserAddress(p),o=JSON.stringify({func:"post",args:{transaction:e,txid:p}});P={inputs:[i],outputs:[i],payload:o}}i=getTransactionAddress(d.signature),o=JSON.stringify({func:"post",args:{transaction:d.toString(!1,!1),txid:d.signature}});const u=[{...{inputs:[i,...a],outputs:[i],payload:o}}];return u.push({...n}),P&&u.push({...P}),m&&u.push({...m}),putBatch(l,`${l} /cryptocurrency`,u).then(({responseCode:t})=>(delete d.type,A.status(t).json({msg:l===HTTP_METHODS.POST?E.t("MESSAGES.SUCCESSFUL_REQUEST.TRANSACTION.CREATION"):E.t("MESSAGES.SUCCESSFUL_REQUEST.TRANSACTION.UPDATE"),payload:d}))).catch(t=>(logFormatted(`${l} /cryptocurrency | BATCH Response: ${t}`,SEVERITY.ERROR),A.status(500).json({err:t})))})};module.exports.findTransaction=findTransaction,module.exports.getSupportingTransactions=getSupportingTransactions,module.exports.expandSupportingTransactions=expandSupportingTransactions,module.exports.getTransactions=getTransactions,module.exports.getTransactionByAddress=getTransactionByAddress,module.exports.createTransaction=createTransaction,module.exports.updateTransaction=updateTransaction;