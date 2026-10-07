const mongoose = require('mongoose');

const attendanceLockSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lockedAt: {
      type: Date,
      default: Date.now,
    },
    unlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    unlockedAt: {
      type: Date,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One lock entry per month and year
attendanceLockSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLock', attendanceLockSchema);
