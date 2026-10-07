const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getDepartments);
router.post('/', checkPermission(PERMISSIONS.DEPARTMENT_MANAGE), createDepartment);
router.put('/:id', checkPermission(PERMISSIONS.DEPARTMENT_MANAGE), updateDepartment);
router.delete('/:id', checkPermission(PERMISSIONS.DEPARTMENT_MANAGE), deleteDepartment);

module.exports = router;
