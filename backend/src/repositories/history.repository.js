const TravelHistory = require('../models/TravelHistory');

class HistoryRepository {
  async create(historyData) {
    const history = await TravelHistory.create(historyData);
    return await TravelHistory.findById(history._id)
      .populate('sourceLocation')
      .populate('destinationLocation');
  }

  async findByUserId(userId, limit = 10) {
    return await TravelHistory.find({ userId })
      .populate('sourceLocation')
      .populate('destinationLocation')
      .sort({ searchedAt: -1 })
      .limit(limit);
  }

  async findById(id) {
    return await TravelHistory.findById(id);
  }

  async deleteById(id) {
    return await TravelHistory.findByIdAndDelete(id);
  }

  async countAll() {
    return await TravelHistory.countDocuments();
  }

  async getPopularRoutes(limit = 5) {
    return await TravelHistory.aggregate([
      {
        $group: {
          _id: {
            sourceLocation: '$sourceLocation',
            destinationLocation: '$destinationLocation',
          },
          searchCount: { $sum: 1 },
        },
      },
      { $sort: { searchCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'transportstops',
          localField: '_id.sourceLocation',
          foreignField: '_id',
          as: 'source',
        },
      },
      {
        $lookup: {
          from: 'transportstops',
          localField: '_id.destinationLocation',
          foreignField: '_id',
          as: 'destination',
        },
      },
      { $unwind: '$source' },
      { $unwind: '$destination' },
      {
        $project: {
          _id: 0,
          source: 1,
          destination: 1,
          searchCount: 1,
        },
      },
    ]);
  }
}

module.exports = new HistoryRepository();
