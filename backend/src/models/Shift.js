const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Shift code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      default: '09:30',
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      default: '18:30',
    },
    graceMinutes: {
      type: Number,
      default: 15,
    },
    breakMinutes: {
      type: Number,
      default: 60,
    },
    fullDayMinutes: {
      type: Number,
      default: 480, // 8 hours
    },
    halfDayMinutes: {
      type: Number,
      default: 240, // 4 hours
    },
    weeklyOffDays: {
      type: [Number], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      default: [0, 6], // Saturday & Sunday off
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Shift', shiftSchema);
