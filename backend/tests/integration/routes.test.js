require('dotenv').config();
jest.setTimeout(20000);
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const TransportStop = require('../../src/models/TransportStop');
const RouteSegment = require('../../src/models/RouteSegment');
const TransitRoute = require('../../src/models/TransitRoute');
const User = require('../../src/models/User');
const TravelHistory = require('../../src/models/TravelHistory');
const RouteCache = require('../../src/models/RouteCache');

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/hubli_dharwad_transit_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await TransportStop.deleteMany({});
    await RouteSegment.deleteMany({});
    await TransitRoute.deleteMany({});
    await User.deleteMany({});
    await TravelHistory.deleteMany({});
    await RouteCache.deleteMany({});
    await mongoose.disconnect();
  }
});

describe('Route Searching and Comparison Endpoints', () => {
  let sourceLoc, destLoc, testUser, userToken;

  beforeEach(async () => {
    // Clear data
    await TransportStop.deleteMany({});
    await RouteSegment.deleteMany({});
    await TransitRoute.deleteMany({});
    await User.deleteMany({});
    await TravelHistory.deleteMany({});
    await RouteCache.deleteMany({});

    // Seed test user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Srujan Route Test',
        email: 'srujantest@gmail.com',
        password: 'Password@123',
      });
    userToken = regRes.body.data.token;
    testUser = regRes.body.data.user;

    // Seed stops in TransportStop
    sourceLoc = await TransportStop.create({
      code: 'HUBLI_RAILWAY_STATION_TEST',
      name: 'Hubli Railway Station Test',
      city: 'Hubballi',
      stopTypes: ['BUS_STOP'],
      location: { type: 'Point', coordinates: [75.1478, 15.3524] },
      active: true,
    });

    destLoc = await TransportStop.create({
      code: 'BVB_COLLEGE_TEST',
      name: 'BVB College Test',
      city: 'Hubballi',
      stopTypes: ['BUS_STOP'],
      location: { type: 'Point', coordinates: [75.1228, 15.3715] },
      active: true,
    });

    // Seed route segments (fromStop, toStop, mode, distanceKm, durationMinutes, fare)
    // We seed a bus segment and a cab segment (longer distance fallback)
    await RouteSegment.create({
      fromStop: sourceLoc._id,
      toStop: destLoc._id,
      mode: 'CITY_BUS',
      distanceKm: 5,
      durationMinutes: 10,
      fare: 20,
      active: true
    });
    
    await RouteSegment.create({
      fromStop: destLoc._id,
      toStop: sourceLoc._id,
      mode: 'CITY_BUS',
      distanceKm: 5,
      durationMinutes: 10,
      fare: 20,
      active: true
    });

    await RouteSegment.create({
      fromStop: sourceLoc._id,
      toStop: destLoc._id,
      mode: 'CAB',
      distanceKm: 5,
      durationMinutes: 6,
      fare: 125,
      active: true
    });

    await RouteSegment.create({
      fromStop: destLoc._id,
      toStop: sourceLoc._id,
      mode: 'CAB',
      distanceKm: 5,
      durationMinutes: 6,
      fare: 125,
      active: true
    });
  });

  test('POST /api/routes/search - Should search route and calculate fares correctly', async () => {
    const res = await request(app)
      .post('/api/routes/search')
      .send({
        source: 'Hubli Railway Station Test',
        destination: 'BVB College Test',
      })
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe('Hubli Railway Station Test');
    expect(res.body.data.destination).toBe('BVB College Test');
    expect(res.body.data.distanceKm).toBe(5);

    const transports = res.body.data.transportOptions;
    const busOpt = transports.find((t) => t.type === 'Bus');
    const cabOpt = transports.find((t) => t.type === 'Cab');

    expect(busOpt).toBeDefined();
    expect(busOpt.fare).toBe(20);
    
    expect(cabOpt).toBeDefined();
    expect(cabOpt.fare).toBe(125);

    // Travel History should be logged for the user
    const history = await TravelHistory.find({ userId: testUser._id });
    expect(history.length).toBe(1);
    expect(history[0].estimatedDistance).toBe(5);
  });

  test('POST /api/routes/search - Should fail for non-existent source location', async () => {
    const res = await request(app)
      .post('/api/routes/search')
      .send({
        source: 'Non Existent Location',
        destination: 'BVB College Test',
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/routes/compare - Should compare travel modes and categorize them', async () => {
    const res = await request(app)
      .get('/api/routes/compare')
      .query({
        source: 'Hubli Railway Station Test',
        destination: 'BVB College Test',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    const { cheapest, fastest, balanced } = res.body.data;
    
    expect(cheapest.type).toBe('Bus');
    expect(fastest.type).toBe('Cab');
    expect(balanced).toBeDefined();
  });
});
