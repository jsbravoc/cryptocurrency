/*! cryptocurrency 2021-05-12 */
const express=require("express"),router=express.Router(),{enforceValidTransactionsMiddleware}=require("../enforcer/cryptocurrency");router.get("/",enforceValidTransactionsMiddleware,(e,r)=>r.status(200).json({msg:"Ok"})),router.post("/",enforceValidTransactionsMiddleware,(e,r)=>r.status(200).json({msg:"Ok"})),module.exports=router;