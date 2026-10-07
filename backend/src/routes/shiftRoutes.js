const express = require('express');
const router = express.Router();
const {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} = require('../controllers/shiftController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getShifts);
router.post('/', checkPermission(PERMISSIONS.SHIFT_MANAGE), createShift);
router.put('/:id', checkPermission(PERMISSIONS.SHIFT_MANAGE), updateShift);
router.delete('/:id', checkPermission(PERMISSIONS.SHIFT_MANAGE), deleteShift);

module.exports = router;
