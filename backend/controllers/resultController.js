const Result = require('../models/Result');

// @desc    Get all results for current user (or all if admin)
// @route   GET /api/results
// @access  Private
exports.getResults = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };

    const results = await Result.find(query)
      .populate('userId', 'name email profileImage')
      .populate('categoryId', 'categoryName difficulty icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single result by ID
// @route   GET /api/results/:id
// @access  Private
exports.getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('userId', 'name email profileImage phone')
      .populate('categoryId', 'categoryName difficulty icon');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    if (result.userId._id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this result'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
