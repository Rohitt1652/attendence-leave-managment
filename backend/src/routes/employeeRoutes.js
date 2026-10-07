const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getOrganizationHierarchy,
} = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/hierarchy', checkPermission(PERMISSIONS.EMPLOYEE_VIEW), getOrganizationHierarchy);
router.get('/', checkPermission(PERMISSIONS.EMPLOYEE_VIEW), getEmployees);
router.get('/:id', checkPermission(PERMISSIONS.EMPLOYEE_VIEW), getEmployeeById);
router.post('/', checkPermission(PERMISSIONS.EMPLOYEE_CREATE), createEmployee);
router.put('/:id', checkPermission(PERMISSIONS.EMPLOYEE_EDIT), updateEmployee);
router.delete('/:id', checkPermission(PERMISSIONS.EMPLOYEE_DELETE), deleteEmployee);

module.exports = router;
