const nodemailer = require('nodemailer');
const env = require('../config/env');

function createTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function getMissingSmtpConfig() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  return required.filter((key) => !env[key]);
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
    console.log(`[SMTP] Ready. Sending as ${env.SMTP_USER}`);
    return true;
  } catch (error) {
    console.error(`[SMTP] Verification failed: ${error.message}`);
    return false;
  }
}

function buildEmailHtml(data) {
  const { site, businessName, firstName, lastName, phone, email, services } = data;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const serviceLabels = {
    printedCompendium: 'Printed Compendium',
    digitalCompendium: 'Digital Compendium',
    visitTouchscreen: 'Touchscreen',
  };
  const selectedServices = services.map((service) => serviceLabels[service] || service);

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
          <tr>
            <td style="background:linear-gradient(135deg,#1a2a4a 0%,#2d4a7a 100%);padding:40px 40px 30px;text-align:center;">
              <p style="color:#c9a84c;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">${site.displayName} Region</p>
              <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 6px;">New Business Request</h1>
              <p style="color:#a8bcd4;font-size:14px;margin:0;">Submitted via the Business Registration Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="color:#8a9bb0;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Business Name</p>
                    <p style="color:#1a2a4a;font-size:18px;font-weight:600;margin:0;">${businessName}</p>
                  </td>
                </tr>
                <tr><td style="border-top:1px solid #e8ecf0;padding-bottom:24px;"></td></tr>
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
                <tr><td style="border-top:1px solid #e8ecf0;padding-bottom:24px;"></td></tr>
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="color:#8a9bb0;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Requested Services</p>
                    <table cellpadding="0" cellspacing="0">
                      ${selectedServices.map((service) => `
                      <tr>
                        <td style="padding-bottom:10px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#e8f0fb;border-left:3px solid #2d4a7a;border-radius:4px;padding:10px 16px;">
                                <span style="color:#1a2a4a;font-size:14px;font-weight:500;">&#10003;&nbsp;${service}</span>
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
          <tr>
            <td style="background:#f8f9fb;border-top:1px solid #e8ecf0;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;font-size:12px;margin:0;">
                This request was submitted on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', dateStyle: 'full', timeStyle: 'short' })}
              </p>
              <p style="color:#a0aec0;font-size:12px;margin:6px 0 0;">John Batman &mdash; ${site.displayName} Business Portal</p>
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

async function sendRequestEmail({ site, businessName, firstName, lastName, phone, email, services }) {
  const transporter = createTransporter();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const serviceLabels = {
    printedCompendium: 'Printed Compendium',
    digitalCompendium: 'Digital Compendium',
    visitTouchscreen: 'Touchscreen',
  };

  const mailOptions = {
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
    to: site.requestEmailRecipient,
    cc: env.STAFF_EMAIL || undefined,
    replyTo: `"${fullName}" <${email}>`,
    subject: `New Business Request - ${site.displayName} - ${businessName}`,
    text: [
      `NEW BUSINESS REQUEST - ${site.displayName.toUpperCase()} REGION`,
      '',
      `Site: ${site.displayName}`,
      `Business Name: ${businessName}`,
      `Contact Person: ${fullName}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      '',
      'Requested Services:',
      ...services.map((service) => `  - ${serviceLabels[service]}`),
      '',
      `Submitted: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`,
    ].join('\n'),
    html: buildEmailHtml({ site, businessName, firstName, lastName, phone, email, services }),
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  createTransporter,
  getMissingSmtpConfig,
  verifySmtpConfig,
  buildEmailHtml,
  sendRequestEmail,
};
