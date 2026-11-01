// SRS-NF-002 (#30): bad input never crashes the server; errors use { status, errorCode, message }
// and logs never contain passwords or tokens.
process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const token = jwt.sign({ id: 1, role: 'admin', name: 'Admin' }, 'test-secret');

function expectErrorShape(body) {
  expect(body).toEqual({
    status: 'error',
    errorCode: expect.any(String),
    message: expect.any(String),
  });
}

describe('Invalid JSON body (SRS-NF-002)', () => {
  it('returns 400 INVALID_JSON for malformed JSON on /api/login', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('{"username": "admin", "password": ');
    expect(res.statusCode).toBe(400);
    expectErrorShape(res.body);
    expect(res.body.errorCode).toBe('INVALID_JSON');
    expect(res.body.message).toBe('Request body is not valid JSON');
  });

  it('returns 400 INVALID_JSON for non-JSON text sent as JSON', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('username=admin&password=Secret@123');
    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_JSON');
    expect(JSON.stringify(res.body)).not.toContain('Secret@123');
  });

  it('returns 413 PAYLOAD_TOO_LARGE for an oversized body', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ username: 'a', password: 'x'.repeat(200 * 1024) }));
    expect(res.statusCode).toBe(413);
    expectErrorShape(res.body);
    expect(res.body.errorCode).toBe('PAYLOAD_TOO_LARGE');
  });

  it('keeps serving requests after bad input', async () => {
    await request(app).post('/api/login').set('Content-Type', 'application/json').send('{bad');
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('Unknown endpoints (SRS-NF-002)', () => {
  it('returns 404 NOT_FOUND for /api/whatever with a valid token', async () => {
    const res = await request(app).get('/api/whatever').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expectErrorShape(res.body);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('returns 401 (not 404) for /api/whatever without a token', async () => {
    const res = await request(app).get('/api/whatever');
    expect(res.statusCode).toBe(401);
    expectErrorShape(res.body);
  });
});

describe('Error logging never leaks secrets (SRS-NF-002)', () => {
  const originalEnv = process.env.NODE_ENV;
  let spy;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it('does not log the raw body when JSON parsing fails', async () => {
    await request(app)
      .post('/api/login')
      .set('Content-Type', 'application/json')
      .send('password=Secret@123');
    const logged = spy.mock.calls.flat().join(' ');
    expect(logged).toContain('INVALID_JSON');
    expect(logged).not.toContain('Secret@123');
  });

  it('does not log bearer tokens or query strings', async () => {
    await request(app)
      .get('/api/whatever?token=abc123secret')
      .set('Authorization', 'Bearer not-a-real-token');
    const logged = spy.mock.calls.flat().join(' ');
    expect(logged).toContain('INVALID_TOKEN');
    expect(logged).not.toContain('not-a-real-token');
    expect(logged).not.toContain('abc123secret');
  });
});