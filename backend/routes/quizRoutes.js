const express = require('express');
const router = express.Router();
const {
  startQuiz,
  submitQuiz,
  getHistory,
  getHistoryDetail
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startQuiz);
router.post('/submit', submitQuiz);
router.get('/history', getHistory);
router.get('/history/:id', getHistoryDetail);

module.exports = router;
