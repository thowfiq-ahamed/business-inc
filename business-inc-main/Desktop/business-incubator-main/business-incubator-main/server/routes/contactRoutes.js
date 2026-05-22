const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const contactController = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimitMiddleware');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

router.post(
  '/',
  contactLimiter,
  validateRequest({
    body: {
      name: rules.string({ required: true, minLength: 2, maxLength: 100 }),
      email: rules.email({ required: true }),
      inquiryType: rules.enum(['general', 'founder', 'mentor', 'investor', 'partnership', 'support']),
      subject: rules.string({ required: true, minLength: 3, maxLength: 140 }),
      message: rules.string({ required: true, minLength: 10, maxLength: 2000 }),
    },
  }),
  contactController.createContactMessage
);
router.get('/', authMiddleware, roleMiddleware('admin'), contactController.getContactMessages);
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware('admin'),
  validateRequest({
    params: { id: rules.mongoId({ required: true }) },
    body: {
      status: rules.enum(['new', 'reviewed', 'closed'], { required: true }),
    },
  }),
  contactController.updateContactMessageStatus
);

module.exports = router;
