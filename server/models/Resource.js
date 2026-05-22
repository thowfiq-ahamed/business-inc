const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a resource title'],
    },
    description: String,
    category: {
      type: String,
      enum: ['funding', 'tools', 'education', 'legal', 'technical', 'marketing'],
      required: true,
    },
    link: String,
    provider: String,
    cost: {
      type: String,
      enum: ['free', 'paid', 'freemium'],
      default: 'free',
    },
    tags: [String],
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    usefulCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', ResourceSchema);
