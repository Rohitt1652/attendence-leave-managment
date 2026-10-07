const express = require('express');
const router = express.Router();
const { getCalendarFeed, getCelebrations } = require('../controllers/holidayEventController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/feed', getCalendarFeed);
router.get('/celebrations', getCelebrations);

module.exports = router;
