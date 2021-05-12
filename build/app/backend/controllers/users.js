/*! cryptocurrency 2021-05-12 */
const{SEVERITY,logFormatted}=require("../utils/logger"),{HTTP_METHODS,TYPE}=require("../utils/constants"),{findAllAssets,findByAddress,putAsset,_putAsset,hash512}=require("./common"),{expandSupportingTransactions,findTransaction,createTransaction}=require("./cryptocurrency"),Transaction=require("../models/Transaction"),findUser=(s,e=!0,t=!0,r=null)=>findByAddress(TYPE.USER,s,e,t,r),_updateUser=(s,r,e="[LOCAL USER UPDATE]")=>_putAsset(TYPE.USER,HTTP_METHODS.PUT,e,s).then(({responseCode:s,msg:e,payload:t})=>r.status(s).json({msg:e,payload:t})).catch(s=>(logFormatted("Error in local _updateUser",SEVERITY.ERROR,s),r.status(500).json({err:s}))),getUsers=(s,n)=>{var e=Number.isNaN(Number(s.query.limit))?0:Number(s.query.limit);const t=[findAllAssets(TYPE.USER,"GET /users",e,!0,!0,n)],a="true"===s.query.expanded||!1;return a&&t.push(findAllAssets(TYPE.TRANSACTION,"GET /users",e,!1,!0,n)),Promise.all(t).then(([s,e])=>{if(!a)return n.status(200).json(s);const t={};(e||[]).forEach(s=>{t[s.signature]=s});let r=[];return(s||[]).forEach(s=>{r.push((s.lastest_transactions||[]).map(s=>findTransaction(s).then(s=>expandSupportingTransactions(s,t)))),r.push((s.pending_transactions||[]).map(s=>findTransaction(s).then(s=>expandSupportingTransactions(s,t))))}),r=[].concat.apply([],r),{promises:r,userList:s}}).then(({promises:s,userList:e})=>{Array.isArray(s)&&Promise.all(s).then(s=>{(s||[]).forEach(r=>{e.forEach(s=>{var e=(s.lastest_transactions||[]).indexOf(r.signature),t=(s.pending_transactions||[]).indexOf(r.signature);-1<e&&(s.lastest_transactions[e]=r),-1<t&&(s.pending_transactions[t]=r)})});Promise.all([]).then(()=>n.status(200).json(e))})}).catch(s=>n.status(503).json({msg:"Sawtooth service unavailable",error:{...s}}))},getUserByAddress=(s,n)=>findUser(s.params.address,!0,!0,n).then(r=>{return"true"!==s.query.expanded?n.status(200).json(r):findAllAssets(TYPE.TRANSACTION,"GET /users",0,!1,!0,n).then(s=>{let e=[];const t={};return(s||[]).forEach(s=>{t[s.signature]=s}),e.push((r.lastest_transactions||[]).map(s=>findTransaction(s).then(s=>expandSupportingTransactions(s,t)))),e.push((r.pending_transactions||[]).map(s=>findTransaction(s).then(s=>expandSupportingTransactions(s,t)))),e=[].concat.apply([],e),Promise.all(e).then(s=>(s.forEach(s=>{var e=(r.lastest_transactions||[]).indexOf(s.signature),t=(r.pending_transactions||[]).indexOf(s.signature);-1<e&&(r.lastest_transactions[e]=s),-1<t&&(r.pending_transactions[t]=s)}),n.status(200).json(r)))})}).catch(s=>n.status(503).json({msg:"Sawtooth service unavailable",error:{...s}})),createUser=(s,e)=>putAsset(TYPE.USER,HTTP_METHODS.POST,"POST /users",s,e),updateUser=(a,o)=>findUser(a.params.address,!0,!0,o).then(s=>{var{role:e,description:t,permissions:r,return_to:n}=a.body;return e&&(s.role=e),t&&(s.description=t),r&&(s.permissions=r),n&&(s.return_to=n),_updateUser(s,o,"PUT /users")}),deleteUser=(n,a)=>{const o=n.body.reason;return findUser(n.params.address,!0,!0,a).then(t=>{const r=t.return_to[o],e=[];return(t.lastest_transactions||[]).forEach(s=>{e.push(findTransaction(s))}),Promise.all(e).then(s=>{let e=0;(s||[]).forEach(s=>{e+=s.amount});s=new Transaction({amount:e,recipient:r,sender:n.params.address,description:`Resulting transaction of user's return_to ${o}`,signature:hash512(`${t.public_key},${e},${o},${r},${(new Date).toISOString()}`)});return n.body=s,t.active=!1,createTransaction(n,a,{disableSender:!0})})})};module.exports.getUserHistory=async function(){},module.exports.findUser=findUser,module.exports.getUsers=getUsers,module.exports.getUserByAddress=getUserByAddress,module.exports.createUser=createUser,module.exports.updateUser=updateUser,module.exports.deleteUser=deleteUser;