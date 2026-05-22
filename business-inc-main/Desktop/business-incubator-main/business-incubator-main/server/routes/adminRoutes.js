const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/overview', adminController.getOverview);
router.patch(
  '/users/:id/verification',
  validateRequest({
    params: { id: rules.mongoId({ required: true }) },
    body: { verified: rules.boolean({ required: true }) },
  }),
  adminController.updateUserVerification
);
router.patch(
  '/startups/:id/verification',
  validateRequest({
    params: { id: rules.mongoId({ required: true }) },
    body: { verified: rules.boolean({ required: true }) },
  }),
  adminController.updateStartupVerification
);
router.patch(
  '/mentors/:id/verification',
  validateRequest({
    params: { id: rules.mongoId({ required: true }) },
    body: { verified: rules.boolean({ required: true }) },
  }),
  adminController.updateMentorVerification
);

module.exports = router;
