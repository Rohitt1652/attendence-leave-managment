const PerformanceReview = require('../models/PerformanceReview');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/performance
const getReviews = async (req, res, next) => {
  try {
    const { employeeId, reviewPeriod, reviewCycle } = req.query;
    const query = {};

    if (employeeId) query.employeeId = employeeId;
    if (reviewPeriod) query.reviewPeriod = reviewPeriod;
    if (reviewCycle) query.reviewCycle = reviewCycle;

    // If regular employee, show only self
    const userRole = req.user.roleId?.code || '';
    if (userRole === 'employee' && req.employee) {
      query.employeeId = req.employee._id;
    }

    const reviews = await PerformanceReview.find(query)
      .populate('employeeId', 'firstName lastName employeeCode departmentId')
      .populate('reviewerId', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/performance
const createReview = async (req, res, next) => {
  try {
    const reviewData = {
      ...req.body,
      reviewerId: req.employee?._id,
    };

    const review = await PerformanceReview.create(reviewData);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'PERFORMANCE_REVIEW_CREATED',
      module: 'Performance',
      recordId: review._id,
      newData: review,
      req,
    });

    res.status(201).json({ success: true, message: 'Review created successfully', data: review });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/performance/:id
const updateReview = async (req, res, next) => {
  try {
    const review = await PerformanceReview.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, message: 'Review updated successfully', data: review });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/performance/:id
const deleteReview = async (req, res, next) => {
  try {
    await PerformanceReview.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
};
