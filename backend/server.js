require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const questionRoutes = require('./routes/questionRoutes');
const quizRoutes = require('./routes/quizRoutes');
const resultRoutes = require('./routes/resultRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Auto-seed helper
const User = require('./models/User');
const Category = require('./models/Category');

const app = express();

// Initialize DB
connectDB().then(async () => {
  // Check if initial admin exists, if not, auto-seed
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const categoryCount = await Category.countDocuments();
    if (adminCount === 0 || categoryCount === 0) {
      console.log('No admin or categories found, executing initial automatic seeding...');
      const seedData = require('./utils/seeder');
      // Run seed in non-exiting mode
      await seedData();
    }
  } catch (err) {
    console.warn('Initial seeding check notice:', err.message);
  }
});

// Middleware configuration
// Use helmet with relaxed content security policy for CDN scripts (Bootstrap, FontAwesome, Chart.js)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directories
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Online Quiz System API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler Middleware
app.use(errorHandler);

// SPA / Default page routing fallback
app.get('*', (req, res) => {
  // If requesting an api route that was not matched
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Online Quiz System Server running on port ${PORT}`);
  console.log(` Web Application: http://localhost:${PORT}`);
  console.log(` API Endpoint:    http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`, err.stack);
});

module.exports = app;
