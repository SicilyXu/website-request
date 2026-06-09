const express = require('express');
const path = require('path');
const env = require('./config/env');
const siteRoutes = require('./routes/site.routes');
const submitRoutes = require('./routes/submit.routes');
const { verifySmtpConfig } = require('./services/mail.service');

const app = express();
const publicDir = path.resolve(__dirname, '..', 'public');

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
