const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getQuestions, createQuestion, getCategoryStats } = require('../controllers/questionController');
const { submitAttempt, getHistory } = require('../controllers/attemptController');

router.get('/categories', verifyToken, getCategoryStats);
router.get('/questions', verifyToken, requireRole('student'), getQuestions);
router.post('/questions', verifyToken, requireRole('admin', 'faculty'), createQuestion);
router.post('/submit', verifyToken, requireRole('student'), submitAttempt);
router.get('/history', verifyToken, requireRole('student'), getHistory);

module.exports = router;
