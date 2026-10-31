
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function runBackup() {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, '..', 'backups');

    fs.mkdirSync(dir, { recursive: true });

    const file = path.join(
      dir,
      `backup-${new Date().toISOString().slice(0, 10)}.sql`
    );

    const out = fs.createWriteStream(file);

    const dump = spawn('mysqldump', [
      '-h', process.env.DB_HOST || 'localhost',
      '-P', String(process.env.DB_PORT || 3306),
      '-u', process.env.DB_USER,
      process.env.DB_NAME || 'student_records',
    ], {
      env: {
        ...process.env,
        MYSQL_PWD: process.env.DB_PASSWORD
      }
    });

    let errText = '';

    dump.stdout.pipe(out);
    dump.stderr.on('data', (d) => {
      errText += d;
    });

    dump.on('error', reject);

    dump.on('close', (code) => {
      if (code === 0) {
        resolve(file);
      } else {
        reject(
          new Error(errText || `mysqldump exited with ${code}`)
        );
      }
    });
  });
}

if (require.main === module) {
  runBackup()
    .then((f) => console.log('Backup saved:', f))
    .catch((e) => {
      console.error('Backup failed:', e.message);
      process.exit(1);
    });
}

module.exports = { runBackup };
