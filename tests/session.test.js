process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('session expiry (SRSSR-005, SRSF-004)', () => {
  it('rejects an expired token with TOKEN_EXPIRED', async () => {
    const expired = jwt.sign(
      { id: 1, role: 'admin', name: 'Admin', exp: Math.floor(Date.now() / 1000) - 60 },
      'test-secret'
    );
    const res = await request(app).get('/api/whoami').set('Authorization', `Bearer ${expired}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('TOKEN_EXPIRED');
  });

  it('still accepts a token that has not expired', async () => {
    const valid = jwt.sign({ id: 1, role: 'admin', name: 'Admin' }, 'test-secret', { expiresIn: '15m' });
    const res = await request(app).get('/api/whoami').set('Authorization', `Bearer ${valid}`);
    expect(res.statusCode).toBe(200);
  });
});
