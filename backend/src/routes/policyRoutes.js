const express = require('express');
const router = express.Router();
const {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
} = require('../controllers/policyController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', checkPermission(PERMISSIONS.POLICY_VIEW), getPolicies);
router.post('/', checkPermission(PERMISSIONS.POLICY_MANAGE), createPolicy);
router.put('/:id', checkPermission(PERMISSIONS.POLICY_MANAGE), updatePolicy);
router.delete('/:id', checkPermission(PERMISSIONS.POLICY_MANAGE), deletePolicy);
router.post('/:id/acknowledge', acknowledgePolicy);

module.exports = router;
