const express = require('express');
const router = express.Router();
const {
  punch,
  getTodayStatus,
  getMyAttendance,
  getDailyAttendance,
  getMonthlyMatrix,
  manualAttendance,
  lockAttendance,
  unlockAttendance,
  getLocks,
  requestRegularization,
  getRegularizations,
  handleRegularizationAction,
  importAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');
const upload = require('../middlewares/uploadMiddleware');

router.use(protect);

router.post('/punch', punch);
router.get('/today', getTodayStatus);
router.get('/my', getMyAttendance);

router.get('/daily', checkPermission(PERMISSIONS.ATTENDANCE_VIEW), getDailyAttendance);
router.get('/monthly-matrix', checkPermission(PERMISSIONS.ATTENDANCE_VIEW), getMonthlyMatrix);
router.post('/manual', checkPermission(PERMISSIONS.ATTENDANCE_EDIT), manualAttendance);

router.get('/locks', checkPermission(PERMISSIONS.ATTENDANCE_VIEW), getLocks);
router.post('/lock', checkPermission(PERMISSIONS.ATTENDANCE_LOCK), lockAttendance);
router.post('/unlock', checkPermission(PERMISSIONS.ATTENDANCE_LOCK), unlockAttendance);

router.post('/regularizations', requestRegularization);
router.get('/regularizations', getRegularizations);
router.put('/regularizations/:id/action', checkPermission(PERMISSIONS.ATTENDANCE_APPROVE), handleRegularizationAction);

router.post('/import', checkPermission(PERMISSIONS.ATTENDANCE_IMPORT), upload.single('file'), importAttendance);

module.exports = router;
