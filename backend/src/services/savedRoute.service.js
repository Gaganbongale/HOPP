const savedRouteRepository = require('../repositories/savedRoute.repository');
const routeRepository = require('../repositories/route.repository');
const userRepository = require('../repositories/user.repository');

class SavedRouteService {
  async saveRoute(userId, routeId, nickname) {
    const route = await routeRepository.findById(routeId);
    if (!route) {
      const error = new Error('Route not found');
      error.statusCode = 404;
      throw error;
    }

    const existing = await savedRouteRepository.findByUserAndRoute(userId, routeId);
    if (existing) {
      const error = new Error('Route is already saved');
      error.statusCode = 409;
      throw error;
    }

    const savedRoute = await savedRouteRepository.create({
      userId,
      routeId,
      nickname: nickname || '',
    });

    // Increment user's saved routes count
    await userRepository.incrementSavedRoutesCount(userId);

    return savedRoute;
  }

  async getUserSavedRoutes(userId) {
    return await savedRouteRepository.findByUserId(userId);
  }

  async deleteSavedRoute(id, userId) {
    const savedRoute = await savedRouteRepository.findById(id);
    if (!savedRoute) {
      const error = new Error('Saved route not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (savedRoute.userId.toString() !== userId.toString()) {
      const error = new Error('Unauthorized to delete this saved route');
      error.statusCode = 403;
      throw error;
    }

    const deleted = await savedRouteRepository.deleteById(id);
    
    // Decrement user's saved routes count
    await userRepository.decrementSavedRoutesCount(userId);

    return deleted;
  }
}

module.exports = new SavedRouteService();
