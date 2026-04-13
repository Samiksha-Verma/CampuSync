import express from "express";
import multer from "multer";
import  protect  from "../middlewares/auth.middleware.js";

import {
  analyzeResumeController, getResumeHistory,
  generateTestController, submitTestController, getTestHistory,
  generateCodingTestController, submitCodingProblemController, getCodingTestResultController,
  generateAptitudeTestController, submitAptitudeTestController,
  generateDSATestController, submitDSATestController,
  generateSubjectiveTestController, submitSubjectiveTestController,
  startInterviewController, submitAnswerController, completeInterviewController, getInterviewHistory,
  chatController, getChatHistory, getChatSession,
} from "../controllers/ai.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Sirf PDF file allowed hai"), false);
  },
});

// ── Resume ──────────────────────────────────
router.post("/resume/analyze", protect, upload.single("resume"), analyzeResumeController);
router.get("/resume/history", protect, getResumeHistory);

// ── MCQ Test ────────────────────────────────
router.post("/test/generate", protect, generateTestController);
router.post("/test/submit", protect, submitTestController);
router.get("/test/history", protect, getTestHistory);

// ── Coding Test (2 problems + test cases) ───
router.post("/coding/generate", protect, generateCodingTestController);
router.post("/coding/submit-problem", protect, submitCodingProblemController);  // Submit one problem
router.get("/coding/result/:testId", protect, getCodingTestResultController);   // Get full result

// ── Aptitude Test ────────────────────────────
router.post("/aptitude/generate", protect, generateAptitudeTestController);
router.post("/aptitude/submit", protect, submitAptitudeTestController);

// ── DSA Test ─────────────────────────────────
router.post("/dsa/generate", protect, generateDSATestController);
router.post("/dsa/submit", protect, submitDSATestController);

// ── Subjective Test ───────────────────────────
router.post("/subjective/generate", protect, generateSubjectiveTestController);
router.post("/subjective/submit", protect, submitSubjectiveTestController);

// ── Interview ────────────────────────────────
router.post("/interview/start", protect, startInterviewController);
router.post("/interview/answer", protect, submitAnswerController);
router.post("/interview/complete", protect, completeInterviewController);
router.get("/interview/history", protect, getInterviewHistory);

// ── Chatbot ──────────────────────────────────
router.post("/chat/message", protect, chatController);
router.get("/chat/history", protect, getChatHistory);
router.get("/chat/session/:sessionId", protect, getChatSession);

export default router;
