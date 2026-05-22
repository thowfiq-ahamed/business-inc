const mongoose = require('mongoose');

const StartupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a startup name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      enum: ['idea', 'prototype', 'mvp', 'growth', 'scale'],
      default: 'idea',
    },
    fundingNeeded: {
      type: Number,
      default: 0,
    },
    website: String,
    logo: String,
    teamSize: {
      type: Number,
      default: 0,
    },
    mentors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
      },
    ],
    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Startup', StartupSchema);
