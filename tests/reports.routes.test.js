
process.env.JWT_SECRET = 'reports-test-secret';

jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const db = require('../src/config/db');
const app = require('../src/app');

function makeToken(role = 'admin', id = 1) {
  return jwt.sign(
    { id, role, name: 'Test User' },
    process.env.JWT_SECRET
  );
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${makeToken('admin', 1)}`
  };
}

beforeEach(() => {
  db.query.mockReset();
});

describe('GET /api/reports/branch', () => {
  test('rejects requests without authentication', async () => {
    const res = await request(app)
      .get('/api/reports/branch?branch=CSE&semester=5');

    expect(res.statusCode).toBe(401);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects students accessing the report', async () => {
    const res = await request(app)
      .get('/api/reports/branch?branch=CSE&semester=5')
      .set('Authorization', `Bearer ${makeToken('student', 10)}`);

    expect(res.statusCode).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects invalid branch or semester', async () => {
    const res = await request(app)
      .get('/api/reports/branch?branch=CSE&semester=10')
      .set(adminHeaders());

    expect(res.statusCode).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('returns student records and class averages', async () => {
    db.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          roll_no: 'PES001',
          name: 'Student One',
          present_count: 8,
          total_count: 10,
          average_marks: 80
        },
        {
          id: 2,
          roll_no: 'PES002',
          name: 'Student Two',
          present_count: 6,
          total_count: 10,
          average_marks: 60
        }
      ],
      []
    ]);

    const res = await request(app)
      .get('/api/reports/branch?branch=cse&semester=5')
      .set(adminHeaders());

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');

    const report = res.body.report;

    expect(report.branch).toBe('CSE');
    expect(report.semester).toBe(5);
    expect(report.total_students).toBe(2);

    expect(report.students[0].attendance_percentage).toBe(80);
    expect(report.students[0].average_marks).toBe(80);

    expect(report.students[1].attendance_percentage).toBe(60);
    expect(report.students[1].average_marks).toBe(60);

    expect(report.class_average).toEqual({
      attendance_percentage: 70,
      average_marks: 70
    });
  });

  test('returns zero averages when the branch has no students', async () => {
    db.query.mockResolvedValueOnce([[], []]);

    const res = await request(app)
      .get('/api/reports/branch?branch=CSE&semester=5')
      .set(adminHeaders());

    expect(res.statusCode).toBe(200);
    expect(res.body.report.total_students).toBe(0);
    expect(res.body.report.class_average).toEqual({
      attendance_percentage: 0,
      average_marks: 0
    });
  });
});
