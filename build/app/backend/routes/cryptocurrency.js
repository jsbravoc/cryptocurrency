/*! cryptocurrency 2021-05-17 */
const express=require("express"),router=express.Router(),{createTransaction,getTransactionByAddress,getTransactionHistory,getTransactions,updateTransaction}=require("../controllers/cryptocurrency"),{validateTransactionAddress,validateTransactionUpdateRequest,verifyPostTransaction,inputValidation}=require("../validators/cryptocurrency");router.get("/",getTransactions),router.post("/",[inputValidation,verifyPostTransaction],createTransaction),router.get("/:address",[...validateTransactionAddress],getTransactionByAddress),router.put("/:address",[...validateTransactionAddress,...validateTransactionUpdateRequest],updateTransaction),module.exports=router;