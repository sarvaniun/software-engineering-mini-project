
const express = require('express');
const router = express.Router();
const { allow } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const { getBranchReport } = require('../services/reports.service');

router.get('/branch', allow('admin'), async (req, res, next) => {
  try {
    const { branch, semester } = req.query;
    const semesterNumber = Number(semester);

    if (
      typeof branch !== 'string' ||
      !/^[A-Za-z]{2,10}$/.test(branch) ||
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 8
    ) {
      throw new AppError(
        400,
        'INVALID_REPORT_FILTER',
        'A valid branch and semester between 1 and 8 are required'
      );
    }

    const report = await getBranchReport(
      branch.toUpperCase(),
      semesterNumber
    );

    res.json({ status: 'success', report });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
