const mongoose = require('mongoose');

const MentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    expertise: [String],
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    availability: {
      type: String,
      enum: ['full-time', 'part-time', 'weekend-only'],
      default: 'part-time',
    },
    mentoringSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorRequest',
      },
    ],
    mentorships: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Startup',
      },
    ],
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    reviews: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: Number,
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mentor', MentorSchema);
