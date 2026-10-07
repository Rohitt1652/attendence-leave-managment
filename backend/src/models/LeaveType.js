const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Leave type code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    paid: {
      type: Boolean,
      default: true,
    },
    annualLimit: {
      type: Number,
      required: true,
      default: 12,
    },
    carryForwardAllowed: {
      type: Boolean,
      default: false,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
    },
    documentRequired: {
      type: Boolean,
      default: false,
    },
    minimumNotice: {
      type: Number,
      default: 1, // days
    },
    halfDayAllowed: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
