const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getSettings);
router.post('/', checkPermission(PERMISSIONS.SETTINGS_MANAGE), updateSettings);

module.exports = router;
