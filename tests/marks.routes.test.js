process.env.JWT_SECRET = 'marks-test-secret';

jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

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

function facultyHeaders() {
  return {
    Authorization: `Bearer ${makeToken('faculty', 2)}`
  };
}

const assignedSubject = {
  id: 1,
  branch: 'CSE',
  semester: 5,
  max_marks: 100
};

beforeEach(() => {
  db.query.mockReset();
});

describe('POST /api/marks', () => {
  test('rejects requests without authentication', async () => {
    const res = await request(app)
      .post('/api/marks')
      .send({});

    expect(res.statusCode).toBe(401);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects students trying to enter marks', async () => {
    const res = await request(app)
      .post('/api/marks')
      .set('Authorization', `Bearer ${makeToken('student', 10)}`)
      .send({
        subjectId: 1,
        records: [{ studentId: 10, marks: 80 }]
      });

    expect(res.statusCode).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects an empty records array', async () => {
    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({ subjectId: 1, records: [] });

    expect(res.statusCode).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects negative marks before querying the database', async () => {
    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({
        subjectId: 1,
        records: [{ studentId: 10, marks: -1 }]
      });

    expect(res.statusCode).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('rejects marks above the subject maximum', async () => {
    db.query.mockResolvedValueOnce([
      [assignedSubject],
      []
    ]);

    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({
        subjectId: 1,
        records: [{ studentId: 10, marks: 101 }]
      });

    expect(res.statusCode).toBe(400);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('rejects subjects not assigned to the faculty member', async () => {
    db.query.mockResolvedValueOnce([[], []]);

    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({
        subjectId: 99,
        records: [{ studentId: 10, marks: 80 }]
      });

    expect(res.statusCode).toBe(403);
  });

  test('rejects duplicate student IDs in one request', async () => {
    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({
        subjectId: 1,
        records: [
          { studentId: 10, marks: 80 },
          { studentId: 10, marks: 90 }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('saves marks and updates existing marks without duplicates', async () => {
    db.query
      .mockResolvedValueOnce([[assignedSubject], []])
      .mockResolvedValueOnce([
        [{ id: 10 }, { id: 11 }],
        []
      ])
      .mockResolvedValueOnce([{ affectedRows: 2 }, []]);

    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({
        subjectId: 1,
        records: [
          { studentId: 10, marks: 85 },
          { studentId: 11, marks: 90 }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.recordsProcessed).toBe(2);
    expect(res.body.maxMarks).toBe(100);

    const insertQuery = db.query.mock.calls[2][0];

    expect(insertQuery).toContain('ON DUPLICATE KEY UPDATE');
    expect(insertQuery).toContain('marks = VALUES(marks)');
  });

  test('rejects students outside the selected subject class', async () => {
    db.query
      .mockResolvedValueOnce([[assignedSubject], []])
      .mockResolvedValueOnce([[{ id: 10 }], []]);

    const res = await request(app)
      .post('/api/marks')
      .set(facultyHeaders())
      .send({
        subjectId: 1,
        records: [
          { studentId: 10, marks: 85 },
          { studentId: 99, marks: 75 }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(db.query).toHaveBeenCalledTimes(2);
  });
});