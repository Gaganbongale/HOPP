const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await userRepository.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
          error: 'Unauthorized',
        });
      }

      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token has expired',
          error: 'TokenExpired',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
        error: 'InvalidToken',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
      error: 'NoToken',
    });
  }
};

// Optional protect for public routes that log user history if logged in
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await userRepository.findById(decoded.id);
    } catch (error) {
      // Silently fail authentication for optional endpoints, logging is not blocked
      logger.debug(`Optional authentication bypassed: ${error.message}`);
    }
  }
  next();
};

// Admin role check
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required',
      error: 'Forbidden',
    });
  }
};

module.exports = {
  protect,
  optionalProtect,
  admin,
};
