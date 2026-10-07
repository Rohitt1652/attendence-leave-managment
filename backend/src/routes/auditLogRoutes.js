const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', checkPermission(PERMISSIONS.AUDIT_VIEW), getAuditLogs);

module.exports = router;
