const mongoose = require('mongoose');
const { REGULARIZATION_STATUS } = require('../constants/statuses');

const attendanceRegularizationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    attendanceDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    originalCheckIn: {
      type: Date,
    },
    requestedCheckIn: {
      type: Date,
      required: true,
    },
    originalCheckOut: {
      type: Date,
    },
    requestedCheckOut: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: [
        'Missed Check-in',
        'Missed Check-out',
        'Wrong Punch',
        'Biometric Problem',
        'System Error',
        'Client Visit',
        'Field Work',
        'Work From Home',
        'Other',
      ],
    },
    employeeComment: {
      type: String,
      default: '',
    },
    approverComment: {
      type: String,
      default: '',
    },
    currentApprovalLevel: {
      type: Number,
      default: 1,
    },
    approvalHistory: [
      {
        level: Number,
        approverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        status: {
          type: String,
          enum: ['Approved', 'Rejected'],
        },
        comment: String,
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: Object.values(REGULARIZATION_STATUS),
      default: REGULARIZATION_STATUS.PENDING,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AttendanceRegularization', attendanceRegularizationSchema);
