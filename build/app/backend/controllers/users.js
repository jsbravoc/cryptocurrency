const{SEVERITY,logFormatted}=require("../utils/logger"),{HTTP_METHODS,TYPE}=require("../utils/constants"),{findAllAssets,findByAddress,putAsset,_putAsset,hash512}=require("./common"),{expandSupportingTransactions,findTransaction,createTransaction}=require("./cryptocurrency"),Transaction=require("../models/Transaction"),{ERRORS}=require("../utils/errors"),findUser=(e,s=!0,r=!0,t=null)=>findByAddress(TYPE.USER,e,s,r,t),_updateUser=(e,t,s="[LOCAL USER UPDATE]")=>_putAsset(TYPE.USER,HTTP_METHODS.PUT,s,e).then(({responseCode:e,msg:s,payload:r})=>t.status(e).json({msg:s,payload:r})),getUsers=(e,n)=>{var s=Number.isNaN(Number(e.query.limit))?0:Number(e.query.limit);const a="true"===e.query.hidePublicKey||!1,r=[findAllAssets(TYPE.USER,"GET /users",s,!0,!0,n)],i="true"===e.query.expanded||!1;return i&&r.push(findAllAssets(TYPE.TRANSACTION,"GET /users",s,!1,!0,n)),Promise.all(r).then(([e,s])=>{if(!i)return a&&e.forEach(e=>delete e.public_key),n.status(200).json(e);const r={};(s||[]).forEach(e=>{r[e.signature]=e});let t=[];return(e||[]).forEach(e=>{t.push((e.latest_transactions||[]).map(e=>findTransaction(e).then(e=>expandSupportingTransactions(e,r)))),t.push((e.pending_transactions||[]).map(e=>findTransaction(e).then(e=>expandSupportingTransactions(e,r))))}),t=[].concat.apply([],t),{promises:t,userList:e}}).then(({promises:e,userList:s})=>{Array.isArray(e)&&Promise.all(e).then(e=>{(e||[]).forEach(t=>{s.forEach(e=>{var s=(e.latest_transactions||[]).indexOf(t.signature),r=(e.pending_transactions||[]).indexOf(t.signature);-1<s&&(e.latest_transactions[s]=t),-1<r&&(e.pending_transactions[r]=t)})});Promise.all([]).then(()=>(a&&s.forEach(e=>delete e.public_key),n.status(200).json(s)))})}).catch(()=>n.status(ERRORS.SAWTOOTH.UNAVAILABLE.errorCode).json({msg:e.t("MESSAGES.SAWTOOTH_UNAVAILABLE"),error:e.t("MESSAGES.SAWTOOTH_UNAVAILABLE")}))},getUserByAddress=(e,n)=>{const s="true"===e.query.expanded||!1,r="true"===e.query.hidePublicKey||!1;return findUser(e.params.address,!0,!0,n).then(t=>(r&&delete t.public_key,s?findAllAssets(TYPE.TRANSACTION,"GET /users",0,!1,!0,n).then(e=>{let s=[];const r={};return(e||[]).forEach(e=>{r[e.signature]=e}),s.push((t.latest_transactions||[]).map(e=>findTransaction(e).then(e=>expandSupportingTransactions(e,r)))),s.push((t.pending_transactions||[]).map(e=>findTransaction(e).then(e=>expandSupportingTransactions(e,r)))),s=[].concat.apply([],s),Promise.all(s).then(e=>(e.forEach(e=>{var s=(t.latest_transactions||[]).indexOf(e.signature),r=(t.pending_transactions||[]).indexOf(e.signature);-1<s&&(t.latest_transactions[s]=e),-1<r&&(t.pending_transactions[r]=e)}),n.status(200).json(t)))}):n.status(200).json(t)))},createUser=(e,s)=>putAsset(TYPE.USER,HTTP_METHODS.POST,"POST /users",e,s),updateUser=(i,o)=>findUser(i.params.address,!0,!0,o).then(e=>{var{role:s,description:r,permissions:t,return_to:n,active:a}=i.body;return void 0!==s&&(e.role=s),void 0!==r&&(e.description=r),void 0!==t&&(e.permissions=t),void 0!==n&&(e.return_to=n),void 0!==a&&(e.active=a),_updateUser(e,o,"PUT /users")}),deleteUser=(n,a)=>{const i=n.body.reason;return findUser(n.params.address,!0,!0,a).then(r=>{const t=r.return_to[i],s=[];return(r.latest_transactions||[]).forEach(e=>{s.push(findTransaction(e))}),Promise.all(s).then(e=>{let s=0;(e||[]).forEach(e=>{s+=e.amount});e=new Transaction({amount:s,recipient:t,sender:n.params.address,description:`Resulting transaction of user's return_to ${i}`,signature:hash512(`${r.public_key},${s},${i},${t},${(new Date).toISOString()}`)});return n.body=e,r.active=!1,createTransaction(n,a,{disableSender:!0})})})};module.exports.findUser=findUser,module.exports.getUsers=getUsers,module.exports.getUserByAddress=getUserByAddress,module.exports.createUser=createUser,module.exports.updateUser=updateUser,module.exports.deleteUser=deleteUser;