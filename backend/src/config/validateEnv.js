const logger = require('../utils/logger');

const validateEnv = () => {
  // Local defaults make a fresh checkout usable with the standard MongoDB install.
  process.env.MONGODB_URI ||= 'mongodb://localhost:27017/hubli_dharwad_transit';
  process.env.PORT ||= '5000';
  process.env.NODE_ENV ||= 'development';
  process.env.JWT_SECRET ||= 'local-development-secret-change-before-deploying';

  logger.info('Environment variables validated successfully.');
};

module.exports = validateEnv;
