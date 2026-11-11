const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getProfile);
router.put('/', upload.single('profileImage'), updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
