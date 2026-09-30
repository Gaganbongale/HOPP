const mongoose = require('mongoose');
const logger = require('../utils/logger');

// We require the models dynamically to ensure they register schemas
const TransportStop = require('../models/TransportStop');
const TransitRoute = require('../models/TransitRoute');
const Landmark = require('../models/Landmark');
const RouteSegment = require('../models/RouteSegment');
const FareRule = require('../models/FareRule');
const RouteCache = require('../models/RouteCache');

const buildIndexes = async () => {
  try {
    logger.info('Ensuring database indexes are created...');

    // Stops: code (stopId), name, location
    await TransportStop.collection.createIndex({ code: 1 }, { unique: true });
    await TransportStop.collection.createIndex({ name: 1 });
    await TransportStop.collection.createIndex({ location: '2dsphere' }, { sparse: true });

    // Routes: routeNumber (routeId), operator
    await TransitRoute.collection.createIndex({ routeNumber: 1 });
    await TransitRoute.collection.createIndex({ operator: 1 });

    // Landmarks: name, categories (category)
    await Landmark.collection.createIndex({ name: 1 });
    await Landmark.collection.createIndex({ categories: 1 });
    await Landmark.collection.createIndex({ location: '2dsphere' });

    // Graph (RouteSegment): fromStop, toStop
    await RouteSegment.collection.createIndex({ fromStop: 1 });
    await RouteSegment.collection.createIndex({ toStop: 1 });
    await RouteSegment.collection.createIndex({ fromStop: 1, toStop: 1 });

    // Fare Rules: route (sparse), fromStop, toStop
    await FareRule.collection.createIndex({ route: 1 }, { sparse: true });
    await FareRule.collection.createIndex({ fromStop: 1, toStop: 1 });
    await FareRule.collection.createIndex({ mode: 1, ruleType: 1 });

    // Route Cache: sourceStop, destinationStop, preference
    await RouteCache.collection.createIndex({ sourceStop: 1, destinationStop: 1, preference: 1 });

    logger.info('All database indexes verified and built successfully.');
  } catch (error) {
    logger.error(`Error building database indexes: ${error.message}`);
  }
};

module.exports = buildIndexes;
