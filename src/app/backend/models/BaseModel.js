const _ = require("lodash");
/**
 * Represents a basic object of a blockchain transaction, used in {@link User}, {@link Transaction} as an inheritable object.
 * @constructor
 * @param {TYPE} type - The type of the object @see {@link TYPE}.
 * @param {String} address - The unique address of the object in Sawtooth.
 */
class BaseModel {
  constructor(type, address) {
    this.type = type;
    this.address = address;
  }

  /**
   * Returns the object as a JSON dictionary (without BaseModel.prototype).
   *
   * @return {Object} JSON object containing the properties and values of the object.
   */
  toDictionary() {
    const dictionary = {};
    Object.keys(this)
      .sort()
      .forEach((key) => {
        if (this[key] !== null && this[key] !== undefined) {
          dictionary[key] = this[key];
        }
      });
    return dictionary;
  }

  /**
   * Returns a copy of the object.
   *
   * @param {Boolean} [removeType=true] - If true, the resulting object will not have the type property.
   *
   * @return {Object} JSON object containing the properties and values of the object.
   */
  toObject(removeType = true) {
    const copy = _.cloneDeep(this);
    if (removeType) delete copy.type;
    return copy;
  }

  /**
   * Returns the object received as parameter as an ordered (property-wise) object.
   *
   * @static
   * @param {Object} obj - Object whose properties will be sorted and returned.
   *
   * @return {Object} JSON object containing the properties and values of the object.
   */
  static toSortedObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((r, k) => ((r[k] = obj[k]), r), {});
  }

  /**
   * Returns the object as a JSON-stringified string.
   *
   * @param {Boolean} [removeType=true] - If true, the JSON-stringified object will not have the type property.
   * @param {HTTP_METHODS} [httpMethod=null] - Http method (defined in @see {@link HTTP_METHODS} constants) that request the stringified object (used in transaction processor to handle the request).
   *
   * @return {String} JSON-stringified object.
   */
  toString(removeType = true, httpMethod = null) {
    const dictionary = this.toDictionary();
    if (removeType) delete dictionary.type;
    if (httpMethod !== null && httpMethod !== undefined)
      dictionary.httpMethod = httpMethod;
    const response = JSON.stringify(dictionary);
    return response;
  }
}

module.exports = BaseModel;
