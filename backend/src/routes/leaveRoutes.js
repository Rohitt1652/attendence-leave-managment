const express = require('express');
const router = express.Router();
const {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  allocateLeave,
  bulkAllocateLeave,
  getLeaveAllocations,
  getLeaveBalances,
  applyLeave,
  getLeaveRequests,
  handleLeaveAction,
  getLeaveAnalytics,
} = require('../controllers/leaveController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

// Leave Types
router.get('/types', getLeaveTypes);
router.post('/types', checkPermission(PERMISSIONS.LEAVE_VIEW), createLeaveType);
router.put('/types/:id', checkPermission(PERMISSIONS.LEAVE_VIEW), updateLeaveType);
router.delete('/types/:id', checkPermission(PERMISSIONS.LEAVE_VIEW), deleteLeaveType);

// Leave Allocations
router.get('/allocations', checkPermission(PERMISSIONS.LEAVE_VIEW), getLeaveAllocations);
router.post('/allocations', checkPermission(PERMISSIONS.LEAVE_ALLOCATE), allocateLeave);
router.post('/allocations/bulk', checkPermission(PERMISSIONS.LEAVE_ALLOCATE), bulkAllocateLeave);

// Leave Balances
router.get('/balances/:employeeId?', getLeaveBalances);

// Leave Requests & Approvals
router.post('/requests', applyLeave);
router.get('/requests', getLeaveRequests);
router.put('/requests/:id/action', checkPermission(PERMISSIONS.LEAVE_APPROVE), handleLeaveAction);

// Analytics
router.get('/analytics', checkPermission(PERMISSIONS.LEAVE_VIEW), getLeaveAnalytics);

module.exports = router;
