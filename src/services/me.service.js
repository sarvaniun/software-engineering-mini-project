// Business logic for the student self-service views (SRSF-013).
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { calculateGpa } = require('../utils/gpa');

function rowsOf(res) {
 const first = Array.isArray(res) ? res[0] : res;
 return Array.isArray(first) ? first : (first ? [first] : []);
}

async function getProfile(userId) {
 const rows = rowsOf(await db.query(
 'SELECT id, user_id, roll_no, name, branch, semester, email, phone, is_active ' +
 'FROM students WHERE user_id = ?',
 [userId]
 ));

 if (!rows.length) {
 throw new AppError(
 404,
 'STUDENT_NOT_FOUND',
 'Student record not found'
 );
 }

 return rows[0];
}

async function getAttendance(userId) {
 const rows = rowsOf(await db.query(
 'SELECT sub.id AS subject_id, sub.code, sub.name, ' +
 'COUNT(a.id) AS total, SUM(a.present) AS present ' +
 'FROM students s ' +
 'JOIN attendance a ON a.student_id = s.id ' +
 'JOIN subjects sub ON a.subject_id = sub.id ' +
 'WHERE s.user_id = ? ' +
 'GROUP BY sub.id, sub.code, sub.name ORDER BY sub.code',
 [userId]
 ));

 return rows.map((r) => {
 const total = Number(r.total) || 0;
 const present = Number(r.present) || 0;

 return {
 subject_id: r.subject_id,
 code: r.code,
 name: r.name,
 total,
 present,
 percentage: total ? Math.round((present / total) * 100) : 0,
 };
 });
}

async function getMarks(userId) {
 const rows = rowsOf(await db.query(
 'SELECT sub.id AS subject_id, sub.code, sub.name, ' +
 'sub.max_marks, sub.credits, m.marks ' +
 'FROM students s ' +
 'JOIN marks m ON m.student_id = s.id ' +
 'JOIN subjects sub ON m.subject_id = sub.id ' +
 'WHERE s.user_id = ? ORDER BY sub.code',
 [userId]
 ));

 const marks = rows.map((r) => ({
 subject_id: r.subject_id,
 code: r.code,
 name: r.name,
 max_marks: Number(r.max_marks) || 0,
 marks: r.marks === null || r.marks === undefined
 ? null
 : Number(r.marks),
 credits: Number(r.credits) || 0,
 }));

 return {
 marks,
 gpa: calculateGpa(marks),
 };
}

module.exports = {
 getProfile,
 getAttendance,
 getMarks,
};
