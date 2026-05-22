const Startup = require('../models/Startup');
const Interest = require('../models/Interest');

// Express interest in a startup
exports.expressInterest = async (req, res, next) => {
  try {
    const { startupId, note } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    const interest = await Interest.findOneAndUpdate(
      { investorId: req.user.id, startupId },
      { investorId: req.user.id, startupId, note: note || '', status: 'interested' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: 'Interest expressed successfully',
      interest,
      startup: startup._id,
    });
  } catch (error) {
    next(error);
  }
};

// Get investor portfolio (startups they're interested in)
exports.getInvestorPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Interest.find({ investorId: req.user.id })
      .populate({
        path: 'startupId',
        populate: {
          path: 'founderId',
          select: 'name email',
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: 'Portfolio retrieved',
      portfolio,
    });
  } catch (error) {
    next(error);
  }
};

// Get all startups for investor browsing
exports.browseStartups = async (req, res, next) => {
  try {
    const { industry, stage, minFunding, maxFunding } = req.query;
    let filter = {};

    if (industry) filter.industry = industry;
    if (stage) filter.stage = stage;
    if (minFunding) {
      const parsedMinFunding = Number(minFunding);
      if (!Number.isNaN(parsedMinFunding)) {
        filter.fundingNeeded = { $gte: parsedMinFunding };
      }
    }
    if (maxFunding) {
      const parsedMaxFunding = Number(maxFunding);
      if (!Number.isNaN(parsedMaxFunding)) {
        filter.fundingNeeded = { ...filter.fundingNeeded, $lte: parsedMaxFunding };
      }
    }

    const startups = await Startup.find(filter).populate('founderId', 'name email');
    res.status(200).json({ startups });
  } catch (error) {
    next(error);
  }
};
