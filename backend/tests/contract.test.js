require('dotenv').config();
jest.setTimeout(20000);
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/database/connection');

describe('API Contract Compliance Tests (openapi.yaml)', () => {
  beforeAll(async () => {
    // Establish database connection
    await connectDB();
  });

  afterAll(async () => {
    // Disconnect database
    await mongoose.disconnect();
  });

  describe('GET /api/healthz', () => {
    it('should comply with HealthStatus schema', async () => {
      const res = await request(app)
        .get('/api/healthz')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      
      const data = res.body.data;
      expect(data).toHaveProperty('status');
      expect(typeof data.status).toBe('string');
      expect(data.status).toBe('healthy');
    });
  });

  describe('POST /api/routes/plan', () => {
    it('should comply with RoutePlanResult schema', async () => {
      const payload = {
        source: 'KLE Tech',
        destination: 'SDM Medical College',
        preference: 'balanced'
      };

      const res = await request(app)
        .post('/api/routes/plan')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      const data = res.body.data;
      expect(data).toHaveProperty('options');
      expect(Array.isArray(data.options)).toBe(true);
      expect(data).toHaveProperty('recommended_index');
      expect(typeof data.recommended_index).toBe('number');
      expect(data).toHaveProperty('analysis_time_ms');
      expect(typeof data.analysis_time_ms).toBe('number');
      expect(data).toHaveProperty('source_label');
      expect(data).toHaveProperty('destination_label');

      if (data.options.length > 0) {
        const opt = data.options[0];
        expect(opt).toHaveProperty('id');
        expect(opt).toHaveProperty('label');
        expect(opt).toHaveProperty('tag');
        expect(['fastest', 'cheapest', 'balanced']).toContain(opt.tag);
        expect(opt).toHaveProperty('duration_min');
        expect(typeof opt.duration_min).toBe('number');
        expect(opt).toHaveProperty('fare_inr');
        expect(typeof opt.fare_inr).toBe('number');
        expect(opt).toHaveProperty('transfers');
        expect(typeof opt.transfers).toBe('number');
        expect(opt).toHaveProperty('legs');
        expect(Array.isArray(opt.legs)).toBe(true);

        if (opt.legs.length > 0) {
          const leg = opt.legs[0];
          expect(leg).toHaveProperty('type');
          expect(['bus', 'walk', 'wait']).toContain(leg.type);
          expect(leg).toHaveProperty('description');
          expect(typeof leg.description).toBe('string');
          expect(leg).toHaveProperty('duration_min');
          expect(typeof leg.duration_min).toBe('number');
        }
      }
    });

    it('should reject requests with matching source and destination stops', async () => {
      const payload = {
        source: 'KLE Tech',
        destination: 'KLE Tech',
        preference: 'balanced'
      };

      const res = await request(app)
        .post('/api/routes/plan')
        .send(payload)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });

    it('should return 404 for unresolvable stops', async () => {
      const payload = {
        source: 'NonExistentStopABC',
        destination: 'KLE Tech',
        preference: 'balanced'
      };

      const res = await request(app)
        .post('/api/routes/plan')
        .send(payload)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/stops/search', () => {
    it('should comply with BusStop[] schema', async () => {
      const res = await request(app)
        .get('/api/stops/search')
        .query({ q: 'KLE' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const stop = res.body.data[0];
        expect(stop).toHaveProperty('id');
        expect(stop).toHaveProperty('name');
        expect(stop).toHaveProperty('type');
        expect(['stop', 'hub', 'terminal']).toContain(stop.type);
        expect(stop).toHaveProperty('city');
        expect(['Hubli', 'Dharwad']).toContain(stop.city);
        expect(stop).toHaveProperty('bus_lines');
        expect(Array.isArray(stop.bus_lines)).toBe(true);
      }
    });

    it('should return empty list for empty search query', async () => {
      const res = await request(app)
        .get('/api/stops/search')
        .query({ q: '' })
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/routes/popular', () => {
    it('should comply with PopularRoute[] schema', async () => {
      const res = await request(app)
        .get('/api/routes/popular')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const r = res.body.data[0];
        expect(r).toHaveProperty('source');
        expect(r).toHaveProperty('destination');
        expect(r).toHaveProperty('query_count');
        expect(typeof r.query_count).toBe('number');
      }
    });
  });

  describe('GET /api/network/stats', () => {
    it('should comply with NetworkStats schema', async () => {
      const res = await request(app)
        .get('/api/network/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      const stats = res.body.data;
      expect(stats).toHaveProperty('total_routes');
      expect(typeof stats.total_routes).toBe('number');
      expect(stats).toHaveProperty('total_stops');
      expect(typeof stats.total_stops).toBe('number');
      expect(stats).toHaveProperty('total_buses');
      expect(typeof stats.total_buses).toBe('number');
      expect(stats).toHaveProperty('cities_connected');
      expect(typeof stats.cities_connected).toBe('number');
      expect(stats).toHaveProperty('avg_fare_inr');
      expect(typeof stats.avg_fare_inr).toBe('number');
      expect(stats).toHaveProperty('avg_duration_min');
      expect(typeof stats.avg_duration_min).toBe('number');
      expect(stats).toHaveProperty('daily_passengers');
      expect(typeof stats.daily_passengers).toBe('number');
    });
  });

  describe('GET /api/network/nodes', () => {
    it('should comply with NetworkNode[] schema', async () => {
      const res = await request(app)
        .get('/api/network/nodes')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const node = res.body.data[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('type');
        expect(['stop', 'hub', 'terminal']).toContain(node.type);
        expect(node).toHaveProperty('x');
        expect(typeof node.x).toBe('number');
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThanOrEqual(1);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(1);
        expect(node).toHaveProperty('connections');
        expect(Array.isArray(node.connections)).toBe(true);
        expect(node).toHaveProperty('bus_lines');
        expect(Array.isArray(node.bus_lines)).toBe(true);
      }
    });
  });
});
