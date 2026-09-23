const path = require('path');
const TransportOperator = require('../../src/models/TransportOperator');
const TransportStop = require('../../src/models/TransportStop');
const Landmark = require('../../src/models/Landmark');
const TransitRoute = require('../../src/models/TransitRoute');
const RouteSegment = require('../../src/models/RouteSegment');
const FareRule = require('../../src/models/FareRule');

const seed = (name) => require(path.join('../../seeds', name));

const operators = seed('operators.seed.json');
const stops = seed('stops.seed.json');
const landmarks = seed('landmarks.seed.json');
const routes = seed('routes.seed.json');
const segments = seed('routeSegments.seed.json');
const fares = seed('fares.seed.json');

const expectUnique = (items, field) => {
  const values = items.map((item) => item[field]);
  expect(new Set(values).size).toBe(values.length);
};

describe('normalized transit seed contract', () => {
  test('contains the complete normalized research seed set', () => {
    expect(operators).toHaveLength(4);
    expect(stops).toHaveLength(113);
    expect(landmarks).toHaveLength(30);
    expect(routes).toHaveLength(41);
    expect(segments).toHaveLength(208);
    expect(fares).toHaveLength(71);
  });

  test('uses unique stable identifiers', () => {
    expectUnique(operators, 'code');
    expectUnique(stops, 'code');
    expectUnique(landmarks, 'code');
    expectUnique(fares, 'code');
  });

  test('references only known stops and operators', () => {
    const stopCodes = new Set(stops.map((item) => item.code));
    const operatorCodes = new Set(operators.map((item) => item.code));

    for (const landmark of landmarks) {
      landmark.nearbyStopCodes.forEach((code) => expect(stopCodes.has(code)).toBe(true));
    }
    for (const route of routes) {
      expect(operatorCodes.has(route.operatorCode)).toBe(true);
      route.stopCodes.forEach((code) => expect(stopCodes.has(code)).toBe(true));
    }
    for (const segment of segments) {
      expect(stopCodes.has(segment.fromStopCode)).toBe(true);
      expect(stopCodes.has(segment.toStopCode)).toBe(true);
    }
    for (const fare of fares) {
      if (fare.operatorCode) expect(operatorCodes.has(fare.operatorCode)).toBe(true);
      if (fare.fromStopCode) expect(stopCodes.has(fare.fromStopCode)).toBe(true);
      if (fare.toStopCode) expect(stopCodes.has(fare.toStopCode)).toBe(true);
    }
  });

  test('passes Mongoose validation after reference resolution', async () => {
    const operatorIds = new Map(operators.map((item) => [item.code, new TransportOperator(item)._id]));
    const stopIds = new Map(stops.map((item) => [item.code, new TransportStop(item)._id]));

    for (const item of operators) await expect(new TransportOperator(item).validate()).resolves.toBeUndefined();
    for (const item of stops) await expect(new TransportStop(item).validate()).resolves.toBeUndefined();
    for (const { nearbyStopCodes, ...item } of landmarks) {
      await expect(
        new Landmark({ ...item, nearbyStops: nearbyStopCodes.map((code) => stopIds.get(code)) }).validate()
      ).resolves.toBeUndefined();
    }
    for (const { operatorCode, stopCodes, ...item } of routes) {
      await expect(
        new TransitRoute({
          ...item,
          operator: operatorIds.get(operatorCode),
          stops: stopCodes.map((code, sequence) => ({ stop: stopIds.get(code), sequence })),
        }).validate()
      ).resolves.toBeUndefined();
    }
    for (const { fromStopCode, toStopCode, ...item } of segments) {
      await expect(
        new RouteSegment({ ...item, fromStop: stopIds.get(fromStopCode), toStop: stopIds.get(toStopCode) }).validate()
      ).resolves.toBeUndefined();
    }
    for (const { operatorCode, fromStopCode, toStopCode, ...item } of fares) {
      await expect(
        new FareRule({
          ...item,
          operator: operatorCode ? operatorIds.get(operatorCode) : null,
          fromStop: fromStopCode ? stopIds.get(fromStopCode) : null,
          toStop: toStopCode ? stopIds.get(toStopCode) : null,
        }).validate()
      ).resolves.toBeUndefined();
    }
  });
});
