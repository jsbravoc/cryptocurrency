const express = require("express");

const router = express.Router();

const {
  enforceValidTransactionsMiddleware,
} = require("../enforcer/cryptocurrency");

/* GET users listing. */
router.get("/", enforceValidTransactionsMiddleware, (req, res) =>
  res.status(200).json({ msg: "Ok" })
);

/* GET users listing. */
router.post("/", enforceValidTransactionsMiddleware, (req, res) =>
  res.status(200).json({ msg: "Ok" })
);

module.exports = router;
