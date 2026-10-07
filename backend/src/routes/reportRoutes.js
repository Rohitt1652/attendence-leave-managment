const express = require('express');
const router = express.Router();
const { getMonthlyPayrollSummary, exportPayrollExcel } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/payroll-summary', checkPermission(PERMISSIONS.REPORTS_VIEW), getMonthlyPayrollSummary);
router.get('/export-excel', checkPermission(PERMISSIONS.REPORTS_EXPORT), exportPayrollExcel);

module.exports = router;
