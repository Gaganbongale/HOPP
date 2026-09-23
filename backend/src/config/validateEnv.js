const logger = require('../utils/logger');

const validateEnv = () => {
  const required = ['MONGODB_URI', 'PORT', 'NODE_ENV'];
  const missing = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    logger.error(`Critical Configuration Error: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  logger.info('Environment variables validated successfully.');
};

module.exports = validateEnv;
