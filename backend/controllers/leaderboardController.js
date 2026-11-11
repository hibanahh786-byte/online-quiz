const Result = require('../models/Result');
const mongoose = require('mongoose');

// Helper function to build leaderboard aggregation
const fetchLeaderboard = async (startDate = null) => {
  const matchStage = {};
  if (startDate) {
    matchStage.createdAt = { $gte: startDate };
  }

  const pipeline = [
    ...(startDate ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: '$userId',
        totalScore: { $sum: '$obtainedMarks' },
        quizzesCount: { $sum: 1 },
        totalPercentageSum: { $sum: '$percentage' },
        bestPercentage: { $max: '$percentage' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.isActive': true
      }
    },
    {
      $project: {
        _id: 1,
        name: '$user.name',
        email: '$user.email',
        profileImage: '$user.profileImage',
        totalScore: 1,
        quizzesCount: 1,
        averagePercentage: {
          $round: [{ $divide: ['$totalPercentageSum', '$quizzesCount'] }, 1]
        },
        bestPercentage: 1
      }
    },
    {
      $sort: {
        totalScore: -1,
        averagePercentage: -1,
        quizzesCount: -1
      }
    },
    { $limit: 100 }
  ];

  const rankings = await Result.aggregate(pipeline);

  // Assign ranks
  return rankings.map((item, index) => ({
    rank: index + 1,
    ...item
  }));
};

// @desc    Get overall leaderboard
// @route   GET /api/leaderboard
// @access  Public / Private
exports.getLeaderboard = async (req, res, next) => {
  try {
    const data = await fetchLeaderboard();
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get weekly leaderboard (past 7 days)
// @route   GET /api/leaderboard/weekly
// @access  Public / Private
exports.getWeeklyLeaderboard = async (req, res, next) => {
  try {
    const pastWeek = new Date();
    pastWeek.setDate(pastWeek.getDate() - 7);

    const data = await fetchLeaderboard(pastWeek);
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get monthly leaderboard (past 30 days)
// @route   GET /api/leaderboard/monthly
// @access  Public / Private
exports.getMonthlyLeaderboard = async (req, res, next) => {
  try {
    const pastMonth = new Date();
    pastMonth.setDate(pastMonth.getDate() - 30);

    const data = await fetchLeaderboard(pastMonth);
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
};
