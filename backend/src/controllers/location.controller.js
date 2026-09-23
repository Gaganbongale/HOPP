const locationService = require('../services/location.service');
const { sendSuccess } = require('../utils/responseFormatter');

class LocationController {
  async getLocations(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const search = req.query.search || '';

      const data = await locationService.getAllLocations({ page, limit, search });
      return res.status(200).json(
        sendSuccess(data, 'Locations retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async getLocation(req, res, next) {
    try {
      const location = await locationService.getLocationById(req.params.id);
      return res.status(200).json(
        sendSuccess(location, 'Location retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async createLocation(req, res, next) {
    try {
      const location = await locationService.createLocation(req.body);
      return res.status(201).json(
        sendSuccess(location, 'Location created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const location = await locationService.updateLocation(req.params.id, req.body);
      return res.status(200).json(
        sendSuccess(location, 'Location updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteLocation(req, res, next) {
    try {
      const location = await locationService.deleteLocation(req.params.id);
      return res.status(200).json(
        sendSuccess(location, 'Location deleted successfully (soft delete)')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LocationController();
