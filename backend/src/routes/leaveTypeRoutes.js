const express = require('express');
const router = express.Router();
const {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} = require('../controllers/leaveController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getLeaveTypes);
router.post('/', checkPermission(PERMISSIONS.LEAVE_VIEW), createLeaveType);
router.put('/:id', checkPermission(PERMISSIONS.LEAVE_VIEW), updateLeaveType);
router.delete('/:id', checkPermission(PERMISSIONS.LEAVE_VIEW), deleteLeaveType);

module.exports = router;
