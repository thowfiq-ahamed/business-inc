const Startup = require('../models/Startup');
const Interest = require('../models/Interest'); // ✅ added

// Get all startups
exports.getAllStartups = async (req, res, next) => {
  try {
    const startups = await Startup.find().populate('founderId', 'name email');
    res.status(200).json({ startups });
  } catch (error) {
    next(error);
  }
};

// Get startup by ID
exports.getStartupById = async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('founderId', 'name email')
      .populate('mentors')
      .populate('resources');
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    res.status(200).json({ startup });
  } catch (error) {
    next(error);
  }
};

// ✅ BUG 9 FIX: new endpoint — get all investors interested in a startup
// Only the founder of that startup (or admin) can see this
exports.getStartupInterests = async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view interests for this startup' });
    }

    const interests = await Interest.find({ startupId: req.params.id })
      .populate('investorId', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({ interests });
  } catch (error) {
    next(error);
  }
};

// Create startup
exports.createStartup = async (req, res, next) => {
  try {
    const { name, description, industry, stage, fundingNeeded, website, logo, teamSize } = req.body;

    const startup = await Startup.create({
      name,
      description,
      founderId: req.user.id,
      industry,
      stage,
      fundingNeeded,
      website,
      logo,
      teamSize,
    });

    res.status(201).json({ startup });
  } catch (error) {
    next(error);
  }
};

// Update startup
exports.updateStartup = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'name', 'description', 'industry', 'stage',
      'fundingNeeded', 'website', 'logo', 'teamSize',
    ];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    let startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this startup' });
    }

    startup = await Startup.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ startup });
  } catch (error) {
    next(error);
  }
};

// Delete startup
exports.deleteStartup = async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this startup' });
    }

    await Startup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Startup deleted successfully' });
  } catch (error) {
    next(error);
  }
};
