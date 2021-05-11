/*! cryptocurrency 2021-05-10 */
const mongo=require("../database/utils/mongo"),{SEVERITY,logFormatted}=require("../utils/logger"),Transaction=require("../models/Transaction"),User=require("../models/User"),{MAXIMUM_FLOAT_PRECISION,TYPE,USER_TYPE,HTTP_METHODS}=require("../utils/constants"),{findAllAssets,findByAddress,getTransactionAddress,getUserAddress,hash512,_putAsset,putBatch}=require("./common"),findTransaction=(t,n=!1,r=!0,s=null)=>findByAddress(TYPE.TRANSACTION,t,n,r,s),_updateTransaction=t=>_putAsset(TYPE.TRANSACTION,HTTP_METHODS.PUT,"PUT [LOCAL] /cryptocurrency",t),getSupportingTransactions=(t,r=null)=>{const{amount:i,recipient:n,sender:s}=t;let a=[];return a.push(findByAddress(TYPE.USER,n,!1,!1,r)),s&&a.push(findByAddress(TYPE.USER,s,!1,!1,r)),Promise.all(a).then(([t,e])=>{if(s){let s=i,a=[];const n=[];return(e.lastest_transactions||[]).forEach(t=>n.push(findTransaction(t,!1,!0,r))),Promise.all(n).then(n=>{for(let t=0;t<n.length&&0<s;t+=1){var r=n[t];s-=Number(r.amount),a.push(r)}return s=Number(s.toFixed(MAXIMUM_FLOAT_PRECISION)),{existingSender:e,existingRecipient:t,pendingAmount:s,usedTransactions:a}})}return{pendingAmount:null,usedTransactions:null,existingRecipient:t,existingSender:null}})},expandSupportingTransactions=async(n,r,s=null)=>{if(!r){r={};const t=await findAllAssets(TYPE.TRANSACTION,"GET /cryptocurrency");t.forEach(t=>{r[t.signature]=t})}if(n)if(Array.isArray(n.supporting_transactions))for(let t=0;t<n.supporting_transactions.length;t+=1){var a=n.supporting_transactions[t],a="object"==typeof a?a:r[a]||await findTransaction(a,!1,!0,s);a&&Array.isArray(a.supporting_transactions)&&"string"==typeof a.supporting_transactions[0]?n.supporting_transactions[t]=await expandSupportingTransactions(a,r,s):n.supporting_transactions[t]=a}else if("string"==typeof n)return n=await findTransaction(n),await expandSupportingTransactions(n,r,s),n;return n},getTransactions=(t,s)=>{const a="true"===t.query.expanded||!1,e="true"===t.query.hidePending||!1,i="true"===t.query.hideInvalid||!1;t=Number.isNaN(Number(t.query.limit))?0:Number(t.query.limit);return findAllAssets(TYPE.TRANSACTION,"GET /cryptocurrency",t,!1,!0).then(t=>{if(t=t.sort((t,n)=>new Date(t.creationDate)-new Date(n.creationDate)),e&&(t=t.filter(t=>!t.pending)),i&&(t=t.filter(t=>t.valid)),!a)return s.json(t.map(t=>t.toObject()));const n={};t.forEach(t=>{n[t.signature]=t});const r=[];t.forEach(t=>r.push(expandSupportingTransactions(t,n,s))),Promise.all(r).then(()=>s.status(200).json(t.map(t=>t.toObject())))}).catch(t=>s.status(503).json({msg:"Sawtooth service unavailable",error:{...t}}))},getTransactionByAddress=(n,r)=>findTransaction(n.params.address,!1,!0,r).then(t=>{return"true"!==n.query.expanded?r.status(200).json(t):expandSupportingTransactions(t,void 0,r).then(()=>r.status(200).json(t))}).catch(t=>r.status(503).json({msg:"Sawtooth service unavailable",error:{...t}})),createTransaction=(t,p,{disableSender:g=!1,disableRecipient:T=!1}=null)=>{const l=new Transaction(t.body),{sender:y,recipient:S,amount:E,valid:f}=l;let{signature:h}=l;h=hash512(`${h}${(l.creationDate||new Date).getTime()}`),l.signature=h;let A,m;return getSupportingTransactions(l,p).then(({pendingAmount:t,usedTransactions:s,existingRecipient:n,existingSender:a})=>{const e=[];f&&(s||[]).forEach(t=>{l.addSupportingTransaction(t.signature),e.push(getTransactionAddress(t.signature))});var r=getTransactionAddress(l.signature),i=JSON.stringify({func:"post",args:{transaction:l.toString(!1,!1),txid:l.signature}}),i={inputs:[r,...e],outputs:[r],payload:i};let o=new User(n);T&&(o.active=!1),o.addTransaction(USER_TYPE.RECIPIENT,E,h,f),o=o.toString(!1,!1);n=getUserAddress(S),n={inputs:[n],outputs:[n],payload:JSON.stringify({func:"post",args:{transaction:o,txid:S}})};if(a){let r=new User(a);if(g&&(r.active=!1),f){Array.isArray(s)&&s.forEach(t=>r.addTransaction(USER_TYPE.SENDER,t.amount,t.signature,f));t=-t;if(0<t){var u=`Resulting change of transaction ${l.signature}:\n Sender: ${y}\nRecipient: ${S}\nAmount: ${E}\nChange: ${t}`,c=hash512(`${u},${(new Date).toISOString()}`);let n=new Transaction({amount:t,recipient:y,description:u,signature:c});Array.isArray(s)&&s.forEach(t=>n.addSupportingTransaction(t.signature)),r.addTransaction(USER_TYPE.RECIPIENT,n.amount,n.signature),n=n.toString(!1,!1);u=getTransactionAddress(c),c=JSON.stringify({func:"post",args:{transaction:n,txid:c}});A={inputs:[u,...e],outputs:[u],payload:c}}}else r.addTransaction(USER_TYPE.RECIPIENT,E,h,f);r=r.toString(!1,!1);u=getUserAddress(y),c=JSON.stringify({func:"post",args:{transaction:r,txid:y}});m={inputs:[u],outputs:[u],payload:c}}const d=[{...i}];return d.push({...n}),m&&d.push({...m}),A&&d.push({...A}),putBatch(HTTP_METHODS.POST,"POST /cryptocurrency",d).then(({responseCode:t})=>(delete l.type,p.status(t).json({msg:"Transaction created",payload:l}))).catch(t=>(logFormatted(`POST /cryptocurrency | BATCH Response: ${t}`,SEVERITY.ERROR),p.status(500).json({err:t})))})},updateTransaction=(t,h)=>{let n;return t.query.approve&&(n="true"===t.query.approve||!1),findTransaction(t.params.address,!1,!1,h).then(d=>{if(t.body.description&&(d.description=t.body.description),void 0===n)return _updateTransaction(d).then(({responseCode:t})=>(delete d.type,h.status(t).json({msg:"Transaction updated",payload:d}))).catch(t=>(logFormatted(`POST /cryptocurrency | BATCH Response: ${t}`,SEVERITY.ERROR),h.status(500).json({err:t})));n?d.valid=!0:d.valid=!1,d.pending=!1;const{sender:p,recipient:g,amount:T,signature:l,valid:y}=d,S=[];let E,f;return getSupportingTransactions(d,h).then(({pendingAmount:t,usedTransactions:r,existingRecipient:n,existingSender:s})=>{let a=new User(n);a.removePendingTransaction(l);let e;if(s&&(e=new User(s),e.removePendingTransaction(l)),d.valid&&(Array.isArray(r)&&r.forEach(t=>{d.addSupportingTransaction(t.signature),S.push(getTransactionAddress(t.signature))}),a.addTransaction(USER_TYPE.RECIPIENT,T,l,y),e)){Array.isArray(r)&&r.forEach(t=>e.addTransaction(USER_TYPE.SENDER,t.amount,t.signature,y));s=-t;if(0<s){var t=`Resulting change of transaction ${d.signature}:\n Sender: ${p}\nRecipient: ${g}\nAmount: ${T}\nChange: ${s}`,i=hash512(`changeDescription, ${(new Date).toISOString()}`);let n=new Transaction({amount:s,recipient:p,description:t,signature:i});Array.isArray(r)&&r.forEach(t=>n.addSupportingTransaction(t.signature)),e.addTransaction(USER_TYPE.RECIPIENT,n.amount,n.signature),n=n.toString(!1,!1);var r=getTransactionAddress(i),i=JSON.stringify({func:"post",args:{transaction:n,txid:i}});E={inputs:[r,...S],outputs:[r],payload:i}}}a=a.toString(!1,!1);i=getUserAddress(g),i={inputs:[i],outputs:[i],payload:JSON.stringify({func:"post",args:{transaction:a,txid:g}})};e&&(e=e.toString(!1,!1),o=getUserAddress(p),u=JSON.stringify({func:"post",args:{transaction:e,txid:p}}),f={inputs:[o],outputs:[o],payload:u});var o=getTransactionAddress(d.signature),u=JSON.stringify({func:"post",args:{transaction:d.toString(!1,!1),txid:d.signature}});const c=[{...{inputs:[o,...S],outputs:[o],payload:u}}];return c.push({...i}),f&&c.push({...f}),E&&c.push({...E}),putBatch(HTTP_METHODS.PUT,"PUT /cryptocurrency",c).then(({responseCode:t})=>(delete d.type,h.status(t).json({msg:"Transaction updated",payload:d}))).catch(t=>(logFormatted(`POST /cryptocurrency | BATCH Response: ${t}`,SEVERITY.ERROR),h.status(500).json({err:t})))})})},getTransactionHistory=async(t,n)=>{var r=t.query.page||0;const s=await mongo.getClient(),a=s.db("mydb").collection("cnk-cryptocurrency_users"),e=[],i=await a.find({root:t.root}).sort({block_num:-1}).skip(2*r).limit(2);return await new Promise(t=>{i.forEach(t=>{e.push(t)},t)}),n.json(e)};module.exports.findTransaction=findTransaction,module.exports.getSupportingTransactions=getSupportingTransactions,module.exports.expandSupportingTransactions=expandSupportingTransactions,module.exports.getTransactions=getTransactions,module.exports.getTransactionByAddress=getTransactionByAddress,module.exports.createTransaction=createTransaction,module.exports.updateTransaction=updateTransaction,module.exports.getTransactionHistory=getTransactionHistory;