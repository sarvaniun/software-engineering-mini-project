process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const db = require('../src/config/db');
const app = require('../src/app');
const { hashPassword } = require('../src/utils/password');

let hash;
beforeAll(async () => { hash = await hashPassword('Student@123'); });
beforeEach(() => db.query.mockReset());

const userRow = (extra = {}) => [[{
  id: 7, username: 'PES2UG24CS001', password_hash: hash, role: 'student',
  full_name: 'Aarav Sharma', failed_attempts: 0, is_locked: 0, minutes_left: null, ...extra,
}]];
const login = (password) => request(app).post('/api/login').send({ username: 'PES2UG24CS001', password });

describe('account lockout (SRSF-003, TC3)', () => {
  it('counts a wrong password', async () => {
    db.query.mockResolvedValueOnce(userRow({ failed_attempts: 0 })).mockResolvedValueOnce([{}]);
    const res = await login('wrong');
    expect(res.statusCode).toBe(401);
    expect(db.query.mock.calls[1][0]).toContain('SET failed_attempts = ?');
    expect(db.query.mock.calls[1][1]).toEqual([1, 7]);
  });

  it('locks the account on the 3rd wrong password', async () => {
    db.query.mockResolvedValueOnce(userRow({ failed_attempts: 2 })).mockResolvedValueOnce([{}]);
    const res = await login('wrong');
    expect(res.statusCode).toBe(401);
    expect(db.query.mock.calls[1][0]).toContain('locked_until = DATE_ADD');
  });

  it('returns 423 while locked, even with the correct password', async () => {
    db.query.mockResolvedValueOnce(userRow({ is_locked: 1, minutes_left: 4 }));
    const res = await login('Student@123');
    expect(res.statusCode).toBe(423);
    expect(res.body.errorCode).toBe('ACCOUNT_LOCKED');
    expect(res.body.message).toContain('4 minute');
  });

  it('resets the counter after a successful login', async () => {
    db.query.mockResolvedValueOnce(userRow({ failed_attempts: 2 })).mockResolvedValueOnce([{}]);
    const res = await login('Student@123');
    expect(res.statusCode).toBe(200);
    expect(db.query.mock.calls[1][0]).toContain('failed_attempts = 0, locked_until = NULL');
  });
});
