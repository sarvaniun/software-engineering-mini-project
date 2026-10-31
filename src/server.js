
require('dotenv').config();

const fs = require('fs');
const https = require('https');
const path = require('path');

const app = require('./app');
const { runBackup } = require('../scripts/backup');

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

function scheduleDailyBackup(hour = 2) {
  const now = new Date();
  const next = new Date(now);

  next.setHours(hour, 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  setTimeout(function run() {
    runBackup()
      .then((file) => console.log('Daily backup:', file))
      .catch((error) => console.error('Backup failed:', error.message));

    setTimeout(run, 24 * 60 * 60 * 1000);
  }, next - now);
}

// Schedule automatic daily database backup.
scheduleDailyBackup();

// Start HTTP server.
app.listen(PORT, () => {
  console.log(`Student Record System running at http://localhost:${PORT}`);
});

// Start HTTPS server.
const certificatePath = path.join(__dirname, '..', 'certs', 'server.crt');
const privateKeyPath = path.join(__dirname, '..', 'certs', 'server.key');

const sslOptions = {
  key: fs.readFileSync(privateKeyPath),
  cert: fs.readFileSync(certificatePath),
};

https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`Student Record System running at https://localhost:${HTTPS_PORT}`);
});
