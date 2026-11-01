
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { allow } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const { attendancePercent } = require('../utils/attendance');
const { logAudit } = require('../utils/audit');

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
// Lists active students in the selected subject's branch and semester.
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
      throw new AppError(
        403,
        'SUBJECT_FORBIDDEN',
        'You are not assigned to teach this subject'
      );
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

    if (
      !classId ||
      !validDate(date) ||
      !Array.isArray(inputRecords) ||
      inputRecords.length === 0
    ) {
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
          'Each record needs a unique studentId and a boolean present value'
        );
      }

      seen.add(studentId);
      records.push({ studentId, present });
    }

    // Verify that the faculty member teaches the selected subject.
    const subjects = rowsOf(await db.query(
      `SELECT s.id, s.branch, s.semester
       FROM subjects s
       JOIN faculty_subjects fs ON fs.subject_id = s.id
       WHERE s.id = ? AND fs.faculty_id = ?`,
      [classId, req.user.id]
    ));

    if (!subjects.length) {
      throw new AppError(
        403,
        'SUBJECT_FORBIDDEN',
        'You are not assigned to teach this subject'
      );
    }

    const subject = subjects[0];
    const placeholders = records.map(() => '?').join(', ');

    // Reject inactive students and students outside the selected class.
    const validStudents = rowsOf(await db.query(
      `SELECT id
       FROM students
       WHERE is_active = 1
         AND branch = ?
         AND semester = ?
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

    const tuples = records.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const params = records.flatMap((record) => [
      record.studentId,
      classId,
      date,
      record.present,
      req.user.id
    ]);

    // Re-marking the same student, subject and date updates the existing row.
    await db.query(
      `INSERT INTO attendance
         (student_id, subject_id, class_date, present, marked_by)
       VALUES ${tuples}
       ON DUPLICATE KEY UPDATE
         present = VALUES(present),
         marked_by = VALUES(marked_by)`,
      params
    );
    await logAudit('attendance', classId, 'MARK', req.user.id, { date });

    const presentCount = records.filter((record) => record.present === 1).length;
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

// GET /api/marks/subjects
// Provides the subjects assigned to the logged-in faculty member.
router.get('/marks/subjects', allow('faculty'), async (req, res, next) => {
  try {
    const subjects = rowsOf(await db.query(
      `SELECT s.id, s.code, s.name, s.branch, s.semester, s.max_marks
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

// GET /api/marks/students?subjectId=1
// Lists active students in a subject taught by the logged-in faculty member.
router.get('/marks/students', allow('faculty'), async (req, res, next) => {
  try {
    const subjectId = positiveInteger(req.query.subjectId);

    if (!subjectId) {
      throw new AppError(
        400,
        'INVALID_SUBJECT',
        'A valid subjectId is required'
      );
    }

    const subjects = rowsOf(await db.query(
      `SELECT id, branch, semester, max_marks
       FROM subjects
       WHERE id = ?
         AND id IN (
           SELECT subject_id
           FROM faculty_subjects
           WHERE faculty_id = ?
         )`,
      [subjectId, req.user.id]
    ));

    if (!subjects.length) {
      throw new AppError(
        403,
        'SUBJECT_FORBIDDEN',
        'You are not assigned to teach this subject'
      );
    }

    const subject = subjects[0];

    const students = rowsOf(await db.query(
      `SELECT s.id, s.roll_no, s.name, m.marks
       FROM students s
       LEFT JOIN marks m
         ON m.student_id = s.id AND m.subject_id = ?
       WHERE s.is_active = 1
         AND s.branch = ?
         AND s.semester = ?
       ORDER BY s.roll_no`,
      [subjectId, subject.branch, subject.semester]
    ));

    res.json({
      status: 'success',
      maxMarks: Number(subject.max_marks),
      students: students.map((student) => ({
        ...student,
        marks: student.marks === null || student.marks === undefined
          ? null
          : Number(student.marks)
      }))
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/marks
// Body: { subjectId, records: [{ studentId, marks }] }
// Faculty can enter or update marks only for subjects they teach.
router.post('/marks', allow('faculty'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const subjectId = positiveInteger(body.subjectId);
    const inputRecords = body.records;

    if (
      !subjectId ||
      !Array.isArray(inputRecords) ||
      inputRecords.length === 0
    ) {
      throw new AppError(
        400,
        'INVALID_PAYLOAD',
        'A valid subjectId and a non-empty records array are required'
      );
    }

    const records = [];
    const seen = new Set();

    for (const record of inputRecords) {
      const studentId = positiveInteger(record?.studentId);
      const rawMarks = record?.marks;

      const marks = typeof rawMarks === 'number'
        ? rawMarks
        : typeof rawMarks === 'string' && rawMarks.trim() !== ''
          ? Number(rawMarks)
          : NaN;

      if (
        !studentId ||
        !Number.isFinite(marks) ||
        marks < 0 ||
        seen.has(studentId)
      ) {
        throw new AppError(
          400,
          'INVALID_MARKS',
          'Each record needs a unique studentId and valid non-negative marks'
        );
      }

      seen.add(studentId);
      records.push({ studentId, marks });
    }

    // Check that the faculty member is assigned to this subject.
    const subjects = rowsOf(await db.query(
      `SELECT s.id, s.branch, s.semester, s.max_marks
       FROM subjects s
       JOIN faculty_subjects fs ON fs.subject_id = s.id
       WHERE s.id = ? AND fs.faculty_id = ?`,
      [subjectId, req.user.id]
    ));

    if (!subjects.length) {
      throw new AppError(
        403,
        'SUBJECT_FORBIDDEN',
        'You are not assigned to teach this subject'
      );
    }

    const subject = subjects[0];
    const maxMarks = Number(subject.max_marks);

    if (!Number.isFinite(maxMarks) || maxMarks < 0) {
      throw new AppError(
        500,
        'INVALID_SUBJECT_CONFIGURATION',
        'The subject has an invalid maximum mark value'
      );
    }

    // Validate all marks before writing any records.
    for (const record of records) {
      if (record.marks > maxMarks) {
        throw new AppError(
          400,
          'MARKS_OUT_OF_RANGE',
          `Marks must be between 0 and ${maxMarks}`
        );
      }
    }

    // All students must be active and belong to this subject's class.
    const placeholders = records.map(() => '?').join(', ');

    const validStudents = rowsOf(await db.query(
      `SELECT id
       FROM students
       WHERE is_active = 1
         AND branch = ?
         AND semester = ?
         AND id IN (${placeholders})`,
      [
        subject.branch,
        subject.semester,
        ...records.map((record) => record.studentId)
      ]
    ));

    if (validStudents.length !== records.length) {
      throw new AppError(
        400,
        'INVALID_STUDENTS',
        'Every student must be active and belong to the selected subject class'
      );
    }

    const tuples = records.map(() => '(?, ?, ?, ?)').join(', ');
    const params = records.flatMap((record) => [
      record.studentId,
      subjectId,
      record.marks,
      req.user.id
    ]);

    // The unique key on (student_id, subject_id) prevents duplicate marks rows.
    await db.query(
      `INSERT INTO marks (student_id, subject_id, marks, entered_by)
       VALUES ${tuples}
       ON DUPLICATE KEY UPDATE
         marks = VALUES(marks),
         entered_by = VALUES(entered_by)`,
      params
    );
    // shortcut: one insert per student, batch the audit rows if a class save gets slow
    for (const record of records) {
      await logAudit('marks', record.studentId, 'UPSERT', req.user.id, { subjectId, marks: record.marks });
    }

    res.json({
      status: 'success',
      message: 'Marks saved successfully',
      recordsProcessed: records.length,
      maxMarks
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
