const express = require('express');
const studentsService = require('../services/students.service');
const { allow } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

// GET /api/students -> list of student records (admin/faculty)
router.get('/', allow('admin', 'faculty'), async (req, res, next) => {
  try {
    const students = await studentsService.listStudents();
    res.json({ status: 'success', students, data: students, records: students });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id -> one student record (admin/faculty)
router.get('/:id', allow('admin', 'faculty'), async (req, res, next) => {
  try {
    const student = await studentsService.getStudentById(req.params.id);
    res.json({ status: 'success', student, data: student });
  } catch (err) {
    next(err);
  }
});

// PUT /api/students/:id -> edit a student record (admin only)
router.put('/:id', allow('admin'), async (req, res, next) => {
  try {
    const student = await studentsService.updateStudent(req.params.id, req.body || {}, req.user.id);
    res.json({ status: 'success', id: req.params.id, student });
  } catch (err) {
    next(err);
  }
});

// POST /api/students -> add a student (admin only). Also creates a student login.
router.post('/', allow('admin'), async (req, res, next) => {
  try {
    const student = await studentsService.addStudent(req.body || {}, req.user.id);
    res.status(201).json({ status: 'success', id: student.id, roll_no: student.roll_no, name: student.name, branch: student.branch, semester: student.semester, student });
  } catch (err) {
    next(err);
  }
});

module.exports = router;