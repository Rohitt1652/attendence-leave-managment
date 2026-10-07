const mongoose = require('mongoose');

const leaveAllocationSchema = new mongoose.Schema(
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
    year: {
      type: Number,
      required: true,
    },
    allocatedDays: {
      type: Number,
      default: 0,
    },
    usedDays: {
      type: Number,
      default: 0,
    },
    pendingDays: {
      type: Number,
      default: 0,
    },
    carriedForwardDays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveAllocationSchema.virtual('availableDays').get(function () {
  return Math.max(0, this.allocatedDays + this.carriedForwardDays - this.usedDays - this.pendingDays);
});

// Compound index per employee, leave type and year
leaveAllocationSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveAllocation', leaveAllocationSchema);
