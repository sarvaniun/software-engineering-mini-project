// One audit_log row per change (SRSSR-004). changedBy is req.user.id.
const db = require('../config/db');

async function logAudit(tableName, recordId, action, changedBy, details = null) {
  await db.query(
    'INSERT INTO audit_log (table_name, record_id, action, changed_by, details) VALUES (?, ?, ?, ?, ?)',
    [tableName, recordId, action, changedBy, details ? JSON.stringify(details) : null]
  );
}

module.exports = { logAudit };
