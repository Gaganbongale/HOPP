const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/error.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const routeRoutes = require('./routes/route.routes');
const locationRoutes = require('./routes/location.routes');
const historyRoutes = require('./routes/history.routes');
const savedRouteRoutes = require('./routes/savedRoute.routes');

const app = express();

// 1. Security Middlewares
// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: 'TooManyRequests',
  },
});
app.use('/api', limiter);

// Body parser (JSON & urlencoded)
app.use(express.json({ limit: '10kb' })); // Body limit 10kb to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Sanitize data against XSS attacks
app.use(xss());

// 2. Request Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// 3. API Routes Mounting
app.use('/api/auth', authRoutes); // /api/auth/register, /api/auth/login, etc.
app.use('/api', routeRoutes);     // /api/routes/search, /api/routes/compare, /api/admin/routes, etc.
app.use('/api', locationRoutes);  // /api/locations, /api/admin/locations
app.use('/api', historyRoutes);   // /api/history, /api/history/:id
app.use('/api', savedRouteRoutes); // /api/saved-routes, /api/saved-routes/:id

// Base route for API status
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hubli-Dharwad Transit Planner API is online and healthy',
    timestamp: new Date(),
  });
});

// Catch-all for undefined routes
app.use('*', (req, res, next) => {
  const error = new Error(`Cannot find ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

// 4. Global Error Handler
app.use(errorHandler);

module.exports = app;
