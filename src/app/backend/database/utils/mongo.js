/**
 * MongoDB driver module.
 * @module MongoUtils
 * @author Juan Sebastián Bravo <js.bravo@uniandes.edu.co>
 */
require("dotenv").config();
/**
 * @constant MongoClient
 * @type {NodeModule}
 * Loads MongoClient module used to access the MongoDB database
 */
const MongoClient = require("mongodb").MongoClient;

/**
 * @constant uri
 * @type {String}
 * Associated MongoDB Atlas URI.
 */
const uri = process.env.MONGO_URI;

/**
 * @constant client
 * @type {MongoClient}
 * MongoClient.
 */
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

exports.getClient = () => client;

/**
 * @constant ObjectId
 * @type {NodeModule}
 * Loads ObjectId module to find/update by _id.
 */
const ObjectId = require("mongodb").ObjectID;

/**
 * @function getDatabasesPromise
 * @alias module:MongoUtils.getDatabasesPromise
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} Promise which will return an object with the databases.
 */
exports.getDatabasesPromise = () => {
  return client.connect().then((client) => client.db().admin().listDatabases());
};

/**
 * @function getCollectionPromise
 * @alias module:MongoUtils.getCollectionPromise
 * @param {String} dbName Name of the database to query its collections.
 * @throws {Error} If dbName parameter is null, undefined or is not a string.
 * @throws {Error} If the connection could not be established.
 * @returns {Promise} Promise which will return an array of the databases collections.
 */
exports.getCollectionPromise = (dbName) => {
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  return client
    .connect()
    .then((client) => client.db(dbName).listCollections().toArray());
};

/**
 * @function getDocumentsPromise
 * @alias module:MongoUtils.getDocumentsPromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @throws {Error} if uri param is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return an array with the documents of the collection.
 */
exports.getDocumentsPromise = (dbName, collectionName) => {
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  if (!collectionName || !(collectionName instanceof String)) {
    new Error("Collection name cannot be: " + collectionName);
  }
  return client.connect().then((client) =>
    client
      .db(dbName)
      .collection(collectionName)
      .find({})
      .sort({
        _id: -1,
      })
      .toArray()
  );
};

/**
 * @function findAndDeleteOnePromise
 * @alias module:MongoUtils.findAndDeleteOnePromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @param {String} _id The unique _id of the document to be deleted.
 * @throws {Error} if the collection name parameter is null, undefined or is not a string.
 * @throws {Error} if the unique _id parameter is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return the document deleted.
 */
exports.findAndDeleteOnePromise = (dbName, collectionName, _id) => {
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  if (!collectionName || !(collectionName instanceof String)) {
    new Error("Collection name cannot be: " + collectionName);
  }
  if (!_id || !(_id instanceof String)) {
    new Error("The unique _id of the document cannot be: " + _id);
  }

  return client.connect().then((client) =>
    client
      .db(dbName)
      .collection(collectionName)
      .findOneAndDelete({
        _id: new ObjectId(_id),
      })
  );
};

/**
 * @function findAndUpdateOnePromise
 * @alias module:MongoUtils.findAndUpdateOnePromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @param {String} _id The unique _id of the document to be updated.
 * @param {Object} newObject The updated object to set in MongoDB.
 * @param {Object} [parameters] MongoDB parameters (such as $push, $set, etc).
 * @throws {Error} if the collection name parameter is null, undefined or is not a string.
 * @throws {Error} if the unique _id parameter is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return the non updated object.
 */
exports.findAndUpdateOnePromise = (
  dbName,
  collectionName,
  _id,
  newObject,
  parameters
) => {
  if (!parameters)
    parameters = {
      $set: newObject,
    };
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  if (!collectionName || !(collectionName instanceof String)) {
    new Error("Collection name cannot be: " + collectionName);
  }
  if (!_id || !(_id instanceof String)) {
    new Error("The unique _id of the document cannot be: " + _id);
  }
  return client.connect().then((client) =>
    client
      .db(dbName)
      .collection(collectionName)
      .findOneAndUpdate(
        {
          _id: new ObjectId(_id),
        },
        parameters
      )
  );
};

