const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const startupController = require('../controllers/startupController');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

const startupWriteRules = {
  name: rules.string({ required: true, minLength: 2, maxLength: 120 }),
  description: rules.string({ required: true, minLength: 20, maxLength: 2000 }),
  industry: rules.string({ required: true, minLength: 2, maxLength: 100 }),
  stage: rules.enum(['idea', 'prototype', 'mvp', 'growth', 'scale']),
  fundingNeeded: rules.number({ min: 0 }),
  website: rules.url(),
  logo: rules.url(),
  teamSize: rules.integer({ min: 1, max: 10000 }),
};

const startupUpdateRules = Object.fromEntries(
  Object.entries(startupWriteRules).map(([field, rule]) => [field, { ...rule, required: false }])
);

// Get all startups
router.get('/', startupController.getAllStartups);

// ✅ BUG 9 FIX: must be BEFORE /:id to avoid "interests" being treated as an ID
// Get investors interested in a specific startup (founder only)
router.get(
  '/:id/interests',
  authMiddleware,
  validateRequest({ params: { id: rules.mongoId({ required: true }) } }),
  startupController.getStartupInterests
);

// Get startup by ID
router.get('/:id', validateRequest({ params: { id: rules.mongoId({ required: true }) } }), startupController.getStartupById);

// Create startup (protected)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['startup']), // ✅ also fixed array wrapping here
  validateRequest({ body: startupWriteRules }),
  startupController.createStartup
);

// Update startup (protected)
router.put(
  '/:id',
  authMiddleware,
  validateRequest(
    {
      params: { id: rules.mongoId({ required: true }) },
      body: startupUpdateRules,
    },
    { requireAtLeastOneBodyField: true }
  ),
  startupController.updateStartup
);

// Delete startup (protected)
router.delete(
  '/:id',
  authMiddleware,
  validateRequest({ params: { id: rules.mongoId({ required: true }) } }),
  startupController.deleteStartup
);

module.exports = router;
