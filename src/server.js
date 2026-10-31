require('dotenv').config();

const app = require('./app');
const { runBackup } = require('../scripts/backup');

const PORT = process.env.PORT || 3000;

function scheduleDailyBackup(hour = 2) {
  const now = new Date();
  const next = new Date(now);

  next.setHours(hour, 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  setTimeout(function run() {
    runBackup()
      .then((f) => console.log('Daily backup:', f))
      .catch((e) => console.error('Backup failed:', e.message));

    setTimeout(run, 24 * 60 * 60 * 1000);
  }, next - now);
}

scheduleDailyBackup();

app.listen(PORT, () => {
  console.log(`Student Record System running at http://localhost:${PORT}`);
});