const express = require("express");

const router = express.Router();
/* GET home page. */
router.get("/", (req, res) => {
  res.sendFile("../resources/docs/index.html", { root: __dirname });
});

module.exports = router;
