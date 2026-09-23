const locationRepository = require('../repositories/location.repository');

class LocationService {
  async getAllLocations({ page, limit, search }) {
    return await locationRepository.findAll({ page, limit, search });
  }

  async getLocationById(id) {
    const location = await locationRepository.findById(id);
    if (!location || !location.isActive) {
      const error = new Error('Location not found or inactive');
      error.statusCode = 404;
      throw error;
    }
    return location;
  }

  async createLocation(locationData) {
    const existing = await locationRepository.findByName(locationData.name);
    if (existing) {
      const error = new Error('Location with this name already exists');
      error.statusCode = 409;
      throw error;
    }
    return await locationRepository.create(locationData);
  }

  async updateLocation(id, updateData) {
    const location = await locationRepository.updateById(id, updateData);
    if (!location) {
      const error = new Error('Location not found');
      error.statusCode = 404;
      throw error;
    }
    return location;
  }

  async deleteLocation(id) {
    const location = await locationRepository.softDelete(id);
    if (!location) {
      const error = new Error('Location not found');
      error.statusCode = 404;
      throw error;
    }
    return location;
  }
}

module.exports = new LocationService();
