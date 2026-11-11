const Question = require('../models/Question');
const Category = require('../models/Category');

// @desc    Get questions with filters, search, and pagination
// @route   GET /api/questions
// @access  Private/Admin
exports.getQuestions = async (req, res, next) => {
  try {
    const { categoryId, difficulty, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (search) {
      query.questionText = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate('categoryId', 'categoryName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: questions.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: questions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private/Admin
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).populate('categoryId', 'categoryName');
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new question
// @route   POST /api/questions
// @access  Private/Admin
exports.createQuestion = async (req, res, next) => {
  try {
    const { categoryId, questionText, options, correctAnswer, explanation, difficulty, marks } = req.body;

    if (!categoryId || !questionText || !options || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, question text, 4 options, and the correct answer'
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Associated category does not exist'
      });
    }

    // Validate options format
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Must provide exactly 4 options (A, B, C, D)'
      });
    }

    const question = await Question.create({
      categoryId,
      questionText: questionText.trim(),
      options,
      correctAnswer: correctAnswer.toUpperCase(),
      explanation: explanation ? explanation.trim() : '',
      difficulty: difficulty || 'medium',
      marks: Number(marks) || 1
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: question
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const { categoryId, questionText, options, correctAnswer, explanation, difficulty, marks } = req.body;
    const updateData = {};

    if (categoryId) updateData.categoryId = categoryId;
    if (questionText) updateData.questionText = questionText.trim();
    if (options && Array.isArray(options)) updateData.options = options;
    if (correctAnswer) updateData.correctAnswer = correctAnswer.toUpperCase();
    if (explanation !== undefined) updateData.explanation = explanation.trim();
    if (difficulty) updateData.difficulty = difficulty;
    if (marks) updateData.marks = Number(marks);

    question = await Question.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('categoryId', 'categoryName');

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
