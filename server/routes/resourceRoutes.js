const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const resourceController = require('../controllers/resourceController');
const { validateRequest, rules } = require('../middleware/validationMiddleware');

const resourceWriteRules = {
  title: rules.string({ required: true, minLength: 3, maxLength: 160 }),
  description: rules.string({ maxLength: 1200 }),
  category: rules.enum(['funding', 'tools', 'education', 'legal', 'technical', 'marketing'], { required: true }),
  link: rules.url(),
  provider: rules.string({ maxLength: 120 }),
  cost: rules.enum(['free', 'paid', 'freemium']),
  tags: rules.array({ items: 'string', maxItems: 20 }),
};

const resourceUpdateRules = Object.fromEntries(
  Object.entries(resourceWriteRules).map(([field, rule]) => [field, { ...rule, required: false }])
);

// Get all resources
router.get(
  '/',
  validateRequest({
    query: {
      category: rules.enum(['funding', 'tools', 'education', 'legal', 'technical', 'marketing']),
      tags: rules.string({ maxLength: 300 }),
    },
  }),
  resourceController.getAllResources
);

// Get resource by ID
router.get('/:id', validateRequest({ params: { id: rules.mongoId({ required: true }) } }), resourceController.getResourceById);

// Create resource (protected)
router.post('/', authMiddleware, validateRequest({ body: resourceWriteRules }), resourceController.createResource);

// Update resource (protected)
router.put(
  '/:id',
  authMiddleware,
  validateRequest(
    {
      params: { id: rules.mongoId({ required: true }) },
      body: resourceUpdateRules,
    },
    { requireAtLeastOneBodyField: true }
  ),
  resourceController.updateResource
);

// Delete resource (protected)
router.delete('/:id', authMiddleware, validateRequest({ params: { id: rules.mongoId({ required: true }) } }), resourceController.deleteResource);

// Mark as useful (protected)
router.post('/:id/useful', authMiddleware, validateRequest({ params: { id: rules.mongoId({ required: true }) } }), resourceController.markAsUseful);

module.exports = router;
