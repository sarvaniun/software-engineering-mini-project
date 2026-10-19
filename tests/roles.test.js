process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const app = require('../src/app');
const { requireRole } = require('../src/middleware/auth');

// Runs a middleware with a fake logged-in user and returns the error it passes on (if any)
function run(middleware, user) {
  return new Promise((resolve) => {
    middleware({ user }, {}, (err) => resolve(err));
  });
}

describe('requireRole (SRSSR-003)', () => {
  it('blocks a student from an admin-only action (403)', async () => {
    const err = await run(requireRole('admin'), { id: 1, role: 'student' });
    expect(err.status).toBe(403);
  });

  it('blocks faculty from an admin-only action (403)', async () => {
    const err = await run(requireRole('admin'), { id: 2, role: 'faculty' });
    expect(err.status).toBe(403);
  });

  it('blocks admin from a faculty-only action (403)', async () => {
    const err = await run(requireRole('faculty'), { id: 3, role: 'admin' });
    expect(err.status).toBe(403);
  });

  it('lets an allowed role through', async () => {
    const err = await run(requireRole('admin'), { id: 3, role: 'admin' });
    expect(err).toBeUndefined();
  });

  it('supports several allowed roles', async () => {
    const err = await run(requireRole('admin', 'faculty'), { id: 2, role: 'faculty' });
    expect(err).toBeUndefined();
  });

  it('returns 401 if nobody is logged in', async () => {
    const err = await run(requireRole('admin'), undefined);
    expect(err.status).toBe(401);
  });
});

describe('global login safety net', () => {
  it('rejects an /api route without a token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.statusCode).toBe(401);
  });

  it('still allows /api/health and /api/login without a token', async () => {
    expect((await request(app).get('/api/health')).statusCode).toBe(200);
    const res = await request(app).post('/api/login').send({});
    expect(res.statusCode).toBe(400); // reached the login route (missing fields), not blocked
  });
});
