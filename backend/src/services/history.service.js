const historyRepository = require('../repositories/history.repository');

class HistoryService {
  async getUserHistory(userId) {
    return await historyRepository.findByUserId(userId);
  }

  async deleteHistoryItem(id, userId) {
    const history = await historyRepository.findById(id);
    if (!history) {
      const error = new Error('History record not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (history.userId && history.userId.toString() !== userId.toString()) {
      const error = new Error('Unauthorized to delete this history record');
      error.statusCode = 403;
      throw error;
    }

    return await historyRepository.deleteById(id);
  }
}

module.exports = new HistoryService();
