const chalk = require("chalk");
const SEVERITY = {
  NONE: 0,
  BOLD: 1,
  URL: 2,
  NOTIFY: 3,
  LOW: 4,
  WARN: 5,
  ERROR: 6,
  SUCCESS: 7,
};

// Disable console.log in production
if (!process.env.ENABLE_LOGGING || process.env.ENABLE_LOGGING !== "true") {
  console.log = function () {};
}

const formatMessage = (msg, severity = 0) => {
  let response;
  const options = {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const now = new Date();
  const identifier = chalk.black.bgWhite(
    `CNK-BACKEND | ${now.toLocaleDateString("en-US", options)} `
  );
  switch (severity) {
    case SEVERITY.SUCCESS:
      response = `${identifier} ${chalk.green(msg)}`;
      break;
    case SEVERITY.ERROR:
      response = `${identifier} ${chalk.red(msg)}`;
      break;
    case SEVERITY.WARN:
      response = `${identifier} ${chalk.yellow(msg)}`;
      break;
    case SEVERITY.LOW:
      response = `${identifier} ${chalk.magenta(msg)}`;
      break;
    case SEVERITY.NOTIFY:
      response = `${identifier} ${chalk.bold(msg)}`;
      break;
    case SEVERITY.URL:
      // eslint-disable-next-line no-case-declarations
      const urlRegex =
        "(http|https)://(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9]).)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])(:[0-9]+)?$";
      // eslint-disable-next-line no-case-declarations
      const url = msg.match(urlRegex);
      msg = msg.replace(url[0], "");
      response = `${identifier} ${msg}${chalk.underline.blue(url[0])}`;
      break;
    case SEVERITY.BOLD:
      response = `${identifier} ${chalk.bold(msg)}`;
      break;
    case SEVERITY.NONE:
    default:
      response = `${identifier} ${msg}`;
      break;
  }
  return response;
};
const logFormatted = (msg, severity = 0, object = null) => {
  if (object) {
    console.log(formatMessage(msg, severity), object);
  } else console.log(formatMessage(msg, severity));
};
module.exports = {
  SEVERITY,
  formatMessage,
  logFormatted,
};
