const Transport = require('../models/Transport');

class TransportRepository {
  async create(transportData) {
    return await Transport.create(transportData);
  }

  async findByType(transportType) {
    return await Transport.findOne({ transportType, active: true });
  }

  async findAllActive() {
    return await Transport.find({ active: true });
  }

  async findById(id) {
    return await Transport.findById(id);
  }

  async countAll() {
    return await Transport.countDocuments();
  }
}

module.exports = new TransportRepository();
