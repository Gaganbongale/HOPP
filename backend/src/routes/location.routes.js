const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { protect, admin } = require('../middlewares/auth.middleware');
const {
  adminCreateLocationValidator,
  mongoIdParamValidator,
  paginationValidator,
} = require('../validators/route.validator');
const validate = require('../middlewares/validation.middleware');

// Public routes
// Mounted at: GET /api/locations
router.get('/locations', paginationValidator, validate, locationController.getLocations);

// Mounted at: GET /api/locations/:id
router.get('/locations/:id', mongoIdParamValidator, validate, locationController.getLocation);

// Admin routes
// Mounted at: POST /api/admin/locations
router.post(
  '/admin/locations',
  protect,
  admin,
  adminCreateLocationValidator,
  validate,
  locationController.createLocation
);

// Mounted at: PUT /api/admin/locations/:id
router.put(
  '/admin/locations/:id',
  protect,
  admin,
  mongoIdParamValidator,
  adminCreateLocationValidator,
  validate,
  locationController.updateLocation
);

// Mounted at: DELETE /api/admin/locations/:id (soft delete)
router.delete(
  '/admin/locations/:id',
  protect,
  admin,
  mongoIdParamValidator,
  validate,
  locationController.deleteLocation
);

module.exports = router;
