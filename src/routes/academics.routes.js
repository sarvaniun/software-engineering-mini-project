
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { allow } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const { attendancePercent } = require('../utils/attendance');

function rowsOf(result) {
  const first = Array.isArray(result) ? result[0] : result;
  return Array.isArray(first) ? first : (first ? [first] : []);
}

function positiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function presentValue(value) {
  if (value === true || value === 1 || value === '1') return 1;
  if (value === false || value === 0 || value === '0') return 0;
  return null;
}

// GET /api/attendance/subjects
// A faculty member can see only their assigned subjects.
router.get('/attendance/subjects', allow('faculty'), async (req, res, next) => {
  try {
    const subjects = rowsOf(await db.query(
      `SELECT s.id, s.code, s.name, s.branch, s.semester
       FROM subjects s
       JOIN faculty_subjects fs ON fs.subject_id = s.id
       WHERE fs.faculty_id = ?
       ORDER BY s.code`,
      [req.user.id]
    ));

    res.json({ status: 'success', subjects });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/students?classId=1
// Lists active students belonging to the selected subject's branch/semester.
router.get('/attendance/students', allow('faculty'), async (req, res, next) => {
  try {
    const classId = positiveInteger(req.query.classId);

    if (!classId) {
      throw new AppError(400, 'INVALID_CLASS', 'A valid classId is required');
    }

    const subjects = rowsOf(await db.query(
      `SELECT s.id, s.branch, s.semester
       FROM subjects s
       JOIN faculty_subjects fs ON fs.subject_id = s.id
       WHERE s.id = ? AND fs.faculty_id = ?`,
      [classId, req.user.id]
    ));

    if (!subjects.length) {
      throw new AppError(403, 'SUBJECT_FORBIDDEN', 'You are not assigned to teach this subject');
    }

    const subject = subjects[0];
    const students = rowsOf(await db.query(
      `SELECT id, roll_no, name, branch, semester
       FROM students
       WHERE is_active = 1 AND branch = ? AND semester = ?
       ORDER BY roll_no`,
      [subject.branch, subject.semester]
    ));

    res.json({ status: 'success', students });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance
// Body: { classId, date, records: [{ studentId, present }] }
router.post('/attendance', allow('faculty'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const classId = positiveInteger(body.classId);
    const date = body.date;
    const inputRecords = body.records;

    if (!classId || !validDate(date) ||
        !Array.isArray(inputRecords) ||
        inputRecords.length === 0) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        'classId, a valid date, and a non-empty records array are required'
      );
    }

    const records = [];
    const seen = new Set();

    for (const record of inputRecords) {
      const studentId = positiveInteger(record?.studentId);
      const present = presentValue(record?.present);

      if (!studentId || present === null || seen.has(studentId)) {
        throw new AppError(
          400,
          'INVALID_RECORDS',
          'Each record needs a unique positive studentId and a boolean present value'
        );
      }

      seen.add(studentId);
      records.push({ studentId, present });
    }

    // Confirm the faculty member is assigned to this subject.
    const subjects = rowsOf(await db.query(
      `SELECT s.id, s.branch, s.semester
       FROM subjects s
       JOIN faculty_subjects fs ON fs.subject_id = s.id
       WHERE s.id = ? AND fs.faculty_id = ?`,
      [classId, req.user.id]
    ));

    if (!subjects.length) {
      throw new AppError(403, 'SUBJECT_FORBIDDEN', 'You are not assigned to teach this subject');
    }

    const subject = subjects[0];
    const placeholders = records.map(() => '?').join(', ');

    // Do not allow attendance for inactive or unrelated students.
    const validStudents = rowsOf(await db.query(
      `SELECT id FROM students
       WHERE is_active = 1 AND branch = ? AND semester = ?
       AND id IN (${placeholders})`,
      [subject.branch, subject.semester, ...records.map((r) => r.studentId)]
    ));

    if (validStudents.length !== records.length) {
      throw new AppError(
        400,
        'INVALID_STUDENTS',
        'Every student must be active and belong to the selected class'
      );
    }

    // The schema's unique key prevents duplicate records for the same
    // student, subject and date. Re-marking updates the existing row.
    const tuples = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const params = records.flatMap((r) => [
      r.studentId, classId, date, r.present, req.user.id
    ]);

    await db.query(
      `INSERT INTO attendance
         (student_id, subject_id, class_date, present, marked_by)
       VALUES ${tuples}
       ON DUPLICATE KEY UPDATE
         present = VALUES(present),
         marked_by = VALUES(marked_by)`,
      params
    );

    const presentCount = records.filter((r) => r.present === 1).length;
    const updatedPercentage = attendancePercent(presentCount, records.length);

    res.json({
      status: 'success',
      updatedPercentage,
      recordsProcessed: records.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
