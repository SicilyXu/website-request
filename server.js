require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Warrnambool Business Portal';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'sicily@johnbatman.com.au';
const STAFF_EMAIL = process.env.STAFF_EMAIL || 'JenniferReed@johnbatman.com.au';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getRecipientConfig() {
  return {
    to: MANAGER_EMAIL,
    cc: STAFF_EMAIL || undefined,
  };
}

function getMissingSmtpConfig() {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  return requiredVars.filter((key) => !process.env[key]);
}

async function verifySmtpConfig() {
  const missingVars = getMissingSmtpConfig();
  if (missingVars.length > 0) {
    console.warn(
      `[SMTP] Missing configuration: ${missingVars.join(', ')}. ` +
      'Form submissions will fail until these are set in .env.'
    );
    return false;
  }

  try {
    await createTransporter().verify();
    console.log(`[SMTP] Ready. Sending as ${process.env.SMTP_USER} to ${MANAGER_EMAIL}${STAFF_EMAIL ? ` (cc: ${STAFF_EMAIL})` : ''}`);
    return true;
  } catch (error) {
    console.error(`[SMTP] Verification failed: ${error.message}`);
    return false;
  }
}

function buildEmailHtml(data) {
  const { businessName, firstName, lastName, phone, email, services } = data;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const serviceLabels = {
    printedCompendium: 'Printed Compendium',
    digitalCompendium: 'Digital Compendium',
    visitTouchscreen: 'Visit Touchscreen',
  };
  const selectedServices = services.map(s => serviceLabels[s] || s);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Business Request</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2a4a 0%,#2d4a7a 100%);padding:40px 40px 30px;text-align:center;">
              <p style="color:#c9a84c;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Warrnambool Region</p>
              <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 6px;">New Business Request</h1>
              <p style="color:#a8bcd4;font-size:14px;margin:0;">Submitted via the Business Registration Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Business Name -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="color:#8a9bb0;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Business Name</p>
                    <p style="color:#1a2a4a;font-size:18px;font-weight:600;margin:0;">${businessName}</p>
                  </td>
                </tr>
                <!-- Divider -->
                <tr><td style="border-top:1px solid #e8ecf0;padding-bottom:24px;"></td></tr>
                <!-- Contact -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="color:#8a9bb0;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Contact Person</p>
                    <p style="color:#1a2a4a;font-size:16px;font-weight:600;margin:0 0 4px;">${fullName}</p>
                    <p style="color:#4a6080;font-size:14px;margin:0 0 4px;">
                      <a href="tel:${phone}" style="color:#2d4a7a;text-decoration:none;">${phone}</a>
                    </p>
                    <p style="color:#4a6080;font-size:14px;margin:0;">
                      <a href="mailto:${email}" style="color:#2d4a7a;text-decoration:none;">${email}</a>
                    </p>
                  </td>
                </tr>
                <!-- Divider -->
                <tr><td style="border-top:1px solid #e8ecf0;padding-bottom:24px;"></td></tr>
                <!-- Services -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="color:#8a9bb0;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Requested Services</p>
                    <table cellpadding="0" cellspacing="0">
                      ${selectedServices.map(s => `
                      <tr>
                        <td style="padding-bottom:10px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#e8f0fb;border-left:3px solid #2d4a7a;border-radius:4px;padding:10px 16px;">
                                <span style="color:#1a2a4a;font-size:14px;font-weight:500;">✓ &nbsp;${s}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join('')}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;border-top:1px solid #e8ecf0;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;font-size:12px;margin:0;">
                This request was submitted on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', dateStyle: 'full', timeStyle: 'short' })}
              </p>
              <p style="color:#a0aec0;font-size:12px;margin:6px 0 0;">John Batman &mdash; Warrnambool Business Portal</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

const validateSubmission = [
  body('businessName').trim().notEmpty().withMessage('Business name is required').isLength({ max: 200 }),
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\+\-\(\)]{6,20}$/).withMessage('Please enter a valid phone number'),
  body('email').trim().notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('services').isArray({ min: 1 }).withMessage('Please select at least one service'),
  body('services.*').isIn(['printedCompendium', 'digitalCompendium', 'visitTouchscreen']),
];

app.post('/api/submit', submitLimiter, validateSubmission, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { businessName, firstName, lastName, phone, email, services } = req.body;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const serviceLabels = {
    printedCompendium: 'Printed Compendium',
    digitalCompendium: 'Digital Compendium',
    visitTouchscreen: 'Visit Touchscreen',
  };
  const serviceNames = services.map(s => serviceLabels[s]).join(', ');

  try {
    const transporter = createTransporter();
    const recipients = getRecipientConfig();

    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: recipients.to,
      cc: recipients.cc,
      replyTo: `"${fullName}" <${email}>`,
      subject: `New Business Request — ${businessName}`,
      text: [
        `NEW BUSINESS REQUEST — YARRA WAGGA REGION`,
        ``,
        `Business Name: ${businessName}`,
        `Contact Person: ${fullName}`,
        `Phone: ${phone}`,
        `Email: ${email}`,
        ``,
        `Requested Services:`,
        ...services.map(s => `  • ${serviceLabels[s]}`),
        ``,
        `Submitted: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`,
      ].join('\n'),
      html: buildEmailHtml({ businessName, firstName, lastName, phone, email, services }),
    };

    await transporter.sendMail(mailOptions);

    console.log(`[${new Date().toISOString()}] Request submitted: ${businessName} — ${fullName} — ${serviceNames}`);
    res.json({ success: true, message: 'Your request has been submitted successfully!' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Email send failed:`, error.message);
    res.status(500).json({ success: false, message: 'Failed to send your request. Please try again or contact us directly.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await verifySmtpConfig();
});
