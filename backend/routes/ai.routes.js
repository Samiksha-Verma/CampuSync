import express from "express";
import multer from "multer";
import  protect  from "../middlewares/auth.middleware.js"; // Tumhara existing auth middleware

import {
  // Resume
  analyzeResumeController,
  getResumeHistory,
  // Test
  generateTestController,
  submitTestController,
  getTestHistory,
  // Interview
  startInterviewController,
  submitAnswerController,
  completeInterviewController,
  getInterviewHistory,
  // Chat
  chatController,
  getChatHistory,
  getChatSession,
} from "../controllers/ai.controller.js";

const router = express.Router();

// Multer - memory storage (Cloudinary ke liye)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Sirf PDF file allowed hai"), false);
  },
});

// ── Resume Routes ─────────────────────────
router.post("/resume/analyze", protect, upload.single("resume"), analyzeResumeController);
router.get("/resume/history", protect, getResumeHistory);

// ── Mock Test Routes ──────────────────────
router.post("/test/generate", protect, generateTestController);
router.post("/test/submit", protect, submitTestController);
router.get("/test/history", protect, getTestHistory);

// ── Voice Interview Routes ────────────────
router.post("/interview/start", protect, startInterviewController);
router.post("/interview/answer", protect, submitAnswerController);
router.post("/interview/complete", protect, completeInterviewController);
router.get("/interview/history", protect, getInterviewHistory);

// ── Chatbot Routes ────────────────────────
router.post("/chat/message", protect, chatController);
router.get("/chat/history", protect, getChatHistory);
router.get("/chat/session/:sessionId", protect, getChatSession);

export default router;
