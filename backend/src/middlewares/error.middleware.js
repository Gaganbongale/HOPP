const logger = require('../utils/logger');
const { sendFailure } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for development
  logger.error(`${err.stack || err.message}`);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for ${field} field.`;
    error = new Error(message);
    error.statusCode = 409;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  
  // Format details for the client
  const errorDetails = process.env.NODE_ENV === 'development' 
    ? { stack: err.stack, originalError: err } 
    : {};

  res.status(statusCode).json(
    sendFailure(message, errorDetails)
  );
};

module.exports = errorHandler;
