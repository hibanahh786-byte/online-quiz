const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  questionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }
  ],
  questionsSnapshot: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      questionText: String,
      shuffledOptions: [
        {
          key: String,
          text: String
        }
      ],
      correctOptionKey: String, // 'A', 'B', 'C', 'D' corresponding to the shuffled options
      originalCorrectAnswer: String,
      explanation: String,
      marks: {
        type: Number,
        default: 1
      }
    }
  ],
  totalQuestions: {
    type: Number,
    required: true
  },
  durationMinutes: Number,
  durationSeconds: Number,
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'expired'],
    default: 'in-progress'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL 24 hours
  }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
