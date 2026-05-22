const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const investorController = require('../controllers/investorController');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

// Browse startups
router.get(
  '/browse',
  validateRequest({
    query: {
      industry: rules.string({ maxLength: 100 }),
      stage: rules.enum(['idea', 'prototype', 'mvp', 'growth', 'scale']),
      minFunding: rules.number({ min: 0 }),
      maxFunding: rules.number({ min: 0 }),
    },
  }),
  investorController.browseStartups
);

// Express interest
router.post(
  '/interest',
  authMiddleware,
  roleMiddleware('investor'),
  validateRequest({
    body: {
      startupId: rules.mongoId({ required: true }),
      note: rules.string({ maxLength: 1000 }),
    },
  }),
  investorController.expressInterest
);

// Get investor portfolio
router.get('/portfolio', authMiddleware, roleMiddleware('investor'), investorController.getInvestorPortfolio);

module.exports = router;
