const Location = require('../models/Location');

class LocationRepository {
  async create(locationData) {
    return await Location.create(locationData);
  }

  async findById(id) {
    return await Location.findById(id);
  }

  async findByName(name) {
    return await Location.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
  }

  async findAll({ page = 1, limit = 10, search = '' }) {
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skipIndex = (page - 1) * limit;

    const count = await Location.countDocuments(query);
    const locations = await Location.find(query)
      .sort({ name: 1 })
      .skip(skipIndex)
      .limit(limit);

    return {
      locations,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  }

  async updateById(id, updateData) {
    return await Location.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async softDelete(id) {
    return await Location.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }
}

module.exports = new LocationRepository();
