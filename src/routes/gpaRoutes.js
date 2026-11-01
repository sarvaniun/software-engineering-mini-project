// routes/gpaRoutes.js
const express = require('express');
const { calculateGPA } = require('../services/gpaService');
const router = express.Router();

/**
 * @route POST /api/gpa
 * @desc Calculate standard GPA (unweighted)
 * @body { studentId: string }
 */
router.post('/', async (req, res) => {
  try {
    const { studentId } = req.body;
    const gpa = await calculateGPA(studentId);
    res.json({ gpa });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/gpa/weighted
 * @desc Calculate weighted GPA
 * @body { studentId: string, courseWeights: Object }
 */
router.post('/weighted', async (req, res) => {
  try {
    const { studentId, courseWeights } = req.body;
    const gpa = await calculateGPA(studentId, courseWeights);
    res.json({ gpa });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;