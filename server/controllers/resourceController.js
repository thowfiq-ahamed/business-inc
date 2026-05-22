const Resource = require('../models/Resource');

// Get all resources
exports.getAllResources = async (req, res, next) => {
  try {
    const { category, tags } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (tags) filter.tags = { $in: tags.split(',') };

    const resources = await Resource.find(filter).populate('createdBy', 'name');
    res.status(200).json({ resources });
  } catch (error) {
    next(error);
  }
};

// Get resource by ID
exports.getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('createdBy', 'name email');
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(200).json({ resource });
  } catch (error) {
    next(error);
  }
};

// Create resource
exports.createResource = async (req, res, next) => {
  try {
    const { title, description, category, link, provider, cost, tags } = req.body;

    const resource = await Resource.create({
      title,
      description,
      category,
      link,
      provider,
      cost,
      tags,
      createdBy: req.user.id,
    });

    res.status(201).json({ resource });
  } catch (error) {
    next(error);
  }
};

// Update resource
exports.updateResource = async (req, res, next) => {
  try {
    const allowedUpdates = ['title', 'description', 'category', 'link', 'provider', 'cost', 'tags'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const existingResource = await Resource.findById(req.params.id);
    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (existingResource.createdBy?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this resource' });
    }

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ resource });
  } catch (error) {
    next(error);
  }
};

// Delete resource
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.createdBy?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Mark resource as useful
exports.markAsUseful = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { usefulCount: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.status(200).json({ resource });
  } catch (error) {
    next(error);
  }
};
