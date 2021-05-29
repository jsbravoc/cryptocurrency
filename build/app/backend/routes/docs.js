const express=require("express"),router=express.Router(),swaggerUi=require("swagger-ui-express"),swaggerDocument=require("../resources/docs/swagger/swagger.json"),{SEVERITY,logFormatted}=require("../utils/logger"),{LOCAL_ADDRESS}=require("../utils/constants"),localAddress=`http://${LOCAL_ADDRESS}:${process.env.PORT||"3000"}`;swaggerDocument.host=localAddress,require("public-ip").v4().then(e=>{logFormatted(`Swagger application available at ${localAddress}/api-docs`,SEVERITY.URL);e=`http://${e}:${process.env.PORT||"3000"}`;swaggerDocument.servers=[{url:localAddress,description:"Local address server"},{url:e,description:"Public address server"}],router.use("/",swaggerUi.serve,swaggerUi.setup(swaggerDocument)),logFormatted("Warning: Swagger-UI application should not be used in production, use NODE_ENV=production to disable it",SEVERITY.LOW)}),module.exports=router;