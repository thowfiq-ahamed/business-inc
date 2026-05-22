const mongoose = require('mongoose');

const MentorRequestSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    startupFounderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    message: String,
    requestedOn: {
      type: Date,
      default: Date.now,
    },
    respondedOn: Date,
    sessionDate: Date,
    sessionNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MentorRequest', MentorRequestSchema);
