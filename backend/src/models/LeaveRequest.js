const mongoose = require('mongoose');
const { LEAVE_STATUS } = require('../constants/statuses');

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDaySession: {
      type: String,
      enum: ['First Half', 'Second Half', 'None'],
      default: 'None',
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
    },
    attachment: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
      index: true,
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
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
