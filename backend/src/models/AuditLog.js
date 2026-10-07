const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true, // e.g. EMPLOYEE_CREATED, ATTENDANCE_LOCKED, LEAVE_APPROVED
      index: true,
    },
    module: {
      type: String,
      required: true, // e.g. Employee, Attendance, Leave, Settings
      index: true,
    },
    recordId: {
      type: String,
      default: '',
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
