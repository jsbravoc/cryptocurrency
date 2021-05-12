/*! cryptocurrency 2021-05-12 */
const result=require("dotenv").config();require("./utils/init");const express=require("express"),path=require("path"),cookieParser=require("cookie-parser"),i18next=require("i18next"),Backend=require("i18next-node-fs-backend"),i18nextMiddleware=require("i18next-express-middleware"),{SEVERITY,logFormatted}=require("./utils/logger"),app=express(),apiAddress=`http://${require("ip").address()}:${process.env.PORT||"3000"}`;"true"===process.env.CLEAR_STARTING_LOGS&&(logFormatted("Clearing the console in 5 seconds",SEVERITY.BOLD),setTimeout(()=>{console.clear(),logFormatted("Console cleared successfully",SEVERITY.BOLD)},5e3)),"true"!==process.env.HIDE_ENV_VARIABLES&&(logFormatted("Warning: Printing .env variables, use HIDE_ENV_VARIABLES=true to hide them",SEVERITY.LOW),logFormatted("Loaded environment variables",SEVERITY.BOLD,result.parsed)),logFormatted(`Server available at ${apiAddress}`,SEVERITY.URL),"true"===process.env.DEBUG&&(logFormatted("Express logger enabled, remove DEBUG env variable to disable it",SEVERITY.WARN),app.use(require("morgan")("dev",{skip:()=>"test"===process.env.NODE_ENV}))),i18next.use(Backend).use(i18nextMiddleware.LanguageDetector).init({backend:{loadPath:__dirname+"/resources/locales/{{lng}}/{{ns}}.json"},fallbackLng:"es",preload:["en","es"]});const jsDocs=path.join(__dirname,"/resources/docs/");app.use(express.static(jsDocs)),app.use(i18nextMiddleware.handle(i18next)),app.use(express.json()),app.use(express.urlencoded({extended:!1})),app.use(cookieParser()),"production"!==process.env.NODE_ENV&&(app.use("/api-docs",require("./routes/docs")),app.use("/docs",require("./routes"))),app.use("/cryptocurrency",require("./routes/cryptocurrency")),app.use("/users",require("./routes/users")),app.use("/validate",require("./routes/enforcer")),module.exports=app;