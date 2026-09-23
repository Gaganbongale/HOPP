const express = require('express');
const router = express.Router();
const savedRouteController = require('../controllers/savedRoute.controller');
const { protect } = require('../middlewares/auth.middleware');
const { saveRouteValidator, mongoIdParamValidator } = require('../validators/route.validator');
const validate = require('../middlewares/validation.middleware');

// All saved routes are protected
router.use(protect);

// Mounted at: POST /api/saved-routes
router.post('/saved-routes', saveRouteValidator, validate, savedRouteController.saveRoute);

// Mounted at: GET /api/saved-routes
router.get('/saved-routes', savedRouteController.getSavedRoutes);

// Mounted at: DELETE /api/saved-routes/:id
router.delete('/saved-routes/:id', mongoIdParamValidator, validate, savedRouteController.deleteSavedRoute);

module.exports = router;
