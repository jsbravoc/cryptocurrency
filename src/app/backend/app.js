const result = require("dotenv").config();
require("./utils/init");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const i18next = require("i18next");
const Backend = require("i18next-node-fs-backend");
const i18nextMiddleware = require("i18next-express-middleware");
const { SEVERITY, logFormatted } = require("./utils/logger");

const app = express();

const apiAddress = `http://${require("ip").address()}:${
  process.env.PORT || "3000"
}`;
if (process.env.CLEAR_STARTING_LOGS === "true") {
  logFormatted("Clearing the console in 5 seconds", SEVERITY.BOLD);
  setTimeout(() => {
    console.clear();
    logFormatted("Console cleared successfully", SEVERITY.BOLD);
  }, 5000);
}
if (process.env.HIDE_ENV_VARIABLES !== "true") {
  logFormatted(
    "Warning: Printing .env variables, use HIDE_ENV_VARIABLES=true to hide them",
    SEVERITY.LOW
  );
  logFormatted("Loaded environment variables", SEVERITY.BOLD, result.parsed);
}
logFormatted(`Server available at ${apiAddress}`, SEVERITY.URL);

if (process.env.DEBUG === "true") {
  logFormatted(
    "Express logger enabled, remove DEBUG env variable to disable it",
    SEVERITY.WARN
  );
  app.use(
    require("morgan")("dev", {
      skip: () => process.env.NODE_ENV === "test",
    })
  );
}

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + "/resources/locales/{{lng}}/{{ns}}.json",
    },
    fallbackLng: "es",
    preload: ["es", "en"],
  });

app.use(i18nextMiddleware.handle(i18next));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", require("./routes/docs"));
  const jsDocs = path.join(__dirname, "/resources/docs/");
  app.use("/docs", express.static(jsDocs));
  if (process.env.ALLOW_DEV_ENV_CHANGES === "true") {
    logFormatted(
      "Warning: allowing environment variables to be changed by method POST in /config. This is **only** recommended for testing, not for production.",
      SEVERITY.ERROR
    );
    app.use("/config", require("./routes/dev/config"));
  }
}

app.use("/cryptocurrency", require("./routes/cryptocurrency"));

app.use("/users", require("./routes/users"));

app.use("/validate", require("./routes/enforcer"));

module.exports = app;
