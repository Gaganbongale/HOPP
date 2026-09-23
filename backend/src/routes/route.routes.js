const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const { protect, optionalProtect, admin } = require('../middlewares/auth.middleware');
const {
  searchRouteValidator,
  compareRouteValidator,
  adminCreateRouteValidator,
  mongoIdParamValidator,
} = require('../validators/route.validator');
const validate = require('../middlewares/validation.middleware');

// ====================================================
// OPENAPI COMPLIANT ROUTES
// ====================================================

// Health check
router.get('/healthz', routeController.healthCheck);

// Plan route
router.post('/routes/plan', routeController.planRoutes);

// Get popular routes
router.get('/routes/popular', routeController.getPopularRoutes);

// Network statistics
router.get('/network/stats', routeController.getNetworkStats);

// Network nodes for 3D visualization
router.get('/network/nodes', routeController.getNetworkNodes);

// Search stops
router.get('/stops/search', routeController.searchStops);

// Submit feedback
router.post('/feedback', routeController.createFeedback);


// ====================================================
// LEGACY / BACKWARDS-COMPATIBILITY ROUTES
// ====================================================

router.post(
  '/routes/search',
  optionalProtect,
  searchRouteValidator,
  validate,
  routeController.searchRoute
);

router.get(
  '/routes/compare',
  compareRouteValidator,
  validate,
  routeController.compareRoute
);

router.get('/routes/recent', protect, routeController.getRecentSearches);

router.post(
  '/admin/routes',
  protect,
  admin,
  adminCreateRouteValidator,
  validate,
  routeController.createRoute
);

router.put(
  '/admin/routes/:id',
  protect,
  admin,
  mongoIdParamValidator,
  adminCreateRouteValidator,
  validate,
  routeController.updateRoute
);

router.delete(
  '/admin/routes/:id',
  protect,
  admin,
  mongoIdParamValidator,
  validate,
  routeController.deleteRoute
);

router.get('/dashboard/stats', protect, admin, routeController.getDashboardStats);

module.exports = router;
