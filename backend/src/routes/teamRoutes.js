const express = require('express');
const router = express.Router();
const {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

router.use(protect);

router.get('/', getTeams);
router.post('/', checkPermission(PERMISSIONS.TEAM_MANAGE), createTeam);
router.put('/:id', checkPermission(PERMISSIONS.TEAM_MANAGE), updateTeam);
router.delete('/:id', checkPermission(PERMISSIONS.TEAM_MANAGE), deleteTeam);

module.exports = router;
