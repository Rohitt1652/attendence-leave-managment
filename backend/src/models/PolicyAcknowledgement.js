const mongoose = require('mongoose');

const policyAcknowledgementSchema = new mongoose.Schema(
  {
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

policyAcknowledgementSchema.index({ policyId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('PolicyAcknowledgement', policyAcknowledgementSchema);
