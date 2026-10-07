const express = require('express');
const router = express.Router();
const {
  getLeaveAllocations,
  allocateLeave,
  bulkAllocateLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', checkPermission(PERMISSIONS.LEAVE_VIEW), getLeaveAllocations);
router.post('/', checkPermission(PERMISSIONS.LEAVE_ALLOCATE), allocateLeave);
router.post('/bulk', checkPermission(PERMISSIONS.LEAVE_ALLOCATE), bulkAllocateLeave);

module.exports = router;
