const _ = require("lodash");
/**
 * Represents a basic object of an asset, used in {@link User}, {@link Transaction} as an inheritable object.
 * @constructor
 * @param {TYPE} type - The type of the object @see {@link TYPE}.
 */
class BaseModel {
  constructor(type) {
    this.type = type;
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
   * @param {Boolean} [removeSignature=false] - If true, the resulting object will not have the signature property.
   * @param {Boolean} [removeType=true] - If true, the resulting object will not have the type property.
   *
   * @return {Object} JSON object containing the properties and values of the object.
   */
  toObject(removeSignature = false, removeType = true) {
    const copy = _.cloneDeep(this);
    if (removeSignature) delete copy.signature;
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
   * @param {Boolean} [removeSignature=false] - If true, the JSON-stringified object will not have the signature property.
   * @param {Boolean} [removeType=true] - If true, the JSON-stringified object will not have the type property.
   *
   * @return {String} JSON-stringified object.
   */
  toString(removeSignature = false, removeType = true) {
    const dictionary = this.toDictionary();
    if (removeSignature) delete dictionary.signature;
    if (removeType) delete dictionary.type;
    const response = JSON.stringify(dictionary);
    return response;
  }
}

module.exports = BaseModel;
