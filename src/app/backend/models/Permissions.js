/**
 * Represents the dictionary of permissions that a user has.
 * @constructor
 * @param {Object} permissions - Object or dictionary of permissions.
 */
class Permissions {
  constructor(permissions) {
    for (const key in permissions) {
      if (Object.hasOwnProperty.call(permissions, key)) {
        this[key] = permissions[key];
      }
    }
  }
}

module.exports = Permissions;
