const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');
const { protect } = require('../middlewares/auth.middleware');
const { mongoIdParamValidator } = require('../validators/route.validator');
const validate = require('../middlewares/validation.middleware');

// All history routes are protected
router.use(protect);

// Mounted at: GET /api/history
router.get('/history', historyController.getHistory);

// Mounted at: DELETE /api/history/:id
router.delete('/history/:id', mongoIdParamValidator, validate, historyController.deleteHistory);

module.exports = router;
