const mongoose = require('mongoose');
const logger = require('../utils/logger');
const buildIndexes = require('./indexes');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hubli_dharwad_transit';

  // Ensure listeners are registered only once
  if (mongoose.connection.listeners('connected').length === 0) {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB database connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB database connection disconnected.');
    });
  }

  let retries = 5;
  while (retries > 0) {
    try {
      logger.info(`Attempting to connect to MongoDB... (${6 - retries}/5)`);
      await mongoose.connect(connUri);
      
      // Verify and build indexes
      await buildIndexes();
      return mongoose.connection;
    } catch (err) {
      logger.error(`Database connection failed: ${err.message}`);
      retries -= 1;
      if (retries === 0) {
        logger.error('All database connection retries exhausted.');
        throw err;
      }
      logger.info('Waiting 5 seconds before retrying...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
