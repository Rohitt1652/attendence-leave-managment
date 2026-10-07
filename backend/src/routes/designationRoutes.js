const express = require('express');
const router = express.Router();
const {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} = require('../controllers/designationController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getDesignations);
router.post('/', checkPermission(PERMISSIONS.DESIGNATION_MANAGE), createDesignation);
router.put('/:id', checkPermission(PERMISSIONS.DESIGNATION_MANAGE), updateDesignation);
router.delete('/:id', checkPermission(PERMISSIONS.DESIGNATION_MANAGE), deleteDesignation);

module.exports = router;
