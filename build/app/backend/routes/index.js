/*! cryptocurrency 2021-05-10 */
const express=require("express"),router=express.Router();router.get("/",(e,r)=>{r.sendFile("../resources/docs/index.html",{root:__dirname})}),module.exports=router;