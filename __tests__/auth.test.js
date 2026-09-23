const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { cleanDatabase, closeDatabase } = require('./setup');

describe('Authentication & Validation Suite', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /signup', () => {
    it('should reject registration if first_name is missing', async () => {
      const res = await request(app)
        .post('/signup')
        .type('form')
        .send({
          first_name: '',
          email: 'valid@example.com',
          password: 'password123',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/signup');

      const count = await User.count();
      expect(count).toBe(0);
    });

    it('should reject registration if email is invalid', async () => {
      const res = await request(app)
        .post('/signup')
        .type('form')
        .send({
          first_name: 'John',
          email: 'not-an-email',
          password: 'password123',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/signup');

      const count = await User.count();
      expect(count).toBe(0);
    });

    it('should reject registration if password is shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/signup')
        .type('form')
        .send({
          first_name: 'John',
          email: 'shortpass@example.com',
          password: '123',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/signup');

      const count = await User.count();
      expect(count).toBe(0);
    });

    it('should reject duplicate email registrations', async () => {
      await User.create({
        first_name: 'Original',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'player'
      });

      const res = await request(app)
        .post('/signup')
        .type('form')
        .send({
          first_name: 'Copycat',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/signup');

      const users = await User.findAll({ where: { email: 'duplicate@example.com' } });
      expect(users.length).toBe(1);
      expect(users[0].first_name).toBe('Original');
    });

    it('should successfully register a player and redirect to /sessions', async () => {
      const res = await request(app)
        .post('/signup')
        .type('form')
        .send({
          first_name: 'Jordan',
          last_name: 'Miller',
          email: 'jordan@example.com',
          password: 'strongpassword123',
          role: 'player'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sessions');

      const user = await User.findOne({ where: { email: 'jordan@example.com' } });
      expect(user).not.toBeNull();
      expect(user.first_name).toBe('Jordan');
      expect(user.role).toBe('player');
      expect(user.validPassword('strongpassword123')).toBe(true);
      expect(user.password).not.toBe('strongpassword123'); // Hashed with bcrypt
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await User.create({
        first_name: 'Active',
        last_name: 'Player',
        email: 'active@example.com',
        password: 'correctpassword',
        role: 'player'
      });
    });

    it('should fail login with wrong password and redirect to /login', async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({
          email: 'active@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should fail login for non-existent email and redirect to /login', async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({
          email: 'nobody@example.com',
          password: 'somepassword'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should succeed login with correct credentials and redirect to /sessions', async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({
          email: 'active@example.com',
          password: 'correctpassword'
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/sessions');
    });
  });
});
