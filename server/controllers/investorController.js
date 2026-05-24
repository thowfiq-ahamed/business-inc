const Startup = require('../models/Startup');
const Interest = require('../models/Interest');
const User = require('../models/User');               // ✅ added
const sendEmail = require('../utils/sendEmail');       // ✅ added

// Express interest in a startup
exports.expressInterest = async (req, res, next) => {
  try {
    const { startupId, note } = req.body;

    // ✅ populate founderId so we have founder name + email for notification
    const startup = await Startup.findById(startupId).populate('founderId', 'name email');
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    const interest = await Interest.findOneAndUpdate(
      { investorId: req.user.id, startupId },
      { investorId: req.user.id, startupId, note: note || '', status: 'interested' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // ✅ BUG 9 FIX: email the founder when an investor expresses interest
    try {
      const investor = await User.findById(req.user.id).select('name email');
      await sendEmail({
        to: startup.founderId.email,
        subject: `An investor is interested in ${startup.name} — Business Incubator`,
        html: `
          <h2>Hi ${startup.founderId.name},</h2>
          <p>Great news! <strong>${investor.name}</strong> has expressed interest in your startup <strong>${startup.name}</strong>.</p>
          ${note ? `
            <h3>Their note:</h3>
            <blockquote style="border-left:4px solid #ccc;padding-left:16px;color:#555;">
              ${note}
            </blockquote>
          ` : ''}
          <p>Log in to your dashboard to see all investors interested in your startup.</p>
          <a href="${process.env.CLIENT_ORIGIN}/dashboard.html"
             style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">
            Open Dashboard
          </a>
          <p style="margin-top:24px;color:#999;font-size:12px;">Business Incubator — ${process.env.CLIENT_ORIGIN}</p>
        `,
      });
    } catch (emailError) {
      // Don't fail the interest save if email fails — just log it
      console.error('Failed to send investor interest email:', emailError.message);
    }

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
