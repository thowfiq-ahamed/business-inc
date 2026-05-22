const Mentor = require('../models/Mentor');
const MentorRequest = require('../models/MentorRequest');
const Startup = require('../models/Startup');

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

    const mentor = await Mentor.findById(mentorId);
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

    const mentorRequest = await MentorRequest.findById(req.params.id);
    if (!mentorRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const mentor = await Mentor.findById(mentorRequest.mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (mentor.userId.toString() !== req.user.id && req.user.role !== 'admin') {
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

    res.status(200).json({ mentorRequest: updatedRequest });
  } catch (error) {
    next(error);
  }
};
