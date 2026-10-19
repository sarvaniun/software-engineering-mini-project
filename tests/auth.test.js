process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');
const { hashPassword } = require('../src/utils/password');

let hash;
beforeAll(async () => {
  hash = await hashPassword('Student@123');
});
beforeEach(() => db.query.mockReset());

const fakeUserRow = () => [[{
  id: 7, username: 'PES2UG24CS001', password_hash: hash, role: 'student', full_name: 'Aarav Sharma',
}]];

describe('POST /api/login (SRSF-001, TC1)', () => {
  it('returns a token and role for correct credentials', async () => {
    db.query.mockResolvedValue(fakeUserRow());
    const res = await request(app).post('/api/login')
      .send({ username: 'PES2UG24CS001', password: 'Student@123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe('student');
    expect(jwt.verify(res.body.token, 'test-secret')).toMatchObject({ id: 7, role: 'student' });
  });

  it('returns 401 for a wrong password', async () => {
    db.query.mockResolvedValue(fakeUserRow());
    const res = await request(app).post('/api/login')
      .send({ username: 'PES2UG24CS001', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for an unknown user', async () => {
    db.query.mockResolvedValue([[]]);
    const res = await request(app).post('/api/login')
      .send({ username: 'nobody', password: 'x' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when a field is missing', async () => {
    const res = await request(app).post('/api/login').send({ username: 'admin' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('MISSING_FIELDS');
  });
});

describe('verifyToken via GET /api/whoami', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/whoami');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with a forged token', async () => {
    const forged = jwt.sign({ id: 1, role: 'admin' }, 'not-the-real-secret');
    const res = await request(app).get('/api/whoami').set('Authorization', `Bearer ${forged}`);
    expect(res.statusCode).toBe(401);
  });

  it('returns the user with a valid token', async () => {
    const token = jwt.sign({ id: 1, role: 'admin', name: 'Admin Office' }, 'test-secret');
    const res = await request(app).get('/api/whoami').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });
});
