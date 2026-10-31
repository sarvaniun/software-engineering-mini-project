
require('dotenv').config();

const fs = require('fs');
const https = require('https');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

const certificatePath = path.join(__dirname, '..', 'certs', 'server.crt');
const privateKeyPath = path.join(__dirname, '..', 'certs', 'server.key');

// Start the existing HTTP server
app.listen(PORT, () => {
  console.log(`Student Record System running at http://localhost:${PORT}`);
});

// Start the HTTPS server using the local SSL certificate
const sslOptions = {
  key: fs.readFileSync(privateKeyPath),
  cert: fs.readFileSync(certificatePath),
};

https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`Student Record System running at https://localhost:${HTTPS_PORT}`);
});
