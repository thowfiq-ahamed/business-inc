const User = require('../models/User');
const Startup = require('../models/Startup');
const Mentor = require('../models/Mentor');
const Resource = require('../models/Resource');
const Interest = require('../models/Interest');
const MentorRequest = require('../models/MentorRequest');
const ContactMessage = require('../models/ContactMessage');

exports.getOverview = async (req, res, next) => {
  try {
    const [
      users,
      startups,
      mentors,
      resources,
      interestsCount,
      mentorRequestsCount,
      contactMessages,
      contactMessagesCount,
      newContactMessagesCount,
    ] = await Promise.all([
      User.find().select('name email role verified createdAt').sort({ createdAt: -1 }),
      Startup.find().populate('founderId', 'name email verified').sort({ createdAt: -1 }),
      Mentor.find().populate('userId', 'name email verified bio').sort({ createdAt: -1 }),
      Resource.find().populate('createdBy', 'name email').sort({ createdAt: -1 }),
      Interest.countDocuments(),
      MentorRequest.countDocuments(),
      ContactMessage.find().sort({ createdAt: -1 }).limit(50),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: 'new' }),
    ]);

    res.status(200).json({
      stats: {
        users: users.length,
        startups: startups.length,
        mentors: mentors.length,
        resources: resources.length,
        interests: interestsCount,
        mentorRequests: mentorRequestsCount,
        contactMessages: contactMessagesCount,
        newContactMessages: newContactMessagesCount,
        pendingUsers: users.filter(user => !user.verified).length,
        pendingStartups: startups.filter(startup => !startup.verified).length,
        pendingMentors: mentors.filter(mentor => !mentor.userId?.verified).length,
      },
      users,
      startups,
      mentors,
      resources,
      contactMessages,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserVerification = async (req, res, next) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'verified must be true or false' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verified },
      { new: true, runValidators: true }
    ).select('name email role verified createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateStartupVerification = async (req, res, next) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'verified must be true or false' });
    }

    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { verified },
      { new: true, runValidators: true }
    ).populate('founderId', 'name email verified');

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    res.status(200).json({ startup });
  } catch (error) {
    next(error);
  }
};

exports.updateMentorVerification = async (req, res, next) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'verified must be true or false' });
    }

    const mentor = await Mentor.findById(req.params.id).populate('userId', 'name email verified role');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    const user = await User.findByIdAndUpdate(
      mentor.userId._id,
      { verified },
      { new: true, runValidators: true }
    ).select('name email role verified');

    res.status(200).json({
      mentor: {
        ...mentor.toObject(),
        userId: user,
      },
    });
  } catch (error) {
    next(error);
  }
};
