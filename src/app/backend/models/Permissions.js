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
