const Mentor = require('../models/Mentor');
const MentorRequest = require('../models/MentorRequest');
const Startup = require('../models/Startup');
const User = require('../models/User');                    // ✅ added
const sendEmail = require('../utils/sendEmail');           // ✅ added

// Get all mentors
exports.getAllMentors = async (req, res, next) => {
  try {
    const mentors = await Mentor.find().populate('userId', 'name email bio');
    res.status(200).json({ mentors });
  } catch (error) {
    next(error);
  }
};

// Get mentor by ID
exports.getMentorById = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .populate('userId', 'name email bio')
      .populate('mentorships')
      .populate('reviews.reviewer', 'name');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.status(200).json({ mentor });
  } catch (error) {
    next(error);
  }
};

// Create mentor profile
exports.createMentor = async (req, res, next) => {
  try {
    const { expertise, yearsOfExperience, availability } = req.body;

    let mentor = await Mentor.findOne({ userId: req.user.id });
    if (mentor) {
      return res.status(400).json({ message: 'Mentor profile already exists' });
    }

    mentor = await Mentor.create({
      userId: req.user.id,
      expertise,
      yearsOfExperience,
      availability,
    });

    res.status(201).json({ mentor });
  } catch (error) {
    next(error);
  }
};

// Update mentor profile
exports.updateMentor = async (req, res, next) => {
  try {
    const allowedUpdates = ['expertise', 'yearsOfExperience', 'availability'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const existingMentor = await Mentor.findById(req.params.id);
    if (!existingMentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (existingMentor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this mentor profile' });
    }

    const mentor = await Mentor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ mentor });
  } catch (error) {
    next(error);
  }
};

// Request mentoring
exports.requestMentoring = async (req, res, next) => {
  try {
    const { startupId, message } = req.body;
    const mentorId = req.params.id;

    // ✅ populate userId so we have mentor's name and email for the notification
    const mentor = await Mentor.findById(mentorId).populate('userId', 'name email');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only request mentoring for your own startup' });
    }

    const existingRequest = await MentorRequest.findOne({
      startupId,
      mentorId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A pending request already exists for this mentor and startup' });
    }

    const mentorRequest = await MentorRequest.create({
      startupId,
      mentorId,
      startupFounderId: req.user.id,
      message,
    });

    // ✅ EMAIL: notify mentor about the new request
    // Wrapped in try/catch so a failed email never breaks the actual request
    try {
      const founder = await User.findById(req.user.id).select('name email');
      await sendEmail({
        to: mentor.userId.email,
        subject: 'New Mentoring Request — Business Incubator',
        html: `
          <h2>Hi ${mentor.userId.name},</h2>
          <p>You have a new mentoring request from <strong>${founder.name}</strong> for their startup <strong>${startup.name}</strong>.</p>
          <h3>Their message:</h3>
          <blockquote style="border-left:4px solid #ccc;padding-left:16px;color:#555;">
            ${message}
          </blockquote>
          <p>Log in to your dashboard to accept or reject this request.</p>
          <a href="${process.env.CLIENT_ORIGIN}/dashboard.html"
             style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">
            Open Dashboard
          </a>
          <p style="margin-top:24px;color:#999;font-size:12px;">Business Incubator — ${process.env.CLIENT_ORIGIN}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send mentor request email:', emailError.message);
    }

    res.status(201).json({ mentorRequest });
  } catch (error) {
    next(error);
  }
};

// Get mentor requests
exports.getMentorRequests = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (mentor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these mentor requests' });
    }

    const requests = await MentorRequest.find({ mentorId: req.params.id })
      .populate('startupId')
      .populate('startupFounderId', 'name email');
    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
};

// Accept/Reject mentor request
exports.respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid request status' });
    }

    // ✅ populate startupFounderId and startupId here so we have
    // founder email + startup name ready for the notification email
    const mentorRequest = await MentorRequest.findById(req.params.id)
      .populate('startupFounderId', 'name email')
      .populate('startupId', 'name');
    if (!mentorRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // ✅ populate userId so we have mentor name for the email
    const mentor = await Mentor.findById(mentorRequest.mentorId)
      .populate('userId', 'name email');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (mentor.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    const updatedRequest = await MentorRequest.findByIdAndUpdate(
      req.params.id,
      { status, respondedOn: new Date() },
      { new: true }
    );

    if (status === 'accepted') {
      await Mentor.findByIdAndUpdate(mentor._id, {
        $addToSet: { mentorships: mentorRequest.startupId },
      });
      await Startup.findByIdAndUpdate(mentorRequest.startupId, {
        $addToSet: { mentors: mentor._id },
      });
    }

    // ✅ EMAIL: notify the founder about the mentor's decision
    // Wrapped in try/catch so a failed email never breaks the response
    try {
      const founderEmail = mentorRequest.startupFounderId?.email;
      const founderName = mentorRequest.startupFounderId?.name || 'Founder';
      const startupName = mentorRequest.startupId?.name || 'your startup';

      const statusMessages = {
        accepted: `Great news! <strong>${mentor.userId.name}</strong> has <strong>accepted ✅</strong> your mentoring request for <strong>${startupName}</strong>.<br><br>You can now coordinate directly with your mentor.`,
        rejected: `<strong>${mentor.userId.name}</strong> has <strong>declined ❌</strong> your mentoring request for <strong>${startupName}</strong>.<br><br>Don't be discouraged — you can browse other mentors and send a new request at any time.`,
        completed: `Your mentoring session with <strong>${mentor.userId.name}</strong> for <strong>${startupName}</strong> has been marked as <strong>completed 🎉</strong>.<br><br>Thank you for using Business Incubator!`,
      };

      if (founderEmail) {
        await sendEmail({
          to: founderEmail,
          subject: `Your Mentoring Request was ${status} — Business Incubator`,
          html: `
            <h2>Hi ${founderName},</h2>
            <p>${statusMessages[status]}</p>
            <a href="${process.env.CLIENT_ORIGIN}/dashboard.html"
               style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">
              Open Dashboard
            </a>
            <p style="margin-top:24px;color:#999;font-size:12px;">Business Incubator — ${process.env.CLIENT_ORIGIN}</p>
          `,
        });
      }
    } catch (emailError) {
      console.error('Failed to send request response email:', emailError.message);
    }

    res.status(200).json({ mentorRequest: updatedRequest });
  } catch (error) {
    next(error);
  }
};
