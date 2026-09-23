require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');

beforeAll(async () => {
  // Use a dedicated test database
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/hubli_dharwad_transit_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testUri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await mongoose.disconnect();
  }
});

describe('Auth Endpoints', () => {
  const userData = {
    name: 'Srujan Test',
    email: 'testuser@gmail.com',
    password: 'Password@123',
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('POST /api/auth/register - Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(userData.email);
    expect(res.body.data.user.password).toBeUndefined(); // Password must be excluded
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/register - Should fail on weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...userData,
        password: '123',
      });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('password');
  });

  test('POST /api/auth/login - Should login successfully with correct credentials', async () => {
    // First, register
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(userData.email);
  });

  test('POST /api/auth/login - Should fail with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'WrongPassword@123',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/profile - Should retrieve user profile when authenticated', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(userData.email);
    expect(res.body.data.name).toBe(userData.name);
  });

  test('GET /api/auth/profile - Should reject request if token is missing', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