/**
 * @function findOnePromise
 * @alias module:MongoUtils.findOnePromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @param {String} _id The unique _id of the document to be found.
 * @throws {Error} if the collection name parameter is null, undefined or is not a string.
 * @throws {Error} if the unique _id parameter is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return the object.
 */
exports.findOnePromise = (dbName, collectionName, _id) => {
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  if (!collectionName || !(collectionName instanceof String)) {
    new Error("Collection name cannot be: " + collectionName);
  }
  if (!_id || !(_id instanceof String)) {
    new Error("The unique _id of the document cannot be: " + _id);
  }
  return client.connect().then((client) =>
    client
      .db(dbName)
      .collection(collectionName)
      .find({
        _id: new ObjectId(_id),
      })
      .toArray()
  );
};

/**
 * @function findOneObjectPromise
 * @alias module:MongoUtils.findOneObjectPromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @param {String} object The document to be found.
 * @throws {Error} if the collection name parameter is null, undefined or is not a string.
 * @throws {Error} if the unique _id parameter is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return the object.
 */
exports.findOneObjectPromise = (dbName, collectionName, object) => {
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  if (!collectionName || !(collectionName instanceof String)) {
    new Error("Collection name cannot be: " + collectionName);
  }
  return client
    .connect()
    .then((client) =>
      client.db(dbName).collection(collectionName).find(object).toArray()
    );
};

/**
 * @function createOneDocumentPromise
 * @alias module:MongoUtils.createOneDocumentPromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @param {Object} object The object to be inserted in the database.
 * @throws {Error} if the collection name parameter is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return the object.
 */
exports.createOneDocumentPromise = (dbName, collectionName, object) => {
  if (!dbName || !(dbName instanceof String)) {
    new Error("Database name cannot be: " + dbName);
  }
  if (!collectionName || !(collectionName instanceof String)) {
    new Error("Collection name cannot be: " + collectionName);
  }
  return client
    .connect()
    .then((client) =>
      client.db(dbName).collection(collectionName).insertOne(object)
    );
};

/**
 * @function findOrCreateDocumentPromise
 * @alias module:MongoUtils.findOrCreateDocumentPromise
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to query its documents.
 * @param {Object} searchObject The object to find in the database.
 * @param {Object} insertObject The object to create in the database if searchObject was not found.
 * @throws {Error} if the collection name parameter is null, undefined or is not a string.
 * @throws {Error} if the connection could not be established.
 * @returns {Promise} A Promise that will return the object.
 */
exports.findOrCreateDocumentPromise = (
  dbName,
  collectionName,
  searchObject,
  insertObject
) => {
  return client.connect().then((client) =>
    client.db(dbName).collection(collectionName).findOneAndUpdate(
      searchObject,
      {
        $setOnInsert: insertObject,
      },
      {
        returnOriginal: false,
        upsert: true,
      }
    )
  );
};
/**
 * @function listenForChanges
 * @alias module:MongoUtils.listenForChanges
 * Returns atomic changes in the collection specified.
 * @param {String} dbName Name of the database to query.
 * @param {String} collectionName Name of the collection to watch its documents.
 * @param {Function} callback The function to be called with the _id of the modified document and the full document.
 * @returns {Function} The callback received as parameter.
 */
exports.listenForChanges = (dbName, collectionName, callback) => {
  try {
    client.connect().then((client) => {
      const cursor = client
        .db(dbName)
        .collection(collectionName)
        .watch({ fullDocument: "updateLookup" });

      cursor.on("change", (data) => {
        const _id = data.fullDocument._id;
        this.findOnePromise(dbName, collectionName, _id).then((docs) => {
          if (data && data.updateDescription) {
            docs[0].updatedField = Object.getOwnPropertyNames(
              data.updateDescription.updatedFields
            )[0].split(".")[0];
            return callback(_id, JSON.stringify(docs[0]));
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
  }
};
