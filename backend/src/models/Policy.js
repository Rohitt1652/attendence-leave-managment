const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Policy title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Attendance Policy', 'Leave Policy', 'WFH Policy', 'IT Policy', 'Code of Conduct', 'Holiday Policy', 'General'],
      default: 'General',
    },
    description: {
      type: String,
      required: true,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    version: {
      type: String,
      default: '1.0',
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Policy', policySchema);
