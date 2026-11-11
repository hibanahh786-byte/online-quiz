const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please associate this question with a category']
  },
  questionText: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true
  },
  options: {
    type: [
      {
        key: {
          type: String,
          required: true,
          enum: ['A', 'B', 'C', 'D']
        },
        text: {
          type: String,
          required: true,
          trim: true
        }
      }
    ],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length === 4;
      },
      message: 'Question must have exactly 4 options (A, B, C, D)'
    }
  },
  correctAnswer: {
    type: String,
    required: [true, 'Please specify the correct option (A, B, C, or D)'],
    enum: ['A', 'B', 'C', 'D'],
    select: true // note: explicitly stripped in public quiz start endpoint
  },
  explanation: {
    type: String,
    default: '',
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  marks: {
    type: Number,
    default: 1,
    min: [1, 'Marks must be at least 1']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);
