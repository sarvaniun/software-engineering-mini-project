
process.env.JWT_SECRET = 'attendance-test-secret';

jest.mock('../src/config/db', () => {
  const db = { query: jest.fn() };
  db.transaction = (fn) => fn(db);
  return db;
});

const jwt = require('jsonwebtoken');
const request = require('supertest');
const db = require('../src/config/db');
const app = require('../src/app');

function makeToken(role = 'faculty', id = 2) {
  return jwt.sign(
    { id, role, name: 'Test User' },
    process.env.JWT_SECRET
  );
}

const facultyToken = () => ({
  Authorization: `Bearer ${makeToken('faculty', 2)}`
});

beforeEach(() => {
  db.query.mockReset();
});

describe('Attendance API — access control', () => {
  test('rejects requests without a token', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .send({});

    expect(res.statusCode).toBe(401);
  });

  test('rejects student attendance marking', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${makeToken('student', 10)}`)
      .send({});

    expect(res.statusCode).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects malformed attendance payloads', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set(facultyToken())
      .send({
        classId: 1,
        date: '2026-10-21',
        records: []
      });

    expect(res.statusCode).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('POST /api/attendance', () => {
  test('saves attendance and returns the percentage', async () => {
    db.query
      .mockResolvedValueOnce([
        [{ id: 1, branch: 'CSE', semester: 5 }],
        []
      ])
      .mockResolvedValueOnce([
        [{ id: 10 }, { id: 11 }],
        []
      ])
      .mockResolvedValueOnce([{ affectedRows: 2 }, []]);

    const res = await request(app)
      .post('/api/attendance')
      .set(facultyToken())
      .send({
        classId: 1,
        date: '2026-10-21',
        records: [
          { studentId: 10, present: true },
          { studentId: 11, present: false }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.updatedPercentage).toBe(50);
    expect(res.body.recordsProcessed).toBe(2);

    const insertCall = db.query.mock.calls[2];
    expect(insertCall[0]).toContain('ON DUPLICATE KEY UPDATE');
  });

  test('rejects a subject the faculty member does not teach', async () => {
    db.query.mockResolvedValueOnce([[], []]);

    const res = await request(app)
      .post('/api/attendance')
      .set(facultyToken())
      .send({
        classId: 99,
        date: '2026-10-21',
        records: [{ studentId: 10, present: true }]
      });

    expect(res.statusCode).toBe(403);
  });

  test('rejects duplicate student IDs in one request', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set(facultyToken())
      .send({
        classId: 1,
        date: '2026-10-21',
        records: [
          { studentId: 10, present: true },
          { studentId: 10, present: false }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('GET /api/attendance/subjects', () => {
  test('lists subjects assigned to the faculty member', async () => {
    db.query.mockResolvedValueOnce([
      [{ id: 1, code: 'CS501', name: 'Software Engineering' }],
      []
    ]);

    const res = await request(app)
      .get('/api/attendance/subjects')
      .set(facultyToken());

    expect(res.statusCode).toBe(200);
    expect(res.body.subjects).toHaveLength(1);
    expect(res.body.subjects[0].code).toBe('CS501');
  });
});
