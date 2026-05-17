const mongoose = require('mongoose');

const InterestSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['interested', 'contacted', 'watching'],
      default: 'interested',
    },
  },
  { timestamps: true }
);

InterestSchema.index({ investorId: 1, startupId: 1 }, { unique: true });

module.exports = mongoose.model('Interest', InterestSchema);
