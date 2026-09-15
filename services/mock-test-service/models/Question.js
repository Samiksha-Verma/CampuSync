const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['aptitude', 'coding', 'reasoning', 'web-development', 'backend'],
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: 'options must contain exactly 4 choices',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    // Auth-service Admin/Faculty _id of whoever added this question. Not required -
    // the seed script populates the bank without acting as any particular user.
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
