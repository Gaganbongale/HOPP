const express = require('express');
const path = require('path');
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
const ticketRoutes = require('./routes/ticket.routes');

const app = express();
const frontendDist = path.resolve(__dirname, '../public');
app.set('trust proxy', 1);

// 1. Security Middlewares
// Permit the third-party checkout and Google Identity scripts used by the UI.
const defaultCsp = helmet.contentSecurityPolicy.getDefaultDirectives();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...defaultCsp,
      'script-src': [...defaultCsp['script-src'], 'https://accounts.google.com/gsi/client', 'https://checkout.razorpay.com'],
      'frame-src': [...(defaultCsp['frame-src'] || ["'self'"]), 'https://accounts.google.com/gsi/', 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
      'connect-src': [...(defaultCsp['connect-src'] || ["'self'"]), 'https://accounts.google.com/gsi/', 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
    },
  },
}));

// Enable CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

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

// The production container serves the built frontend and API from one origin.
app.use(express.static(frontendDist));

// 3. API Routes Mounting
app.use('/api/auth', authRoutes); // /api/auth/register, /api/auth/login, etc.
app.use('/api', routeRoutes);     // /api/routes/search, /api/routes/compare, /api/admin/routes, etc.
app.use('/api', locationRoutes);  // /api/locations, /api/admin/locations
app.use('/api', ticketRoutes);    // /api/tickets payment and validation
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

// Let the browser app handle client-side routes while keeping API 404s intact.
app.get('*', (req, res, next) => {
  if (req.path === '/health' || req.path === '/api' || req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(frontendDist, 'index.html'), (error) => error && next(error));
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
