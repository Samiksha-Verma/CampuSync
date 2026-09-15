const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');
const { analyzeResume } = require('../controllers/resumeAnalyzerController');
const { chat } = require('../controllers/chatController');
const { getRecommendations } = require('../controllers/recommendationController');
const { startInterview, nextQuestion, getInterviewSummary } = require('../controllers/voiceInterviewController');

router.post('/resume-analyzer', verifyToken, requireRole('student'), upload.single('resume'), analyzeResume);
router.post('/chat', verifyToken, requireRole('student'), chat);
router.get('/recommendations', verifyToken, requireRole('student'), getRecommendations);
router.post('/interview/start', verifyToken, requireRole('student'), upload.single('resume'), startInterview);
router.post('/interview/next', verifyToken, requireRole('student'), nextQuestion);
router.post('/interview/summary', verifyToken, requireRole('student'), getInterviewSummary);

module.exports = router;
