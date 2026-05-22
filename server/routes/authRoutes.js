const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimitMiddleware');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

const userProfileRules = {
  name: rules.string({ minLength: 2, maxLength: 100 }),
  bio: rules.string({ maxLength: 500 }),
  avatar: rules.url(),
};

// Public routes
router.post(
  '/register',
  authLimiter,
  validateRequest({
    body: {
      name: rules.string({ required: true, minLength: 2, maxLength: 100 }),
      email: rules.email({ required: true }),
      password: rules.password({ required: true }),
      role: rules.enum(['startup', 'mentor', 'investor']),
    },
  }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateRequest({
    body: {
      email: rules.email({ required: true }),
      password: rules.password({ required: true }),
    },
  }),
  authController.login
);

router.post(
  '/verify-otp',
  authLimiter,
  validateRequest({
    body: {
      email: rules.email({ required: true }),
      otp: rules.string({ required: true, minLength: 6, maxLength: 6 }),
    },
  }),
  authController.verifyOtp
);

router.post(
  '/resend-otp',
  authLimiter,
  validateRequest({
    body: {
      email: rules.email({ required: true }),
    },
  }),
  authController.resendOtp
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateRequest({
    body: {
      email: rules.email({ required: true }),
    },
  }),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validateRequest({
    body: {
      token: rules.string({ required: true, minLength: 32, maxLength: 256 }),
      password: rules.password({ required: true }),
    },
  }),
  authController.resetPassword
);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put(
  '/profile',
  authMiddleware,
  validateRequest({ body: userProfileRules }, { requireAtLeastOneBodyField: true }),
  authController.updateProfile
);

module.exports = router;
