const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { submitRequest } = require('../controllers/submit.controller');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

const validateSubmission = [
  body('siteKey').trim().notEmpty().withMessage('Site key is required'),
  body('businessName').trim().notEmpty().withMessage('Business name is required').isLength({ max: 200 }),
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .custom((value) => {
      const digits = value.replace(/[\s\-\(\)]/g, '');
      if (/^\+61[2-9]\d{8}$/.test(digits) || /^0[2-9]\d{8}$/.test(digits) || /^04\d{8}$/.test(digits)) {
        return true;
      }
      throw new Error('Please enter a valid Australian phone number');
    }),
  body('email').trim().notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('services').isArray({ min: 1 }).withMessage('Please select at least one service'),
  body('services.*').isIn(['printedCompendium', 'digitalCompendium', 'visitTouchscreen']),
];

router.post('/submit', submitLimiter, validateSubmission, submitRequest);

module.exports = router;
