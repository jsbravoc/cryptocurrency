const express = require("express");

const router = express.Router();
/* GET home page. */

const { logFormatted, SEVERITY } = require("../utils/logger");

router.get("/", (req, res) => {
  logFormatted("GET /docs successfully served", SEVERITY.NONE);
  res.sendFile("../resources/docs/index.html", { root: __dirname });
});

module.exports = router;
