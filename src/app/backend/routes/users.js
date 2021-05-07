const express = require("express");

const router = express.Router();
const {
  createUser,
  deleteUser,
  getUserByAddress,
  getUsers,
  updateUser,
} = require("../controllers/users");

const {
  validateUserCreation,
  validateUserRetrieval,
  validateUserUpdate,
  validateUserDelete,
} = require("../validators/users");

/* GET users listing. */
router.get("/", getUsers);

/* GET users listing. */
router.post("/", [...validateUserCreation], createUser);

/* GET users listing. */
router.get("/:address", [...validateUserRetrieval], getUserByAddress);

/* GET users listing. */
router.put("/:address", [...validateUserUpdate], updateUser);

/* GET users listing. */
router.delete("/:address", [...validateUserDelete], deleteUser);

module.exports = router;
