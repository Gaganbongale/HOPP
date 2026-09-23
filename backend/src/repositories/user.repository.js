const User = require('../models/User');

class UserRepository {
  async create(userData) {
    return await User.create(userData);
  }

  async findByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findById(id) {
    return await User.findById(id);
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async incrementSavedRoutesCount(userId) {
    return await User.findByIdAndUpdate(
      userId,
      { $inc: { savedRoutesCount: 1 } },
      { new: true }
    );
  }

  async decrementSavedRoutesCount(userId) {
    return await User.findByIdAndUpdate(
      userId,
      { $inc: { savedRoutesCount: -1 } },
      { new: true }
    );
  }

  async countAll() {
    return await User.countDocuments();
  }
}

module.exports = new UserRepository();
