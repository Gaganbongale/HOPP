require('dotenv').config();
const validateEnv = require('./config/validateEnv');

// Validate environment variables before startup
validateEnv();

const app = require('./app');
const connectDB = require('./database/connection');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down...`);
  logger.error(err.stack || err.message);
  process.exit(1);
});

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down...`);
  logger.error(err.stack || err.message);
  server.close(() => {
    process.exit(1);
  });
});
