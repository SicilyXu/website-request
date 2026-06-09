const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Business Request Portal',
  MANAGER_EMAIL: process.env.MANAGER_EMAIL || 'sicily@johnbatman.com.au',
  STAFF_EMAIL: process.env.STAFF_EMAIL || '',
  ALLOWED_ORIGINS: parseList(process.env.ALLOWED_ORIGINS),
};

module.exports = env;
