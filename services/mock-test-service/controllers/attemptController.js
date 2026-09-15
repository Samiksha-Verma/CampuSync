const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');

const CATEGORIES = ['aptitude', 'coding', 'reasoning', 'web-development', 'backend'];

// POST /mocktest/submit (Student only)
// Body: { category, questions: [questionId,...], answers: [selectedOptionIndex|-1,...], timeTakenSeconds }
// Scoring is entirely server-side: the real Question documents are re-fetched fresh
// from the database by id, and the submitted answers are checked against their real
// correctOptionIndex - nothing about correctness is ever taken from the client.
const submitAttempt = async (req, res) => {
  try {
    const { category, questions, answers, timeTakenSeconds } = req.body;

    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'questions must be a non-empty array of question ids' });
    }
    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return res.status(400).json({ message: 'answers must be an array the same length as questions' });
    }
    if (typeof timeTakenSeconds !== 'number' || timeTakenSeconds < 0) {
      return res.status(400).json({ message: 'timeTakenSeconds must be a non-negative number' });
    }

    const realQuestions = await Question.find({ _id: { $in: questions } });
    const byId = new Map(realQuestions.map((q) => [q._id.toString(), q]));

    let score = 0;
    const results = questions.map((questionId, i) => {
      const real = byId.get(String(questionId));
      const selectedOption = answers[i];
      const isCorrect = !!real && selectedOption === real.correctOptionIndex;
      if (isCorrect) score += 1;

      return {
        questionId,
        questionText: real ? real.questionText : null,
        options: real ? real.options : null,
        selectedOption,
        correctOptionIndex: real ? real.correctOptionIndex : null,
        isCorrect,
      };
    });

    const completedAt = new Date();
    const startedAt = new Date(completedAt.getTime() - timeTakenSeconds * 1000);

    const attempt = await TestAttempt.create({
      studentId: req.user.id,
      category,
      questions,
      answers,
      score,
      totalQuestions: questions.length,
      startedAt,
      completedAt,
      timeTakenSeconds,
    });

    return res.status(201).json({ attempt, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while submitting the test' });
  }
};

// GET /mocktest/history?category=... (Student only, own attempts)
const getHistory = async (req, res) => {
  try {
    const filter = { studentId: req.user.id };

    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const attempts = await TestAttempt.find(filter).sort({ completedAt: -1 });
    return res.status(200).json({ attempts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching your test history' });
  }
};

module.exports = { submitAttempt, getHistory };
