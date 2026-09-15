const Question = require('../models/Question');

const CATEGORIES = ['aptitude', 'coding', 'reasoning', 'web-development', 'backend'];
const MAX_COUNT = 50;

// GET /mocktest/categories (any authenticated role)
// Lets the category-selection screen show a real "N questions available" count per
// category before a student commits to a test. Counts only - never leaks question
// text or answers, so it's safe for any role (including Faculty/Admin, who otherwise
// have no read access to the bank they add to).
const getCategoryStats = async (req, res) => {
  try {
    const counts = await Question.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const byCategory = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const categories = CATEGORIES.map((category) => ({ category, count: byCategory[category] || 0 }));

    return res.status(200).json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching category stats' });
  }
};

// GET /mocktest/questions?category=aptitude&count=10 (Student only)
// Uses $sample for true random selection. correctOptionIndex is deliberately never
// projected into the response. If the question bank has fewer than `count` questions
// in that category, fewer are returned - never an error, never a repeat within one test.
const getQuestions = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(', ')}` });
    }

    let count = parseInt(req.query.count, 10);
    if (!Number.isInteger(count) || count < 1) count = 10;
    if (count > MAX_COUNT) count = MAX_COUNT;

    const questions = await Question.aggregate([
      { $match: { category } },
      { $sample: { size: count } },
      { $project: { correctOptionIndex: 0 } },
    ]);

    return res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching questions' });
  }
};

// POST /mocktest/questions (Admin/Faculty only)
const createQuestion = async (req, res) => {
  try {
    const { category, questionText, options, correctOptionIndex, difficulty } = req.body;

    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (!questionText || typeof questionText !== 'string') {
      return res.status(400).json({ message: 'questionText is required' });
    }
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ message: 'options must be an array of exactly 4 choices' });
    }
    if (!Number.isInteger(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex > 3) {
      return res.status(400).json({ message: 'correctOptionIndex must be an integer from 0 to 3' });
    }

    const question = await Question.create({
      category,
      questionText,
      options,
      correctOptionIndex,
      difficulty,
      createdBy: req.user.id,
    });

    return res.status(201).json({ question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while creating the question' });
  }
};

module.exports = { getQuestions, createQuestion, getCategoryStats };
