const User = require('../models/User');
const Category = require('../models/Category');
const Question = require('../models/Question');
const Result = require('../models/Result');
const { Parser } = require('json2csv');

// @desc    Get admin dashboard overall analytics and charts data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalCategories = await Category.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalQuizzesAttempted = await Result.countDocuments();

    // Average Quiz Score
    const scoreAgg = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          totalMarksSum: { $sum: '$obtainedMarks' }
        }
      }
    ]);
    const averageScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgPercentage) : 0;

    // Recent registered users (latest 5)
    const recentUsers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent quiz results (latest 5)
    const recentResults = await Result.find()
      .populate('userId', 'name email profileImage')
      .populate('categoryId', 'categoryName')
      .sort({ createdAt: -1 })
      .limit(5);

    // User Registration Chart Data (last 6 months or past 30 days)
    const userRegData = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    // Quiz Participation Chart Data (grouped by category)
    const quizParticipation = await Result.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          avgScore: { $avg: '$percentage' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryName: '$category.categoryName',
          attemptsCount: '$count',
          avgScore: { $round: ['$avgScore', 1] }
        }
      },
      { $sort: { attemptsCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCategories,
        totalQuestions,
        totalQuizzesAttempted,
        averageScore
      },
      recentUsers,
      recentResults,
      charts: {
        userRegistrations: userRegData,
        quizParticipation
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users with search and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status !== undefined && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Attach quiz attempt counts to each user
    const usersWithQuizCount = await Promise.all(
      users.map(async (u) => {
        const quizzesCount = await Result.countDocuments({ userId: u._id });
        return {
          ...u.toObject(),
          quizzesCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithQuizCount.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: usersWithQuizCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active/inactive status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change the status of your own administrator account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle status or use provided status
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user and their quiz history
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrator account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete associated quiz results
    await Result.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User and all associated quiz history deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all results across all users with filters and pagination
// @route   GET /api/admin/results
// @access  Private/Admin
exports.getAllResults = async (req, res, next) => {
  try {
    const { search, categoryId, startDate, endDate, page = 1, limit = 15 } = req.query;

    const query = {};

    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    // Search by user name or email if specified
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } }
        ]
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);
      query.userId = { $in: userIds };
    }

    const total = await Result.countDocuments(query);
    const results = await Result.find(query)
      .populate('userId', 'name email profileImage')
      .populate('categoryId', 'categoryName difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: results.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export quiz results to CSV
// @route   GET /api/admin/results/export
// @access  Private/Admin
exports.exportResultsCSV = async (req, res, next) => {
  try {
    const results = await Result.find()
      .populate('userId', 'name email')
      .populate('categoryId', 'categoryName')
      .sort({ createdAt: -1 });

    const fields = [
      { label: 'Result ID', value: '_id' },
      { label: 'User Name', value: 'userId.name' },
      { label: 'User Email', value: 'userId.email' },
      { label: 'Category', value: 'categoryId.categoryName' },
      { label: 'Total Questions', value: 'totalQuestions' },
      { label: 'Correct Answers', value: 'correctAnswers' },
      { label: 'Wrong Answers', value: 'wrongAnswers' },
      { label: 'Unanswered', value: 'unanswered' },
      { label: 'Total Marks', value: 'totalMarks' },
      { label: 'Obtained Marks', value: 'obtainedMarks' },
      { label: 'Percentage (%)', value: 'percentage' },
      { label: 'Time Taken (sec)', value: 'timeTaken' },
      { label: 'Date', value: (row) => new Date(row.createdAt).toLocaleString() }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(results);

    res.header('Content-Type', 'text/csv');
    res.attachment(`quiz-results-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed analytics for admin
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalQuizzes = await Result.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Category breakdown
    const categoryStats = await Result.aggregate([
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          avgScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalQuizzes,
        totalUsers,
        categoryStats
      }
    });
  } catch (err) {
    next(err);
  }
};
