process.env.JWT_SECRET = 'test-secret';
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

const adminToken = jwt.sign({ id: 1, role: 'admin', name: 'Admin Office' }, 'test-secret');

beforeEach(() => db.query.mockReset());

describe('POST /api/students (SRSF-010, TC5)', () => {
  it('creates a student and returns 201', async () => {
    db.query
      .mockResolvedValueOnce([[]])   // no existing student
      .mockResolvedValueOnce([[]])   // no existing user
      .mockResolvedValueOnce([{ insertId: 10 }]) // insert user
      .mockResolvedValueOnce([{ insertId: 20 }]); // insert student

    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roll_no: 'PES2UG24CS999', name: 'Test Student', branch: 'CSE', semester: 5, email: 't@x.com', phone: '123' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.student.roll_no).toBe('PES2UG24CS999');
    expect(res.body.student.id).toBe(20);
  });

  it('returns 409 for a duplicate roll_no', async () => {
    db.query.mockResolvedValueOnce([[{ id: 5 }]]); // existing student
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roll_no: 'PES2UG24CS001', name: 'Dup', branch: 'CSE', semester: 5 });
    expect(res.statusCode).toBe(409);
    expect(res.body.errorCode).toBe('DUPLICATE_ROLL_NO');
  });

  it('returns 403 for a non-admin', async () => {
    const studentToken = jwt.sign({ id: 7, role: 'student', name: 'S' }, 'test-secret');
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ roll_no: 'X', name: 'X', branch: 'CSE', semester: 1 });
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roll_no: 'PES2UG24CS998' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('MISSING_FIELDS');
  });
});

describe('GET /api/students', () => {
  it('returns the student list', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, roll_no: 'R1', name: 'N1', branch: 'CSE', semester: 5, email: null, phone: null, is_active: 1 }]]);
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.students).toHaveLength(1);
  });
});

describe('GET /api/students/:id', () => {
  it('returns one student', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, roll_no: 'R1', name: 'N1', branch: 'CSE', semester: 5, email: null, phone: null, is_active: 1 }]]);
    const res = await request(app).get('/api/students/1').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.student.id).toBe(1);
  });
});

describe('PUT /api/students/:id', () => {
  it('updates a student and returns 200', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/api/students/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name', branch: 'ECE', semester: 3, email: 'u@x.com', phone: '999' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('returns 403 for a non-admin', async () => {
    const studentToken = jwt.sign({ id: 7, role: 'student', name: 'S' }, 'test-secret');
    const res = await request(app).put('/api/students/1')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'X' });
    expect(res.statusCode).toBe(403);
  });
});