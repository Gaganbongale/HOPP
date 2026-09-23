const savedRouteService = require('../services/savedRoute.service');
const { sendSuccess } = require('../utils/responseFormatter');

class SavedRouteController {
  async saveRoute(req, res, next) {
    try {
      const { routeId, nickname } = req.body;
      const savedRoute = await savedRouteService.saveRoute(req.user._id, routeId, nickname);
      return res.status(201).json(
        sendSuccess(savedRoute, 'Route saved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getSavedRoutes(req, res, next) {
    try {
      const savedRoutes = await savedRouteService.getUserSavedRoutes(req.user._id);
      return res.status(200).json(
        sendSuccess(savedRoutes, 'Saved routes retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteSavedRoute(req, res, next) {
    try {
      const deleted = await savedRouteService.deleteSavedRoute(req.params.id, req.user._id);
      return res.status(200).json(
        sendSuccess(deleted, 'Saved route deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SavedRouteController();
