const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    reviewPeriod: {
      type: String,
      required: true, // e.g., 'Q3 2026', 'September 2026', 'Annual 2026'
    },
    reviewCycle: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Yearly'],
      default: 'Quarterly',
    },
    goals: [
      {
        title: { type: String, required: true },
        description: String,
        weightage: { type: Number, default: 0 },
        achievement: { type: String, default: '' },
        score: { type: Number, min: 1, max: 5 },
      },
    ],
    kpis: [
      {
        metric: { type: String, required: true },
        target: String,
        actual: String,
        score: { type: Number, min: 1, max: 5 },
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    managerFeedback: {
      type: String,
      default: '',
    },
    employeeFeedback: {
      type: String,
      default: '',
    },
    achievements: {
      type: String,
      default: '',
    },
    areasOfImprovement: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Reviewed', 'Acknowledged'],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
