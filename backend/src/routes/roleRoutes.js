const express = require('express');
const router = express.Router();
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} = require('../controllers/rolePermissionController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getRoles);
router.post('/', checkPermission(PERMISSIONS.ROLES_MANAGE), createRole);
router.put('/:id', checkPermission(PERMISSIONS.ROLES_MANAGE), updateRole);
router.delete('/:id', checkPermission(PERMISSIONS.ROLES_MANAGE), deleteRole);

module.exports = router;
