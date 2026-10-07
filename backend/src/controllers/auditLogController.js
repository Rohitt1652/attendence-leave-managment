const AuditLog = require('../models/AuditLog');

// @route   GET /api/v1/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { module, action, page = 1, limit = 20 } = req.query;
    const query = {};

    if (module) query.module = module;
    if (action) query.action = action;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('userId', 'email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
