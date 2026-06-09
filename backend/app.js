const express = require('express');
const path = require('path');
const env = require('./config/env');
const siteRoutes = require('./routes/site.routes');
const submitRoutes = require('./routes/submit.routes');
const { verifySmtpConfig } = require('./services/mail.service');

const app = express();
const publicDir = path.resolve(__dirname, '..', 'public');
const defaultAllowedOrigins = [
  'https://www.platypus360.com',
  'https://platypus360.com',
];
const allowedOrigins = new Set([
  ...defaultAllowedOrigins,
  ...env.ALLOWED_ORIGINS,
].filter(Boolean));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.use('/api', siteRoutes);
app.use('/api', submitRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(env.PORT, async () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  await verifySmtpConfig();
});
