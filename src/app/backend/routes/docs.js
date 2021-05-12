const express = require("express");

const router = express.Router();

/* GET users listing. */
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../resources/docs/swagger/swagger.json");
const { SEVERITY, logFormatted } = require("../utils/logger");
const { LOCAL_ADDRESS } = require("../utils/constants");

const localAddress = `http://${LOCAL_ADDRESS}:${process.env.PORT || "3000"}`;
swaggerDocument.host = localAddress;
require("public-ip")
  .v4()
  .then((publicIp) => {
    logFormatted(
      `LOCAL IP | Docs available at ${localAddress}/api-docs`,
      SEVERITY.URL
    );
    const publicAddress = `http://${publicIp}:${process.env.PORT || "3000"}`;
    logFormatted(
      `PUBLIC IP | Docs available at ${publicAddress}/api-docs`,
      SEVERITY.URL
    );

    swaggerDocument.servers = [
      {
        url: localAddress,
        description: "Local address server",
      },
      {
        url: publicAddress,
        description: "Public address server",
      },
    ];
    router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logFormatted(
      "Warning: /api-docs should not be used in production, use NODE_ENV=production to disable it",
      SEVERITY.LOW
    );
    logFormatted("Swagger-UI application launched successfully", SEVERITY.NONE);
  });

module.exports = router;
