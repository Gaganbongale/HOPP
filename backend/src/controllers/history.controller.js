const historyService = require('../services/history.service');
const { sendSuccess } = require('../utils/responseFormatter');

class HistoryController {
  async getHistory(req, res, next) {
    try {
      const history = await historyService.getUserHistory(req.user._id);
      return res.status(200).json(
        sendSuccess(history, 'Travel history retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteHistory(req, res, next) {
    try {
      const deleted = await historyService.deleteHistoryItem(req.params.id, req.user._id);
      return res.status(200).json(
        sendSuccess(deleted, 'History record deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HistoryController();
