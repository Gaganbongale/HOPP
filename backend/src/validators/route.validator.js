const { body, query, param } = require('express-validator');

const searchRouteValidator = [
  body('source')
    .trim()
    .notEmpty()
    .withMessage('Source location name is required')
    .isString()
    .withMessage('Source location must be a string'),
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination location name is required')
    .isString()
    .withMessage('Destination location must be a string'),
];

const compareRouteValidator = [
  query('source')
    .trim()
    .notEmpty()
    .withMessage('Source location query is required'),
  query('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination location query is required'),
  query('fareWeight')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('fareWeight must be a float between 0 and 1')
    .toFloat(),
  query('timeWeight')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('timeWeight must be a float between 0 and 1')
    .toFloat(),
];

const saveRouteValidator = [
  body('routeId')
    .trim()
    .notEmpty()
    .withMessage('Route ID is required')
    .isMongoId()
    .withMessage('Invalid Route ID format'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Nickname cannot exceed 30 characters'),
];

const adminCreateRouteValidator = [
  body('sourceLocation')
    .trim()
    .notEmpty()
    .withMessage('Source location ID is required')
    .isMongoId()
    .withMessage('Invalid Source Location ID format'),
  body('destinationLocation')
    .trim()
    .notEmpty()
    .withMessage('Destination location ID is required')
    .isMongoId()
    .withMessage('Invalid Destination Location ID format'),
  body('distanceKm')
    .notEmpty()
    .withMessage('Distance in km is required')
    .isFloat({ gt: 0 })
    .withMessage('Distance must be a number greater than 0')
    .toFloat(),
  body('estimatedTimeMinutes')
    .notEmpty()
    .withMessage('Estimated time is required')
    .isInt({ gt: 0 })
    .withMessage('Estimated time must be an integer greater than 0')
    .toInt(),
  body('routePath')
    .optional()
    .isArray()
    .withMessage('Route path must be an array of coordinates'),
  body('routePath.*.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  body('routePath.*.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
];

const adminCreateLocationValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Location name is required'),
  body('area')
    .trim()
    .notEmpty()
    .withMessage('Area name is required'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City name cannot be empty'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
  body('landmark')
    .optional()
    .trim(),
];

const mongoIdParamValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID parameter is required')
    .isMongoId()
    .withMessage('Invalid ID format'),
];

const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer >= 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  query('search')
    .optional()
    .trim(),
];

module.exports = {
  searchRouteValidator,
  compareRouteValidator,
  saveRouteValidator,
  adminCreateRouteValidator,
  adminCreateLocationValidator,
  mongoIdParamValidator,
  paginationValidator,
};
