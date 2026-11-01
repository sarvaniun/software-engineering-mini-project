const express = require('express');
const path = require('path');

const { verifyToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/students.routes');
const meRoutes = require('./routes/me.routes');
const academicRoutes = require('./routes/academics.routes');
const reportRoutes = require('./routes/reports.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check: confirms the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Safety net (SRSSR-003): every /api route needs a valid login,
// except these public ones. Role checks are added per route with allow(...).
const PUBLIC_API_PATHS = ['/login', '/health'];
app.use('/api', (req, res, next) => {
  if (PUBLIC_API_PATHS.includes(req.path)) return next();
  return verifyToken(req, res, next);
});

// Module routes (SAD 3.3: Auth, Student Records, Attendance & Marks, Reports & Backup)
app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/me', meRoutes);
app.use('/api', academicRoutes);
app.use('/api/reports', reportRoutes);

// Unknown API endpoint
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', errorCode: 'NOT_FOUND', message: 'Endpoint not found' });
});

// Body-parser errors (bad JSON, too large, etc.) -> clean 4xx, never a 500 (SRS-NF-002)
const BODY_ERRORS = {
  'entity.parse.failed': [400, 'INVALID_JSON', 'Request body is not valid JSON'],
  'entity.too.large': [413, 'PAYLOAD_TOO_LARGE', 'Request body is too large'],
  'encoding.unsupported': [415, 'UNSUPPORTED_ENCODING', 'Request encoding is not supported'],
  'charset.unsupported': [415, 'UNSUPPORTED_CHARSET', 'Request charset is not supported'],
  'request.aborted': [400, 'REQUEST_ABORTED', 'Request was aborted'],
  'request.size.invalid': [400, 'INVALID_REQUEST_SIZE', 'Request size did not match content length'],
};

// Log line that can never contain passwords or tokens: body-parser messages echo the raw
// request body (e.g. `"password=..." is not valid JSON`), so they are never logged as-is,
// and query strings are stripped from the URL.
function logError(req, status, errorCode, err) {
  if (process.env.NODE_ENV === 'test') return;
  const url = (req.originalUrl || '').split('?')[0];
  const isClientError = Boolean(BODY_ERRORS[err.type]) || status < 500;
  const detail = isClientError ? errorCode : `${errorCode}: ${err.message || 'Unknown error'}`;
  console.error(`[${new Date().toISOString()}] ${req.method} ${url} -> ${status} ${detail}`);
}

// Central error handler (SAD 4.4): same JSON shape everywhere, never logs passwords or tokens
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status;
  let errorCode;
  let message;

  if (err && BODY_ERRORS[err.type]) {
    [status, errorCode, message] = BODY_ERRORS[err.type];
  } else {
    const raw = Number(err && err.status);
    status = Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : 500;
    errorCode = (err && err.errorCode) || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
    message = status >= 500 ? 'Something went wrong' : (err && err.message) || 'Request failed';
  }

  logError(req, status, errorCode, err || {});
  res.status(status).json({ status: 'error', errorCode, message });
});

module.exports = app;