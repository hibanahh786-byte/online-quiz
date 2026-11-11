const Category = require('../models/Category');
const Question = require('../models/Question');
const Result = require('../models/Result');

// @desc    Get all categories (public gets active only, admin can request all)
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const filter = {};
    // If not admin or if activeOnly is specified, show active only
    if (!req.query.includeInactive || req.query.includeInactive === 'false') {
      filter.isActive = true;
    }

    const categories = await Category.find(filter).sort({ createdAt: -1 });

    // Populate question count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const questionCount = await Question.countDocuments({ categoryId: cat._id });
        return {
          ...cat.toObject(),
          questionCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const questionCount = await Question.countDocuments({ categoryId: category._id });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        questionCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { categoryName, description, difficulty, icon, isActive, quizQuestionCount } = req.body;

    if (!categoryName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category name and description are required'
      });
    }

    const existing = await Category.findOne({
      categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const category = await Category.create({
      categoryName: categoryName.trim(),
      description: description.trim(),
      difficulty: difficulty || 'medium',
      icon: icon || 'bi-journal-bookmark',
      quizQuestionCount: quizQuestionCount ? Math.max(1, parseInt(quizQuestionCount, 10)) : 5,
      isActive: isActive !== undefined ? isActive : true,
      image
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { categoryName, description, difficulty, icon, isActive, quizQuestionCount } = req.body;
    const updateData = {};

    if (categoryName) {
      const existing = await Category.findOne({
        categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists'
        });
      }
      updateData.categoryName = categoryName.trim();
    }

    if (description !== undefined) updateData.description = description.trim();
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (quizQuestionCount !== undefined) updateData.quizQuestionCount = Math.max(1, parseInt(quizQuestionCount, 10) || 5);

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Safety checks against accidental deletion
    const questionCount = await Question.countDocuments({ categoryId: req.params.id });
    const resultCount = await Result.countDocuments({ categoryId: req.params.id });

    if ((questionCount > 0 || resultCount > 0) && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        hasDependencies: true,
        questionCount,
        resultCount,
        message: `Cannot delete category: It contains ${questionCount} question(s) and ${resultCount} quiz attempt record(s). Deleting it would compromise test data integrity. Please deactivate it instead, or confirm force delete.`
      });
    }

    if (req.query.force === 'true') {
      await Question.deleteMany({ categoryId: req.params.id });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
