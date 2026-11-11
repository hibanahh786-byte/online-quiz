const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard
} = require('../controllers/leaderboardController');

// Leaderboards are open to authenticated or public users
router.get('/', getLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
router.get('/monthly', getMonthlyLeaderboard);

module.exports = router;
