const express = require('express');
const meService = require('../services/me.service');
const { allow } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', allow('student'), async (req, res, next) => {
  try {
    const profile = await meService.getProfile(req.user.id);
    res.json({ status: 'success', profile, student: profile, data: profile });
  } catch (err) { next(err); }
});

router.get('/attendance', allow('student'), async (req, res, next) => {
  try {
    const attendance = await meService.getAttendance(req.user.id);
    res.json({ status: 'success', attendance, data: attendance });
  } catch (err) { next(err); }
});

router.get('/marks', allow('student'), async (req, res, next) => {
  try {
    const marks = await meService.getMarks(req.user.id);
    res.json({ status: 'success', marks, data: marks });
  } catch (err) { next(err); }
});

module.exports = router;