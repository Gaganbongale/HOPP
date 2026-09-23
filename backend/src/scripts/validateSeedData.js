const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const seedsDir = path.join(__dirname, '..', '..', 'seeds');

const readSeed = (filename) => {
  const filePath = path.join(seedsDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const validateSeedData = () => {
  logger.info('Starting seed data validation...');

  const operators = readSeed('operators.seed.json');
  const stops = readSeed('stops.seed.json');
  const landmarks = readSeed('landmarks.seed.json');
  const routes = readSeed('routes.seed.json');
  const segments = readSeed('routeSegments.seed.json');
  const fares = readSeed('fares.seed.json');
  const users = readSeed('users.seed.json');

  // Check unique constraints
  const assertUnique = (items, field, filename) => {
    const seen = new Set();
    for (const item of items) {
      const val = item[field];
      if (!val) {
        throw new Error(`Validation Error in ${filename}: Missing field "${field}"`);
      }
      if (seen.has(val)) {
        throw new Error(`Validation Error in ${filename}: Duplicate value "${val}" for field "${field}"`);
      }
      seen.add(val);
    }
  };

  assertUnique(operators, 'code', 'operators.seed.json');
  assertUnique(stops, 'code', 'stops.seed.json');
  assertUnique(landmarks, 'code', 'landmarks.seed.json');
  assertUnique(fares, 'code', 'fares.seed.json');

  const operatorCodes = new Set(operators.map((o) => o.code));
  const stopCodes = new Set(stops.map((s) => s.code));

  // Validate references
  for (const landmark of landmarks) {
    if (!landmark.name || !landmark.code) {
      throw new Error(`Validation Error in landmarks.seed.json: Missing name/code in ${JSON.stringify(landmark)}`);
    }
    if (landmark.nearbyStopCodes) {
      for (const stopCode of landmark.nearbyStopCodes) {
        if (!stopCodes.has(stopCode)) {
          throw new Error(`Validation Error in landmarks.seed.json: Landmark ${landmark.code} references non-existent stop ${stopCode}`);
        }
      }
    }
  }

  for (const route of routes) {
    if (!route.routeNumber || !route.name || !route.operatorCode) {
      throw new Error(`Validation Error in routes.seed.json: Missing routeNumber, name or operatorCode`);
    }
    if (!operatorCodes.has(route.operatorCode)) {
      throw new Error(`Validation Error in routes.seed.json: Route ${route.routeNumber} references non-existent operator ${route.operatorCode}`);
    }
    if (route.stopCodes) {
      for (const stopCode of route.stopCodes) {
        if (!stopCodes.has(stopCode)) {
          throw new Error(`Validation Error in routes.seed.json: Route ${route.routeNumber} references non-existent stop ${stopCode}`);
        }
      }
    }
  }

  for (const segment of segments) {
    if (!segment.fromStopCode || !segment.toStopCode || !segment.mode) {
      throw new Error(`Validation Error in routeSegments.seed.json: Missing fromStopCode, toStopCode or mode`);
    }
    if (!stopCodes.has(segment.fromStopCode)) {
      throw new Error(`Validation Error in routeSegments.seed.json: Segment references non-existent fromStop ${segment.fromStopCode}`);
    }
    if (!stopCodes.has(segment.toStopCode)) {
      throw new Error(`Validation Error in routeSegments.seed.json: Segment references non-existent toStop ${segment.toStopCode}`);
    }
  }

  for (const fare of fares) {
    if (!fare.code || !fare.mode) {
      throw new Error(`Validation Error in fares.seed.json: Missing code or mode`);
    }
    if (fare.fromStopCode && !stopCodes.has(fare.fromStopCode)) {
      throw new Error(`Validation Error in fares.seed.json: Fare references non-existent fromStop ${fare.fromStopCode}`);
    }
    if (fare.toStopCode && !stopCodes.has(fare.toStopCode)) {
      throw new Error(`Validation Error in fares.seed.json: Fare references non-existent toStop ${fare.toStopCode}`);
    }
    if (fare.operatorCode && !operatorCodes.has(fare.operatorCode)) {
      throw new Error(`Validation Error in fares.seed.json: Fare references non-existent operator ${fare.operatorCode}`);
    }
  }

  logger.info('Seed data validation successful. No schema or reference issues found.');
  return { operators, stops, landmarks, routes, segments, fares, users };
};

module.exports = validateSeedData;
