const express = require('express');
const router = express.Router();
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/performanceController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', checkPermission(PERMISSIONS.PERFORMANCE_VIEW), getReviews);
router.post('/', checkPermission(PERMISSIONS.PERFORMANCE_MANAGE), createReview);
router.put('/:id', checkPermission(PERMISSIONS.PERFORMANCE_MANAGE), updateReview);
router.delete('/:id', checkPermission(PERMISSIONS.PERFORMANCE_MANAGE), deleteReview);

module.exports = router;
