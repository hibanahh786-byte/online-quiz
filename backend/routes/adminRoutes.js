const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  deleteUser,
  getAllResults,
  exportResultsCSV,
  getAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All Admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/results', getAllResults);
router.get('/results/export', exportResultsCSV);
router.get('/analytics', getAnalytics);

module.exports = router;
