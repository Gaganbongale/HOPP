require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../src/utils/logger');
const User = require('../src/models/User');
const TransportOperator = require('../src/models/TransportOperator');
const TransportStop = require('../src/models/TransportStop');
const Landmark = require('../src/models/Landmark');
const TransitRoute = require('../src/models/TransitRoute');
const RouteSegment = require('../src/models/RouteSegment');
const FareRule = require('../src/models/FareRule');

const readSeed = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));

const seeds = {
  operators: readSeed('operators.seed.json'),
  stops: readSeed('stops.seed.json'),
  landmarks: readSeed('landmarks.seed.json'),
  routes: readSeed('routes.seed.json'),
  segments: readSeed('routeSegments.seed.json'),
  fares: readSeed('fares.seed.json'),
  users: readSeed('users.seed.json'),
};

const assertUnique = (items, field, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item[field] || seen.has(item[field])) {
      throw new Error(`${label} contains a missing or duplicate ${field}: ${item[field]}`);
    }
    seen.add(item[field]);
  }
};

const validateReferences = () => {
  assertUnique(seeds.operators, 'code', 'operators.seed.json');
  assertUnique(seeds.stops, 'code', 'stops.seed.json');
  assertUnique(seeds.landmarks, 'code', 'landmarks.seed.json');
  assertUnique(seeds.fares, 'code', 'fares.seed.json');

  const stopCodes = new Set(seeds.stops.map((item) => item.code));
  const operatorCodes = new Set(seeds.operators.map((item) => item.code));
  const requireStop = (code, context) => {
    if (code && !stopCodes.has(code)) throw new Error(`${context} references unknown stop ${code}`);
  };
  const requireOperator = (code, context) => {
    if (code && !operatorCodes.has(code)) throw new Error(`${context} references unknown operator ${code}`);
  };

  for (const landmark of seeds.landmarks) {
    landmark.nearbyStopCodes.forEach((code) => requireStop(code, `Landmark ${landmark.code}`));
  }
  for (const route of seeds.routes) {
    requireOperator(route.operatorCode, `Route ${route.routeNumber}`);
    route.stopCodes.forEach((code) => requireStop(code, `Route ${route.routeNumber}`));
  }
  for (const segment of seeds.segments) {
    requireStop(segment.fromStopCode, 'Route segment');
    requireStop(segment.toStopCode, 'Route segment');
  }
  for (const fare of seeds.fares) {
    requireOperator(fare.operatorCode, `Fare ${fare.code}`);
    requireStop(fare.fromStopCode, `Fare ${fare.code}`);
    requireStop(fare.toStopCode, `Fare ${fare.code}`);
  }
};

const upsertMany = async (Model, items, key, session) => {
  if (!items.length) return;
  await Model.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: key(item),
        update: { $set: item },
        upsert: true,
      },
    })),
    { ordered: true, session }
  );
};

const seedUsers = async (session) => {
  for (const user of seeds.users) {
    const existing = await User.findOne({ email: user.email }).session(session || null);
    if (existing) {
      existing.name = user.name;
      existing.role = user.role;
      await existing.save({ session });
    } else {
      await User.create([user], { session });
    }
  }
};

const seedAll = async (session) => {
  await upsertMany(TransportOperator, seeds.operators, (item) => ({ code: item.code }), session);
  await upsertMany(TransportStop, seeds.stops, (item) => ({ code: item.code }), session);

  const operators = await TransportOperator.find({ code: { $in: seeds.operators.map((item) => item.code) } }).session(session || null);
  const stops = await TransportStop.find({ code: { $in: seeds.stops.map((item) => item.code) } }).session(session || null);
  const operatorId = new Map(operators.map((item) => [item.code, item._id]));
  const stopId = new Map(stops.map((item) => [item.code, item._id]));

  const landmarks = seeds.landmarks.map(({ nearbyStopCodes, ...item }) => ({
    ...item,
    nearbyStops: nearbyStopCodes.map((code) => stopId.get(code)),
  }));
  await upsertMany(Landmark, landmarks, (item) => ({ code: item.code }), session);

  const routes = seeds.routes.map(({ operatorCode, stopCodes, ...item }) => ({
    ...item,
    operator: operatorId.get(operatorCode),
    stops: stopCodes.map((code, sequence) => ({ stop: stopId.get(code), sequence })),
  }));
  await upsertMany(
    TransitRoute,
    routes,
    (item) => ({ routeNumber: item.routeNumber, operator: item.operator, direction: item.direction }),
    session
  );

  const routeDocs = await TransitRoute.find({
    routeNumber: { $in: routes.map((item) => item.routeNumber) },
  }).session(session || null);
  const routeByNumber = new Map(routeDocs.map((item) => [item.routeNumber, item._id]));

  const segments = seeds.segments.map(({ fromStopCode, toStopCode, routeNumber, operatorCode, ...item }) => ({
    ...item,
    fromStop: stopId.get(fromStopCode),
    toStop: stopId.get(toStopCode),
    route: routeNumber ? routeByNumber.get(routeNumber) : null,
    operator: operatorCode ? operatorId.get(operatorCode) : null,
  }));
  await upsertMany(
    RouteSegment,
    segments,
    (item) => ({ fromStop: item.fromStop, toStop: item.toStop, mode: item.mode, route: item.route }),
    session
  );

  const fares = seeds.fares.map(({ operatorCode, fromStopCode, toStopCode, ...item }) => ({
    ...item,
    operator: operatorCode ? operatorId.get(operatorCode) : null,
    fromStop: fromStopCode ? stopId.get(fromStopCode) : null,
    toStop: toStopCode ? stopId.get(toStopCode) : null,
  }));
  await upsertMany(FareRule, fares, (item) => ({ code: item.code }), session);
  const includeUsers = !process.argv.includes('--transit-only');
  if (includeUsers) await seedUsers(session);

  logger.info(
    `Seeded ${operators.length} operators, ${stops.length} stops, ${landmarks.length} landmarks, ` +
      `${routes.length} routes, ${segments.length} segments, ${fares.length} fare rules` +
      (includeUsers ? `, and ${seeds.users.length} users.` : ' (users skipped).')
  );
};

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hubli_dharwad_transit';
  validateReferences();
  await mongoose.connect(uri);
  logger.info('Connected to MongoDB for normalized transit seeding.');

  const useTransactions = process.env.SEED_USE_TRANSACTIONS === 'true';
  if (useTransactions) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => seedAll(session));
    } finally {
      await session.endSession();
    }
  } else {
    await seedAll();
  }
};

run()
  .then(async () => {
    logger.info('Normalized transit seed completed successfully.');
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    logger.error(`Normalized transit seed failed: ${error.message}`);
    logger.error(error.stack);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
