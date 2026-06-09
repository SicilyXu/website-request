const express = require('express');
const { getSiteConfig } = require('../controllers/site.controller');

const router = express.Router();

router.get('/site-config/:siteKey?', getSiteConfig);

module.exports = router;
