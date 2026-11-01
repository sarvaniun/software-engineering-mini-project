process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => {
  const db = { query: jest.fn() };
  db.transaction = (fn) => fn(db);
  return db;
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

const adminToken = jwt.sign({ id: 1, role: 'admin', name: 'Admin Office' }, 'test-secret');
const facultyToken = jwt.sign({ id: 2, role: 'faculty', name: 'Faculty' }, 'test-secret');
const auditCalls = () => db.query.mock.calls.filter(([sql]) => sql.startsWith('INSERT INTO audit_log'));

beforeEach(() => db.query.mockReset());

describe('audit_log writes (SRSSR-004)', () => {
  it('deactivate writes a DEACTIVATE row for the admin', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);
    const res = await request(app).patch('/api/students/1/deactivate').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(auditCalls()[0][1]).toEqual(['students', 1, 'DEACTIVATE', 1, null]);
  });

  it('edit writes an UPDATE row with the changed fields', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, roll_no: 'R1', name: 'N1', branch: 'CSE', semester: 5, email: null, phone: null, is_active: 1 }]]);
    const body = { name: 'New Name', branch: 'CSE', semester: 5 };
    const res = await request(app).put('/api/students/1').set('Authorization', `Bearer ${adminToken}`).send(body);
    expect(res.statusCode).toBe(200);
    expect(auditCalls()[0][1]).toEqual(['students', 1, 'UPDATE', 1, JSON.stringify(body)]);
  });

  it('marks save writes one UPSERT row per student', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 3, branch: 'CSE', semester: 5, max_marks: 100 }]])
      .mockResolvedValueOnce([[{ id: 5 }]]);
    const res = await request(app).post('/api/marks')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ subjectId: 3, records: [{ studentId: 5, marks: 40 }] });
    expect(res.statusCode).toBe(200);
    expect(auditCalls()[0][1]).toEqual(['marks', 5, 'UPSERT', 2, JSON.stringify({ subjectId: 3, marks: 40 })]);
  });

  it('attendance save writes one MARK row for the class', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 3, branch: 'CSE', semester: 5 }]])
      .mockResolvedValueOnce([[{ id: 5 }]]);
    const res = await request(app).post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ classId: 3, date: '2026-10-30', records: [{ studentId: 5, present: true }] });
    expect(res.statusCode).toBe(200);
    expect(auditCalls()[0][1]).toEqual(['attendance', 3, 'MARK', 2, JSON.stringify({ date: '2026-10-30' })]);
  });
});

describe('GET /api/students/:id/audit', () => {
  it('returns the last editor for the admin', async () => {
    db.query.mockResolvedValueOnce([[{ action: 'UPDATE', changed_at: '2026-10-31T10:00:00.000Z', full_name: 'Admin Office' }]]);
    const res = await request(app).get('/api/students/1/audit').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.lastEdit.full_name).toBe('Admin Office');
  });

  it('returns 403 for faculty', async () => {
    const res = await request(app).get('/api/students/1/audit').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.statusCode).toBe(403);
  });
});
