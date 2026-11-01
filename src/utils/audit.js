// One audit_log row per change (SRSSR-004). Pass the transaction connection so the row commits with its change.
async function logAudit(exec, tableName, recordId, action, changedBy, details = null) {
  await exec.query(
    'INSERT INTO audit_log (table_name, record_id, action, changed_by, details) VALUES (?, ?, ?, ?, ?)',
    [tableName, recordId, action, changedBy, details ? JSON.stringify(details) : null]
  );
}

module.exports = { logAudit };
