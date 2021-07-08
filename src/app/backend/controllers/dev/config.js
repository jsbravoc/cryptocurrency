/** Config controller functionality
 * @module config
 */
const { configRedisCache } = require("../common");
/**
 * DEV ONLY: Get environment variables.
 *
 * @param {Request} req - Http request object.
 * @param {Response} res - Response object to handle Express request.
 */
const getConfig = (req, res) => {
  return res.status(200).json({
    msg: "Current config",
    variables: {
      SAWTOOTH_PRIVATE_KEY: process.env.SAWTOOTH_PRIVATE_KEY,
      SAWTOOTH_REST: process.env.SAWTOOTH_REST,
      SAWTOOTH_REST_TIMEOUT: process.env.SAWTOOTH_REST_TIMEOUT,
      ENABLE_LOGGING: process.env.ENABLE_LOGGING,
      DISABLE_INTEGRITY_VALIDATION: process.env.DISABLE_INTEGRITY_VALIDATION,
      HIDE_ENV_VARIABLES: process.env.HIDE_ENV_VARIABLES,
      USE_REDIS: process.env.USE_REDIS,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    },
  });
};

/**
 * DEV ONLY: Change environment variables with a single request.
 *
 * @param {Request} req - Http request object.
 * @param {Response} res - Response object to handle Express request.
 */
const changeConfig = (req, res) => {
  const {
    SAWTOOTH_PRIVATE_KEY,
    SAWTOOTH_REST,
    SAWTOOTH_REST_TIMEOUT,
    VALIDATOR,
    ENABLE_LOGGING,
    DISABLE_INTEGRITY_VALIDATION,
    HIDE_ENV_VARIABLES,
    USE_REDIS,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
  } = req.body;
  process.env.SAWTOOTH_PRIVATE_KEY =
    SAWTOOTH_PRIVATE_KEY || process.env.SAWTOOTH_PRIVATE_KEY;
  process.env.SAWTOOTH_REST = SAWTOOTH_REST || process.env.SAWTOOTH_REST;
  process.env.SAWTOOTH_REST_TIMEOUT =
    SAWTOOTH_REST_TIMEOUT || process.env.SAWTOOTH_REST_TIMEOUT;
  process.env.VALIDATOR = VALIDATOR || process.env.VALIDATOR;
  process.env.ENABLE_LOGGING = ENABLE_LOGGING || process.env.ENABLE_LOGGING;
  process.env.DISABLE_INTEGRITY_VALIDATION =
    DISABLE_INTEGRITY_VALIDATION || process.env.DISABLE_INTEGRITY_VALIDATION;
  process.env.HIDE_ENV_VARIABLES =
    HIDE_ENV_VARIABLES || process.env.HIDE_ENV_VARIABLES;
  process.env.USE_REDIS = USE_REDIS || process.env.USE_REDIS;
  process.env.REDIS_HOST = REDIS_HOST || process.env.REDIS_HOST;
  process.env.REDIS_PORT = REDIS_PORT || process.env.REDIS_PORT;
  process.env.REDIS_PASSWORD = REDIS_PASSWORD || process.env.REDIS_PASSWORD;
  if (USE_REDIS === "true") {
    configRedisCache({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      auth_pass: process.env.REDIS_PASSWORD,
      db: 0,
      ttl: 6000,
    });
  } else if (USE_REDIS === "false") {
    configRedisCache(
      {
        get: () => Promise.resolve(undefined),
        set: () => Promise.resolve(undefined),
        del: () => Promise.resolve(undefined),
      },
      false
    );
  }

  return res.status(200).json({
    msg: "Ok",
    variables: {
      SAWTOOTH_PRIVATE_KEY: process.env.SAWTOOTH_PRIVATE_KEY,
      SAWTOOTH_REST: process.env.SAWTOOTH_REST,
      SAWTOOTH_REST_TIMEOUT: process.env.SAWTOOTH_REST_TIMEOUT,
      VALIDATOR: process.env.VALIDATOR,
      ENABLE_LOGGING: process.env.ENABLE_LOGGING,
      DISABLE_INTEGRITY_VALIDATION: process.env.DISABLE_INTEGRITY_VALIDATION,
      HIDE_ENV_VARIABLES: process.env.HIDE_ENV_VARIABLES,
      USE_REDIS: process.env.USE_REDIS,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    },
  });
};
module.exports.getConfig = getConfig;
module.exports.changeConfig = changeConfig;
