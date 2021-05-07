const express = require("express");

const router = express.Router();
const {
  createTransaction,
  getTransactionByAddress,
  getTransactionHistory,
  getTransactions,
  updateTransaction,
} = require("../controllers/cryptocurrency");
const {
  validateTransactionAddress,
  validateTransactionUpdateRequest,
  verifyPostTransaction,
  inputValidation,
} = require("../validators/cryptocurrency");
/* GET users listing. */
router.get("/", getTransactions);

/* GET users listing. */
router.post("/", [inputValidation, verifyPostTransaction], createTransaction);

/* GET users listing. */
router.get(
  "/:address",
  [...validateTransactionAddress],
  getTransactionByAddress
);

/* GET users listing. */
router.put(
  "/:address",
  [...validateTransactionAddress, ...validateTransactionUpdateRequest],
  updateTransaction
);

module.exports = router;
