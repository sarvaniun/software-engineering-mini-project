const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/students.routes');
const academicRoutes = require('./routes/academics.routes');
const reportRoutes = require('./routes/reports.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check: confirms the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Module routes (SAD 3.3: Auth, Student Records, Attendance & Marks, Reports & Backup)
app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', academicRoutes);
app.use('/api/reports', reportRoutes);

// Unknown API endpoint
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', errorCode: 'NOT_FOUND', message: 'Endpoint not found' });
});

// Central error handler (SAD 4.4): same JSON shape everywhere, never logs passwords or tokens
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}: ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    errorCode: err.errorCode || 'INTERNAL_ERROR',
    message: status === 500 ? 'Something went wrong' : err.message,
  });
});

module.exports = app;
