/**
 * DEV ONLY: Change environment variables with a single request.
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
      VALIDATOR: process.env.VALIDATOR,
      ENABLE_LOGGING: process.env.ENABLE_LOGGING,
      DISABLE_INTEGRITY_VALIDATION: process.env.DISABLE_INTEGRITY_VALIDATION,
      HIDE_ENV_VARIABLES: process.env.HIDE_ENV_VARIABLES,
      DELAY_ENFORCER_MS: process.env.DELAY_ENFORCER_MS,
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
  if (req.body) {
    const {
      SAWTOOTH_PRIVATE_KEY,
      SAWTOOTH_REST,
      SAWTOOTH_REST_TIMEOUT,
      VALIDATOR,
      ENABLE_LOGGING,
      DISABLE_INTEGRITY_VALIDATION,
      HIDE_ENV_VARIABLES,
      DELAY_ENFORCER_MS,
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
    process.env.DELAY_ENFORCER_MS =
      DELAY_ENFORCER_MS || process.env.DELAY_ENFORCER_MS;
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
      DELAY_ENFORCER_MS: process.env.DELAY_ENFORCER_MS,
    },
  });
};
module.exports.getConfig = getConfig;
module.exports.changeConfig = changeConfig;
