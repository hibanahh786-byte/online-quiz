const User = require('../models/User');
const Result = require('../models/Result');
const bcrypt = require('bcryptjs');

// @desc    Get user profile with stats
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Aggregate user stats
    const results = await Result.find({ userId: req.user.id });
    const totalQuizzes = results.length;
    const totalQuestionsAnswered = results.reduce((acc, r) => acc + (r.correctAnswers + r.wrongAnswers), 0);
    const avgScore = totalQuizzes > 0 
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalQuizzes) 
      : 0;
    const bestScore = totalQuizzes > 0 
      ? Math.max(...results.map(r => r.percentage)) 
      : 0;

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalQuizzes,
        totalQuestionsAnswered,
        avgScore,
        bestScore
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile details
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name.trim();
    if (phone) fieldsToUpdate.phone = phone.trim();

    if (email && email.toLowerCase().trim() !== req.user.email) {
      const emailLower = email.toLowerCase().trim();
      const existing = await User.findOne({ email: emailLower, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'That email is already registered by another account.'
        });
      }
      fieldsToUpdate.email = emailLower;
    }

    if (req.file) {
      fieldsToUpdate.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (err) {
    next(err);
  }
};
