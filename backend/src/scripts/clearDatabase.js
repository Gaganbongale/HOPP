const logger = require('../utils/logger');
const TransportOperator = require('../models/TransportOperator');
const TransportStop = require('../models/TransportStop');
const Landmark = require('../models/Landmark');
const TransitRoute = require('../models/TransitRoute');
const RouteSegment = require('../models/RouteSegment');
const FareRule = require('../models/FareRule');
const User = require('../models/User');
const RouteCache = require('../models/RouteCache');
const Feedback = require('../models/Feedback');

const clearDatabase = async () => {
  logger.warn('Clearing existing transit data from MongoDB...');
  
  await TransportOperator.deleteMany({});
  logger.info('Cleared TransportOperators.');

  await TransportStop.deleteMany({});
  logger.info('Cleared TransportStops.');

  await Landmark.deleteMany({});
  logger.info('Cleared Landmarks.');

  await TransitRoute.deleteMany({});
  logger.info('Cleared TransitRoutes.');

  await RouteSegment.deleteMany({});
  logger.info('Cleared RouteSegments.');

  await FareRule.deleteMany({});
  logger.info('Cleared FareRules.');

  await User.deleteMany({});
  logger.info('Cleared Users.');

  await RouteCache.deleteMany({});
  logger.info('Cleared RouteCache.');

  await Feedback.deleteMany({});
  logger.info('Cleared Feedbacks.');

  logger.info('All target database collections cleared successfully.');
};

module.exports = clearDatabase;
