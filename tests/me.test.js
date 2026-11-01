process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/config/db', () => ({
 query: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

const studentToken = jwt.sign(
 {
 id: 7,
 role: 'student',
 name: 'Aarav Sharma',
 },
 'test-secret'
);

const adminToken = jwt.sign(
 {
 id: 1,
 role: 'admin',
 name: 'Admin Office',
 },
 'test-secret'
);

beforeEach(() => {
 db.query.mockReset();
});

describe('GET /api/me/profile', () => {
 it('returns the logged-in student profile', async () => {
 db.query.mockResolvedValueOnce([
 [
 {
 id: 1,
 user_id: 7,
 roll_no: 'R1',
 name: 'N1',
 branch: 'CSE',
 semester: 5,
 email: 'e',
 phone: 'p',
 is_active: 1,
 },
 ],
 ]);

 const res = await request(app)
.get('/api/me/profile')
.set('Authorization', `Bearer ${studentToken}`);

 expect(res.statusCode).toBe(200);
 expect(res.body.status).toBe('success');

 const profile = res.body.profile || res.body.student || res.body.data;

 expect(profile).toBeDefined();
 expect(profile.roll_no).toBe('R1');
 });

 it('returns 403 for a non-student', async () => {
 const res = await request(app)
.get('/api/me/profile')
.set('Authorization', `Bearer ${adminToken}`);

 expect(res.statusCode).toBe(403);
 });
});

describe('GET /api/me/attendance', () => {
 it('returns per-subject attendance', async () => {
 db.query.mockResolvedValueOnce([
 [
 {
 subject_id: 1,
 code: 'CS501',
 name: 'SE',
 total: 10,
 present: 8,
 },
 ],
 ]);

 const res = await request(app)
.get('/api/me/attendance')
.set('Authorization', `Bearer ${studentToken}`);

 expect(res.statusCode).toBe(200);
 expect(res.body.status).toBe('success');

 const rows = res.body.attendance || res.body.data;

 expect(Array.isArray(rows)).toBe(true);
 expect(rows).toHaveLength(1);
 expect(rows[0].subject_id).toBe(1);
 expect(rows[0].code).toBe('CS501');
 expect(rows[0].total).toBe(10);
 expect(rows[0].present).toBe(8);
 expect(rows[0].percentage).toBe(80);
 });
});

describe('GET /api/me/marks', () => {
 it('returns marks list, credits, and GPA', async () => {
 db.query.mockResolvedValueOnce([
 [
 {
 subject_id: 1,
 code: 'CS501',
 name: 'SE',
 max_marks: 100,
 marks: 85,
 credits: 4,
 },
 ],
 ]);

 const res = await request(app)
.get('/api/me/marks')
.set('Authorization', `Bearer ${studentToken}`);

 expect(res.statusCode).toBe(200);
 expect(res.body.status).toBe('success');

 const rows = res.body.marks || res.body.data;

 expect(Array.isArray(rows)).toBe(true);
 expect(rows).toHaveLength(1);
 expect(rows[0].subject_id).toBe(1);
 expect(rows[0].code).toBe('CS501');
 expect(rows[0].marks).toBe(85);
 expect(rows[0].credits).toBe(4);
 expect(rows[0].max_marks).toBe(100);

 expect(res.body.gpa).toBe(9);
 });
});
