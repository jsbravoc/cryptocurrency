const express = require("express");

const router = express.Router();

/* GET users listing. */
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../../resources/swagger/cryptocurrency-open-api.json");
const { SEVERITY, logFormatted } = require("../../utils/logger");
const { LOCAL_ADDRESS } = require("../../utils/constants");

const localAddress = `http://${LOCAL_ADDRESS}:${process.env.PORT || "3000"}`;
swaggerDocument.host = localAddress;
require("public-ip")
  .v4()
  .then((publicIp) => {
    logFormatted(
      `Swagger application available at ${localAddress}/api-docs`,
      SEVERITY.URL
    );
    const publicAddress = `http://${publicIp}:${process.env.PORT || "3000"}`;

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
    swaggerDocument.tags = [
      {
        name: "users",
        description: "User creation and retrieval",
        externalDocs: {
          description: "Check out User docs",
          url: `${localAddress}/docs/User.html`,
        },
      },
      {
        name: "cryptocurrency",
        description: "Transaction creation and management",
        externalDocs: {
          description: "Check out Transaction docs",
          url: `${localAddress}/docs/Transaction.html`,
        },
      },
    ];
    router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logFormatted(
      "Warning: Swagger-UI application should not be used in production, use NODE_ENV=production to disable it",
      SEVERITY.LOW
    );
  });

module.exports = router;
