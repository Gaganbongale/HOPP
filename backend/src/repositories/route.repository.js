const Route = require('../models/Route');

class RouteRepository {
  async create(routeData) {
    return await Route.create(routeData);
  }

  async findById(id) {
    return await Route.findById(id)
      .populate('sourceLocation')
      .populate('destinationLocation')
      .populate('availableTransports.transportId');
  }

  async findBySourceAndDestination(sourceId, destinationId) {
    return await Route.findOne({
      sourceLocation: sourceId,
      destinationLocation: destinationId,
      active: true,
    })
      .populate('sourceLocation')
      .populate('destinationLocation')
      .populate('availableTransports.transportId');
  }

  async findAll() {
    return await Route.find()
      .populate('sourceLocation')
      .populate('destinationLocation')
      .populate('availableTransports.transportId');
  }

  async updateById(id, updateData) {
    return await Route.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return await Route.findByIdAndDelete(id);
  }

  async countAll() {
    return await Route.countDocuments();
  }
}

module.exports = new RouteRepository();
