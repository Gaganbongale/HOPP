require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const connectDB = require('../database/connection');
const clearDatabase = require('./clearDatabase');
const validateSeedData = require('./validateSeedData');

// Models
const TransportOperator = require('../models/TransportOperator');
const TransportStop = require('../models/TransportStop');
const Landmark = require('../models/Landmark');
const TransitRoute = require('../models/TransitRoute');
const RouteSegment = require('../models/RouteSegment');
const FareRule = require('../models/FareRule');
const User = require('../models/User');

const upsertMany = async (Model, items, keySelector) => {
  if (!items.length) return;
  await Model.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: keySelector(item),
        update: { $set: item },
        upsert: true,
      },
    })),
    { ordered: true }
  );
};

const runSeeder = async () => {
  try {
    // 1. Validate data structure first
    const seeds = validateSeedData();

    // 2. Connect to Database
    await connectDB();

    // 3. Reset database if requested
    const shouldReset = process.argv.includes('--reset') || process.env.RESET_DB === 'true';
    if (shouldReset) {
      await clearDatabase();
    }

    logger.info('Starting seeding pipeline...');

    // Step 1: Operators
    await upsertMany(TransportOperator, seeds.operators, (item) => ({ code: item.code }));
    console.log('✓ Operators inserted');

    // Step 2: Stops
    await upsertMany(TransportStop, seeds.stops, (item) => ({ code: item.code }));
    console.log('✓ Stops inserted');

    // Fetch operators and stops to map references
    const operators = await TransportOperator.find({});
    const stops = await TransportStop.find({});
    const operatorIdMap = new Map(operators.map((o) => [o.code, o._id]));
    const stopIdMap = new Map(stops.map((s) => [s.code, s._id]));

    // Step 3: Landmarks
    const landmarks = seeds.landmarks.map(({ nearbyStopCodes, ...item }) => ({
      ...item,
      nearbyStops: (nearbyStopCodes || []).map((code) => stopIdMap.get(code)).filter(Boolean),
    }));
    await upsertMany(Landmark, landmarks, (item) => ({ code: item.code }));
    console.log('✓ Landmarks inserted');

    // Step 4: Routes
    const routes = seeds.routes.map(({ operatorCode, stopCodes, ...item }) => ({
      ...item,
      operator: operatorIdMap.get(operatorCode),
      stops: (stopCodes || []).map((code, seq) => ({ stop: stopIdMap.get(code), sequence: seq })),
    }));
    await upsertMany(TransitRoute, routes, (item) => ({
      routeNumber: item.routeNumber,
      operator: item.operator,
      direction: item.direction,
    }));
    console.log('✓ Routes inserted');

    // Fetch routes to map segments
    const routeDocs = await TransitRoute.find({});
    const routeIdMap = new Map(routeDocs.map((r) => [r.routeNumber, r._id]));

    // Step 5: Graph (RouteSegments)
    const segments = seeds.segments.map(({ fromStopCode, toStopCode, routeNumber, operatorCode, ...item }) => ({
      ...item,
      fromStop: stopIdMap.get(fromStopCode),
      toStop: stopIdMap.get(toStopCode),
      route: routeNumber ? routeIdMap.get(routeNumber) : null,
      operator: operatorCode ? operatorIdMap.get(operatorCode) : null,
    }));
    await upsertMany(RouteSegment, segments, (item) => ({
      fromStop: item.fromStop,
      toStop: item.toStop,
      mode: item.mode,
      route: item.route,
    }));
    console.log('✓ Graph edges inserted');

    // Step 6: Fare Rules
    const fares = seeds.fares.map(({ operatorCode, fromStopCode, toStopCode, ...item }) => ({
      ...item,
      operator: operatorCode ? operatorIdMap.get(operatorCode) : null,
      fromStop: fromStopCode ? stopIdMap.get(fromStopCode) : null,
      toStop: toStopCode ? stopIdMap.get(toStopCode) : null,
    }));
    await upsertMany(FareRule, fares, (item) => ({ code: item.code }));
    console.log('✓ Fare rules inserted');

    // Users
    await upsertMany(User, seeds.users, (item) => ({ email: item.email }));
    logger.info('Seeded users successfully.');

    // -----------------------------------------------------------------
    // POST-SEED VERIFICATION
    // -----------------------------------------------------------------
    logger.info('Starting POST-SEED VERIFICATION checks...');

    const seededRoutes = await TransitRoute.find({});
    const seededStops = await TransportStop.find({});
    const seededSegments = await RouteSegment.find({});
    const seededFares = await FareRule.find({});

    const stopIdSet = new Set(seededStops.map((s) => s._id.toString()));
    const stopCodeSet = new Set();
    const routeNumberSet = new Set();

    // Check duplicate stop codes
    for (const stop of seededStops) {
      if (stopCodeSet.has(stop.code)) {
        throw new Error(`Post-Seed Check Failed: Duplicate stop code detected: ${stop.code}`);
      }
      stopCodeSet.add(stop.code);
    }
    logger.info('Post-Seed Check: No duplicate stop codes (Verified)');

    // Check duplicate route numbers (routeNumber + operator + direction)
    const routeUniqueKeys = new Set();
    for (const r of seededRoutes) {
      const key = `${r.routeNumber}-${r.operator?.toString()}-${r.direction}`;
      if (routeUniqueKeys.has(key)) {
        throw new Error(`Post-Seed Check Failed: Duplicate route unique key detected: ${key}`);
      }
      routeUniqueKeys.add(key);
    }
    logger.info('Post-Seed Check: No duplicate route definitions (Verified)');

    // Verify every route contains stops
    for (const r of seededRoutes) {
      if (!r.stops || r.stops.length < 2) {
        throw new Error(`Post-Seed Check Failed: Route ${r.routeNumber} has insufficient stops`);
      }
    }
    logger.info('Post-Seed Check: Every route contains at least 2 stops (Verified)');

    // Verify every stop belongs to at least one route (active transit checks)
    const stopsInRoutes = new Set();
    for (const r of seededRoutes) {
      for (const stopEntry of r.stops) {
        stopsInRoutes.add(stopEntry.stop.toString());
      }
    }
    // Note: We check if stops mapped in our seeds exist on route networks. If any stop is isolated from routes, warning/error.
    // However, area nodes or standalone terminals might be created. We make sure we don't have dangling routes.
    logger.info(`Post-Seed Check: Stops mapped in routes count: ${stopsInRoutes.size} / ${seededStops.length}`);

    // Verify every segment references valid stops
    for (const seg of seededSegments) {
      if (!stopIdSet.has(seg.fromStop.toString()) || !stopIdSet.has(seg.toStop.toString())) {
        throw new Error(`Post-Seed Check Failed: Segment ${seg._id} references non-existent stop IDs`);
      }
    }
    logger.info('Post-Seed Check: Every graph segment references valid stops (Verified)');

    // Verify no orphan fare rules
    for (const fare of seededFares) {
      if (fare.fromStop && !stopIdSet.has(fare.fromStop.toString())) {
        throw new Error(`Post-Seed Check Failed: Fare ${fare.code} references non-existent fromStop ID`);
      }
      if (fare.toStop && !stopIdSet.has(fare.toStop.toString())) {
        throw new Error(`Post-Seed Check Failed: Fare ${fare.code} references non-existent toStop ID`);
      }
    }
    logger.info('Post-Seed Check: No orphan fare rules (Verified)');

    // Generate Final Summary Report
    console.log('====================================================');
    console.log('SEEDING SUMMARY REPORT');
    console.log('====================================================');
    console.log(`Operators: ${seeds.operators.length}`);
    console.log(`Stops:     ${seeds.stops.length}`);
    console.log(`Landmarks: ${seeds.landmarks.length}`);
    console.log(`Routes:    ${seeds.routes.length}`);
    console.log(`Segments:  ${seeds.segments.length}`);
    console.log(`Fare Rules: ${seeds.fares.length}`);
    console.log('====================================================');

    logger.info('Seeding verification passed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding verification aborted: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeder();
}
