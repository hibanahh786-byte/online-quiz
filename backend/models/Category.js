const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, 'Please provide a category name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a category description'],
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'bi-journal-bookmark'
  },
  quizQuestionCount: {
    type: Number,
    default: 5,
    min: [1, 'Must have at least 1 question per quiz']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);
