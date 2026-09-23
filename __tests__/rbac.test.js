const request = require('supertest');
const app = require('../app');
const { User, Sport } = require('../models');
const { cleanDatabase, closeDatabase } = require('./setup');

describe('Role-Based Access Control (RBAC) Suite', () => {
  let playerAgent;
  let adminAgent;

  beforeEach(async () => {
    await cleanDatabase();

    await User.create({
      first_name: 'Player',
      email: 'player@test.com',
      password: 'password123',
      role: 'player'
    });

    await User.create({
      first_name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    await Sport.create({
      title: 'Basketball',
      description: 'Court sport'
    });

    playerAgent = request.agent(app);
    await playerAgent
      .post('/login')
      .type('form')
      .send({ email: 'player@test.com', password: 'password123' });

    adminAgent = request.agent(app);
    await adminAgent
      .post('/login')
      .type('form')
      .send({ email: 'admin@test.com', password: 'password123' });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should redirect unauthenticated guest accessing /sessions to /login', async () => {
    const res = await request(app).get('/sessions');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  it('should reject a player accessing admin sport creation (/sports/new) with 403', async () => {
    const res = await playerAgent.get('/sports/new');
    expect(res.status).toBe(403);
  });

  it('should reject a player accessing admin reports (/reports) with 403', async () => {
    const res = await playerAgent.get('/reports');
    expect(res.status).toBe(403);
  });

  it('should allow admin to access sports management (/sports)', async () => {
    const res = await adminAgent.get('/sports');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sports Management');
  });

  it('should allow admin to access reports (/reports)', async () => {
    const res = await adminAgent.get('/reports');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Administrative Reports');
  });

  it('should reject admin attempting to create a player match session (/sessions/new) with 403', async () => {
    const res = await adminAgent.get('/sessions/new');
    expect(res.status).toBe(403);
  });
});
