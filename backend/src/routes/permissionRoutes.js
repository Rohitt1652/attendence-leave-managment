const express = require('express');
const router = express.Router();
const { getPermissions } = require('../controllers/rolePermissionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getPermissions);

module.exports = router;
