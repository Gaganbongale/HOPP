const logger = require('../utils/logger');

const validateEnv = () => {
  process.env.NODE_ENV ||= 'development';
  process.env.PORT ||= '5000';

  if (process.env.NODE_ENV === 'production') {
    const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    if (process.env.JWT_SECRET === 'local-development-secret-change-before-deploying' || process.env.JWT_SECRET.length < 32) {
      throw new Error('Set a private JWT_SECRET with at least 32 characters before running in production.');
    }
  } else {
    // Local defaults keep a fresh development checkout easy to start.
    process.env.MONGODB_URI ||= 'mongodb://localhost:27017/hubli_dharwad_transit';
    process.env.JWT_SECRET ||= 'local-development-secret-change-before-deploying';
  }

  logger.info('Environment variables validated successfully.');
};

module.exports = validateEnv;
