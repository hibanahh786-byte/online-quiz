const mongoose = require('mongoose');
const Question = require('../models/Question');
const Category = require('../models/Category');
const Result = require('../models/Result');
const QuizAttempt = require('../models/QuizAttempt');

// Helper function to shuffle an array in place (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// @desc    Start quiz: randomly select questions from category & shuffle options (SECURE)
// @route   POST /api/quiz/start
// @access  Private
exports.startQuiz = async (req, res, next) => {
  try {
    const categoryId = req.body.categoryId || req.query.categoryId;
    const requestedCount = req.body.questionCount || req.query.questionCount;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a categoryId'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid categoryId format'
      });
    }

    const category = await Category.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or is currently inactive'
      });
    }

    // Total questions available in this category
    const totalAvailable = await Question.countDocuments({ categoryId: category._id });

    if (totalAvailable === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions currently available for this category'
      });
    }

    // Configurable question count:
    // User/client specified, or category default, or fallback 5
    const configuredCount = parseInt(requestedCount || category.quizQuestionCount || 5, 10);
    // If fewer questions available than configured, display all without duplication
    const sampleSize = Math.max(1, Math.min(configuredCount, totalAvailable));

    // MongoDB Aggregation: $match category and $sample distinct random questions
    const randomQuestions = await Question.aggregate([
      {
        $match: {
          categoryId: new mongoose.Types.ObjectId(categoryId)
        }
      },
      {
        $sample: {
          size: sampleSize
        }
      }
    ]);

    const optionKeys = ['A', 'B', 'C', 'D'];
    const questionsSnapshot = [];
    const clientQuestions = [];
    const questionIds = [];

    // Shuffle options for every question & record the mapping securely
    for (const q of randomQuestions) {
      questionIds.push(q._id);

      // Shuffle options array
      const shuffledRaw = shuffleArray(q.options || []);
      let correctOptionKey = 'A';

      const finalShuffledOptions = shuffledRaw.map((opt, idx) => {
        const newKey = optionKeys[idx] || 'A';
        // Check if this option was the original correct answer
        if (opt.key === q.correctAnswer) {
          correctOptionKey = newKey;
        }
        return {
          key: newKey,
          text: opt.text
        };
      });

      // Secure snapshot for grading on submission
      questionsSnapshot.push({
        questionId: q._id,
        questionText: q.questionText,
        shuffledOptions: finalShuffledOptions,
        correctOptionKey,
        originalCorrectAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        marks: q.marks || 1
      });

      // Client payload (SECURITY: never expose correctOptionKey, originalCorrectAnswer, or explanation!)
      clientQuestions.push({
        _id: q._id,
        questionText: q.questionText,
        options: finalShuffledOptions,
        difficulty: q.difficulty,
        marks: q.marks || 1
      });
    }

    // Compute duration: 1 min per question or 5 mins min
    const durationMinutes = Math.max(5, clientQuestions.length * 1);
    const durationSeconds = durationMinutes * 60;

    // Persist the quiz attempt session with selected question IDs in the database
    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      categoryId: category._id,
      questionIds,
      questionsSnapshot,
      totalQuestions: clientQuestions.length,
      durationMinutes,
      durationSeconds,
      status: 'in-progress'
    });

    res.status(200).json({
      success: true,
      attemptId: attempt._id,
      category: {
        _id: category._id,
        categoryName: category.categoryName,
        difficulty: category.difficulty,
        description: category.description,
        totalAvailableQuestions: totalAvailable
      },
      totalQuestions: clientQuestions.length,
      durationMinutes,
      durationSeconds,
      questions: clientQuestions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit quiz, securely validate answers on backend, calculate score & save result
// @route   POST /api/quiz/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { attemptId, categoryId, answers, timeTaken } = req.body;

    if (!categoryId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission data. categoryId and answers array are required.'
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;
    const processedAnswers = [];
    let savedQuestionIds = [];

    // Strategy A: Evaluate using QuizAttempt snapshot (with randomized questions and shuffled options)
    if (attemptId && mongoose.Types.ObjectId.isValid(attemptId)) {
      const attempt = await QuizAttempt.findOne({
        _id: attemptId,
        userId: req.user.id
      });

      if (attempt && attempt.questionsSnapshot && attempt.questionsSnapshot.length > 0) {
        savedQuestionIds = attempt.questionIds;

        // Build answers lookup map
        const userAnsMap = new Map();
        for (const ans of answers) {
          if (ans.questionId) {
            userAnsMap.set(ans.questionId.toString(), ans.selectedOption);
          }
        }

        for (const q of attempt.questionsSnapshot) {
          const marks = q.marks || 1;
          totalMarks += marks;

          const rawSelection = userAnsMap.get(q.questionId.toString());
          const userOption = rawSelection ? rawSelection.toUpperCase().trim() : null;
          const isCorrect = userOption && userOption === q.correctOptionKey;

          if (!userOption) {
            unanswered++;
          } else if (isCorrect) {
            correctAnswers++;
            obtainedMarks += marks;
          } else {
            wrongAnswers++;
          }

          processedAnswers.push({
            questionId: q.questionId,
            questionText: q.questionText,
            options: q.shuffledOptions,
            selectedOption: userOption,
            correctAnswer: q.correctOptionKey, // correct key corresponding to shuffled options
            explanation: q.explanation || '',
            isCorrect: Boolean(isCorrect),
            marksObtained: isCorrect ? marks : 0
          });
        }

        // Mark attempt as completed
        attempt.status = 'completed';
        await attempt.save();
      }
    }

    // Strategy B: Fallback if no attemptId provided
    if (processedAnswers.length === 0) {
      const questionIds = answers.map(a => a.questionId);
      savedQuestionIds = questionIds;
      const questions = await Question.find({ _id: { $in: questionIds }, categoryId });

      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No matching questions found for this quiz submission'
        });
      }

      const questionMap = new Map();
      questions.forEach(q => questionMap.set(q._id.toString(), q));

      for (const ans of answers) {
        const q = questionMap.get(ans.questionId.toString());
        if (!q) continue;

        const marks = q.marks || 1;
        totalMarks += marks;

        const userOption = ans.selectedOption ? ans.selectedOption.toUpperCase().trim() : null;
        const isCorrect = userOption && userOption === q.correctAnswer;

        if (!userOption) {
          unanswered++;
        } else if (isCorrect) {
          correctAnswers++;
          obtainedMarks += marks;
        } else {
          wrongAnswers++;
        }

        processedAnswers.push({
          questionId: q._id,
          questionText: q.questionText,
          options: q.options,
          selectedOption: userOption,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          isCorrect: Boolean(isCorrect),
          marksObtained: isCorrect ? marks : 0
        });
      }
    }

    const percentage = totalMarks > 0 
      ? parseFloat(((obtainedMarks / totalMarks) * 100).toFixed(2))
      : 0;

    // Performance status determination
    let performanceStatus = 'Needs Improvement';
    if (percentage >= 85) {
      performanceStatus = 'Excellent';
    } else if (percentage >= 70) {
      performanceStatus = 'Very Good';
    } else if (percentage >= 50) {
      performanceStatus = 'Good';
    } else if (percentage >= 35) {
      performanceStatus = 'Average';
    }

    // Save final result record to MongoDB (including selected question IDs)
    const result = await Result.create({
      userId: req.user.id,
      categoryId,
      questionIds: savedQuestionIds,
      totalQuestions: processedAnswers.length,
      correctAnswers,
      wrongAnswers,
      unanswered,
      totalMarks,
      obtainedMarks,
      percentage,
      timeTaken: Number(timeTaken) || 0,
      answers: processedAnswers
    });

    res.status(201).json({
      success: true,
      message: 'Quiz submitted and evaluated successfully',
      data: {
        _id: result._id,
        categoryName: category.categoryName,
        questionIds: result.questionIds,
        totalQuestions: processedAnswers.length,
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalMarks,
        obtainedMarks,
        percentage,
        performanceStatus,
        timeTaken: result.timeTaken,
        createdAt: result.createdAt,
        answers: processedAnswers
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's quiz history
// @route   GET /api/quiz/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const history = await Result.find({ userId: req.user.id })
      .populate('categoryId', 'categoryName difficulty icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed review of a specific past quiz result
// @route   GET /api/quiz/history/:id
// @access  Private
exports.getHistoryDetail = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('categoryId', 'categoryName difficulty icon')
      .populate('userId', 'name email');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result record not found'
      });
    }

    // Ownership check (unless admin)
    if (result.userId._id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this quiz result'
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
