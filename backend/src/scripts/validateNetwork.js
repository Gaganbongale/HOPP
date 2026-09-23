require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const connectDB = require('../database/connection');

// Models
const TransportStop = require('../models/TransportStop');
const TransitRoute = require('../models/TransitRoute');
const RouteSegment = require('../models/RouteSegment');

const validateNetwork = async () => {
  try {
    logger.info('Starting Network Integrity Validation...');

    // Connect to database
    await connectDB();

    const stops = await TransportStop.find({});
    const routes = await TransitRoute.find({});
    const segments = await RouteSegment.find({});

    const stopIdSet = new Set(stops.map((s) => s._id.toString()));
    const stopNames = new Map(stops.map((s) => [s._id.toString(), s.name]));

    const connectedStops = new Set();
    const orphanSegments = [];
    let brokenRefs = 0;

    // 1. Verify every segment references valid stops and has distance
    for (const seg of segments) {
      const fromId = seg.fromStop?.toString();
      const toId = seg.toStop?.toString();

      if (!fromId || !toId || !seg.distanceKm) {
        logger.error(`Network Validation Error: Segment ${seg._id} is missing fromStop, toStop, or distance.`);
        brokenRefs++;
        continue;
      }

      if (!stopIdSet.has(fromId)) {
        logger.error(`Network Validation Error: Segment ${seg._id} references non-existent fromStop ID ${fromId}`);
        brokenRefs++;
        orphanSegments.push(seg);
        continue;
      }

      if (!stopIdSet.has(toId)) {
        logger.error(`Network Validation Error: Segment ${seg._id} references non-existent toStop ID ${toId}`);
        brokenRefs++;
        orphanSegments.push(seg);
        continue;
      }

      connectedStops.add(fromId);
      connectedStops.add(toId);
    }

    // 2. Verify every route references valid stops
    for (const route of routes) {
      if (!route.stops || route.stops.length < 2) {
        logger.error(`Network Validation Error: Route ${route.routeNumber} has insufficient stops (< 2)`);
        brokenRefs++;
        continue;
      }

      for (const routeStop of route.stops) {
        const stopId = routeStop.stop?.toString();
        if (!stopId || !stopIdSet.has(stopId)) {
          logger.error(`Network Validation Error: Route ${route.routeNumber} references non-existent stop ID ${stopId}`);
          brokenRefs++;
        }
      }
    }

    // 3. Find isolated stops (stops with no outgoing/incoming segments and not on any route)
    const isolatedStops = [];
    for (const stop of stops) {
      const id = stop._id.toString();
      if (!connectedStops.has(id)) {
        // Double check if it is part of route stops
        let inRoute = false;
        for (const route of routes) {
          if (route.stops.some((s) => s.stop?.toString() === id)) {
            inRoute = true;
            break;
          }
        }
        if (!inRoute) {
          isolatedStops.push(stop);
        }
      }
    }

    // Output Validation Report
    logger.info('====================================================');
    logger.info('NETWORK INTEGRITY VALIDATION REPORT');
    logger.info('====================================================');
    logger.info(`Total Stops Checked:      ${stops.length}`);
    logger.info(`Total Routes Checked:     ${routes.length}`);
    logger.info(`Total Segments Checked:   ${segments.length}`);
    logger.info(`Connected Network Stops:  ${connectedStops.size}`);
    logger.info(`Isolated Stops Detected:  ${isolatedStops.length}`);
    logger.info(`Orphan Segments Detected: ${orphanSegments.length}`);
    logger.info(`Total Broken References:  ${brokenRefs}`);
    logger.info('====================================================');

    if (isolatedStops.length > 0) {
      logger.warn('Warning: Isolated stops detected (stops with no connected segments or routes):');
      isolatedStops.forEach((s) => logger.warn(` - ${s.name} (${s.code})`));
    }

    if (brokenRefs > 0 || orphanSegments.length > 0) {
      throw new Error(`Network validation failed with ${brokenRefs} broken references and ${orphanSegments.length} orphan segments.`);
    }

    logger.info('Network validation completed successfully. Graph topology is sound.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Network validation failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

if (require.main === module) {
  validateNetwork();
}
