const { validationResult } = require('express-validator');
const { resolveSite } = require('../utils/siteResolver');
const { sendRequestEmail } = require('../services/mail.service');

async function submitRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const site = resolveSite({
    pathname: req.path,
    hostname: req.hostname,
    siteKey: req.body?.siteKey || req.query?.siteKey || req.params?.siteKey,
  });

  const { businessName, firstName, lastName, phone, email, services } = req.body;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const serviceLabels = {
    printedCompendium: 'Printed Compendium',
    digitalCompendium: 'Digital Compendium',
    visitTouchscreen: 'Touchscreen',
  };
  const serviceNames = services.map((service) => serviceLabels[service]).join(', ');

  try {
    await sendRequestEmail({ site, businessName, firstName, lastName, phone, email, services });

    console.log(
      `[${new Date().toISOString()}] [${site.siteKey}] Request submitted: ${businessName} - ${fullName} - ${serviceNames}`
    );
    return res.json({ success: true, message: 'Your request has been submitted successfully!' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Email send failed:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send your request. Please try again or contact us directly.',
    });
  }
}

module.exports = {
  submitRequest,
};
