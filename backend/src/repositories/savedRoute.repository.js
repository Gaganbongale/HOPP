const SavedRoute = require('../models/SavedRoute');

class SavedRouteRepository {
  async create(savedRouteData) {
    const savedRoute = await SavedRoute.create(savedRouteData);
    return await SavedRoute.findById(savedRoute._id).populate({
      path: 'routeId',
      populate: [
        { path: 'sourceLocation' },
        { path: 'destinationLocation' },
        { path: 'availableTransports.transportId' },
      ],
    });
  }

  async findByUserId(userId) {
    return await SavedRoute.find({ userId }).populate({
      path: 'routeId',
      populate: [
        { path: 'sourceLocation' },
        { path: 'destinationLocation' },
        { path: 'availableTransports.transportId' },
      ],
    });
  }

  async findById(id) {
    return await SavedRoute.findById(id);
  }

  async findByUserAndRoute(userId, routeId) {
    return await SavedRoute.findOne({ userId, routeId });
  }

  async deleteById(id) {
    return await SavedRoute.findByIdAndDelete(id);
  }
}

module.exports = new SavedRouteRepository();
