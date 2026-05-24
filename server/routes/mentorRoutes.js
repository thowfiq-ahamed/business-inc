const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const mentorController = require('../controllers/mentorController');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

const mentorWriteRules = {
  expertise: rules.array({ required: true, items: 'string', minItems: 1, maxItems: 12 }),
  yearsOfExperience: rules.integer({ required: true, min: 1, max: 80 }),
  availability: rules.enum(['full-time', 'part-time', 'weekend-only']),
};

const mentorUpdateRules = Object.fromEntries(
  Object.entries(mentorWriteRules).map(([field, rule]) => [field, { ...rule, required: false }])
);

// Get all mentors
router.get('/', mentorController.getAllMentors);

// Get mentor by ID
router.get('/:id', validateRequest({ params: { id: rules.mongoId({ required: true }) } }), mentorController.getMentorById);

// Create mentor profile (protected)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['mentor', 'admin']),
  validateRequest({ body: mentorWriteRules }),
  mentorController.createMentor
);

// ✅ FIXED: Moved ABOVE PUT /:id so Express doesn't treat "request" as a mentor ID
// Respond to mentor request (protected)
router.put(
  '/request/:id',
  authMiddleware,
  roleMiddleware(['mentor', 'admin']),
  validateRequest({
    params: { id: rules.mongoId({ required: true }) },
    body: {
      status: rules.enum(['accepted', 'rejected', 'completed'], { required: true }),
    },
  }),
  mentorController.respondToRequest
);

// Update mentor profile (protected)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['mentor', 'admin']),
  validateRequest(
    {
      params: { id: rules.mongoId({ required: true }) },
      body: mentorUpdateRules,
    },
    { requireAtLeastOneBodyField: true }
  ),
  mentorController.updateMentor
);

// Request mentoring (protected)
router.post(
  '/:id/request',
  authMiddleware,
  roleMiddleware(['startup', 'admin']),
  validateRequest({
    params: { id: rules.mongoId({ required: true }) },
    body: {
      startupId: rules.mongoId({ required: true }),
      message: rules.string({ required: true, minLength: 10, maxLength: 1000 }),
    },
  }),
  mentorController.requestMentoring
);

// Get mentor requests (protected)
router.get(
  '/:id/requests',
  authMiddleware,
  roleMiddleware(['mentor', 'admin']),
  validateRequest({ params: { id: rules.mongoId({ required: true }) } }),
  mentorController.getMentorRequests
);

module.exports = router;
