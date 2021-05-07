const _ = require("lodash");
/**
 * Represents a basic object of an asset, used in @see User, @see Transaction as an inheritable object.
 * @constructor
 * @param {String} type - The typoe of the object @see Constants.
 */
class BaseModel {
  constructor(type) {
    this.type = type;
  }

  addSignature(signature) {
    this.signature = signature;
  }

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

  toObject(removeSignature = false, removeType = true) {
    const copy = _.cloneDeep(this);
    if (removeSignature) delete copy.signature;
    if (removeType) delete copy.type;
    return copy;
  }

  static toSortedObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((r, k) => ((r[k] = obj[k]), r), {});
  }

  toString(removeSignature = false, removeType = true) {
    const dictionary = this.toDictionary();
    if (removeSignature) delete dictionary.signature;
    if (removeType) delete dictionary.type;
    const response = JSON.stringify(dictionary);
    return response;
  }
}

module.exports = BaseModel;
