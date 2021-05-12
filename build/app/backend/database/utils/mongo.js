/*! cryptocurrency 2021-05-12 */
require("dotenv").config();const MongoClient=require("mongodb").MongoClient,uri=process.env.MONGO_URI,client=new MongoClient(uri,{useUnifiedTopology:!0,useNewUrlParser:!0});exports.getClient=()=>client;const ObjectId=require("mongodb").ObjectID;exports.getDatabasesPromise=()=>client.connect().then(n=>n.db().admin().listDatabases()),exports.getCollectionPromise=e=>(e&&e instanceof String||new Error("Database name cannot be: "+e),client.connect().then(n=>n.db(e).listCollections().toArray())),exports.getDocumentsPromise=(e,t)=>(e&&e instanceof String||new Error("Database name cannot be: "+e),t&&t instanceof String||new Error("Collection name cannot be: "+t),client.connect().then(n=>n.db(e).collection(t).find({}).sort({_id:-1}).toArray())),exports.findAndDeleteOnePromise=(e,t,o)=>(e&&e instanceof String||new Error("Database name cannot be: "+e),t&&t instanceof String||new Error("Collection name cannot be: "+t),o&&o instanceof String||new Error("The unique _id of the document cannot be: "+o),client.connect().then(n=>n.db(e).collection(t).findOneAndDelete({_id:new ObjectId(o)}))),exports.findAndUpdateOnePromise=(e,t,o,n,r)=>(r=r||{$set:n},e&&e instanceof String||new Error("Database name cannot be: "+e),t&&t instanceof String||new Error("Collection name cannot be: "+t),o&&o instanceof String||new Error("The unique _id of the document cannot be: "+o),client.connect().then(n=>n.db(e).collection(t).findOneAndUpdate({_id:new ObjectId(o)},r))),exports.findOnePromise=(e,t,o)=>(e&&e instanceof String||new Error("Database name cannot be: "+e),t&&t instanceof String||new Error("Collection name cannot be: "+t),o&&o instanceof String||new Error("The unique _id of the document cannot be: "+o),client.connect().then(n=>n.db(e).collection(t).find({_id:new ObjectId(o)}).toArray())),exports.findOneObjectPromise=(e,t,o)=>(e&&e instanceof String||new Error("Database name cannot be: "+e),t&&t instanceof String||new Error("Collection name cannot be: "+t),client.connect().then(n=>n.db(e).collection(t).find(o).toArray())),exports.createOneDocumentPromise=(e,t,o)=>(e&&e instanceof String||new Error("Database name cannot be: "+e),t&&t instanceof String||new Error("Collection name cannot be: "+t),client.connect().then(n=>n.db(e).collection(t).insertOne(o))),exports.findOrCreateDocumentPromise=(e,t,o,r)=>client.connect().then(n=>n.db(e).collection(t).findOneAndUpdate(o,{$setOnInsert:r},{returnOriginal:!1,upsert:!0})),exports.listenForChanges=(o,r,i)=>{try{client.connect().then(n=>{const e=n.db(o).collection(r).watch({fullDocument:"updateLookup"});e.on("change",e=>{const t=e.fullDocument._id;this.findOnePromise(o,r,t).then(n=>{if(e&&e.updateDescription)return n[0].updatedField=Object.getOwnPropertyNames(e.updateDescription.updatedFields)[0].split(".")[0],i(t,JSON.stringify(n[0]))})})})}catch(n){console.error(n)}};