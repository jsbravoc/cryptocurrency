/*! cryptocurrency 2021-05-07 */
const express=require("express"),router=express.Router(),{createUser,deleteUser,getUserByAddress,getUsers,updateUser}=require("../controllers/users"),{validateUserCreation,validateUserRetrieval,validateUserUpdate,validateUserDelete}=require("../validators/users");router.get("/",getUsers),router.post("/",[...validateUserCreation],createUser),router.get("/:address",[...validateUserRetrieval],getUserByAddress),router.put("/:address",[...validateUserUpdate],updateUser),router.delete("/:address",[...validateUserDelete],deleteUser),module.exports=router;