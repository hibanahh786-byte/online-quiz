const express = require('express');
const router = express.Router();
const { getResults, getResultById } = require('../controllers/resultController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getResults);
router.get('/:id', getResultById);

module.exports = router;
