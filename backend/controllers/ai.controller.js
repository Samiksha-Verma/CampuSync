import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { analyzeResume } from "../../ai-services/resumeAnalyzer.js";
import { generateTest, evaluateTest } from "../../ai-services/mockTestGenerator.js";
import {
  startInterview,
  evaluateAndNextQuestion,
  generateFinalFeedback,
} from "../../ai-services/mockInterviewer.js";
import { chatWithBot, generateSessionTitle } from "../../ai-services/chatbot.js";

import ResumeAnalysis from "../models/ResumeAnalysis.model.js";
import TestResult from "../models/TestResult.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import ChatHistory from "../models/ChatHistory.model.js";

// ─────────────────────────────────────────
// 📄 RESUME ANALYZER
// ─────────────────────────────────────────

// export const analyzeResumeController = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "Resume file required hai" });

//     const pdfParse = (await import("pdf-parse")).default;
//     // 1. Cloudinary pe upload karo
//     const uploadResult = await new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         { folder: "campusync/resumes", resource_type: "raw" },
//         (error, result) => (error ? reject(error) : resolve(result))
//       );
//       streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
//     });

//     // 2. PDF se text extract karo
//     const pdfData = await pdfParse(req.file.buffer);
//     const resumeText = pdfData.text;

//     if (!resumeText || resumeText.trim().length < 50) {
//       return res.status(400).json({ message: "Resume mein text nahi mila. Clear PDF upload karo." });
//     }

//     // 3. DB mein processing status save karo
//     const analysis = await ResumeAnalysis.create({
//       userId: req.user._id,
//       resumeUrl: uploadResult.secure_url,
//       resumePublicId: uploadResult.public_id,
//       status: "processing",
//     });

//     // 4. AI se analyze karwao
//     const aiResult = await analyzeResume(resumeText);

//     // 5. DB update karo with AI results
//     const updated = await ResumeAnalysis.findByIdAndUpdate(
//       analysis._id,
//       { ...aiResult, status: "completed" },
//       { new: true }
//     );

//     res.status(200).json({
//       message: "Resume analysis complete!",
//       data: updated,
//     });
//   } catch (error) {
//     console.error("Resume Analysis Error:", error);
//     res.status(500).json({ message: "Analysis mein error aaya", error: error.message });
//   }
// };

export const analyzeResumeController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Resume file is required " });

    // ✅ PDF text extract karne ka naya tarika:
    const extractTextFromPDF = async (buffer) => {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }
      return text;
    };

    // 1. Cloudinary pe upload
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "campusync/resumes", resource_type: "raw" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // 2. PDF se text extract
    const resumeText = await extractTextFromPDF(req.file.buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: " There is no text in resume. please upload clear PDF." });
    }

    // 3. DB mein save
    const analysis = await ResumeAnalysis.create({
      userId: req.user._id,
      resumeUrl: uploadResult.secure_url,
      resumePublicId: uploadResult.public_id,
      status: "processing",
    });

    // 4. AI se analyze
    const aiResult = await analyzeResume(resumeText);

    // 5. DB update
    const updated = await ResumeAnalysis.findByIdAndUpdate(
  analysis._id,
  { ...aiResult, status: "completed" },
  { returnDocument: "after" }  // ← updated
);

    res.status(200).json({
      message: "Resume analysis complete!",
      data: updated,
    });
  } catch (error) {
    console.error("Resume Analysis Error:", error);
    res.status(500).json({ message: "Analysis mein error aaya", error: error.message });
  }
};

export const getResumeHistory = async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("-resumePublicId");
    res.status(200).json({ data: analyses });
  } catch (error) {
    res.status(500).json({ message: "History fetch nahi hui", error: error.message });
  }
};

// ─────────────────────────────────────────
// 📝 MOCK TEST
// ─────────────────────────────────────────

export const generateTestController = async (req, res) => {
  try {
    const { jobRole, difficulty } = req.body;
    if (!jobRole) return res.status(400).json({ message: "Job role is required" });
    
    const { questions } = await generateTest(jobRole, difficulty);
 
    const testResult = await TestResult.create({
      userId: req.user._id,
      jobRole,
      difficulty: difficulty || "medium",
      totalQuestions: questions.length,
      questions: questions.map((q) => ({ ...q, userAnswer: null, isCorrect: false })),
      status: "generated",
    });

    const questionsForStudent = testResult.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
    }));

    res.status(200).json({
      message: "Test is ready!",
      testId: testResult._id,
      jobRole,
      difficulty: difficulty || "medium",
      questions: questionsForStudent,
    });
  } catch (error) {
    console.error("Test Generate Error:", error);
    res.status(500).json({ message: "Test generate nahi hua", error: error.message });
  }
};

export const submitTestController = async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;
    // answers = [{ questionIndex: 0, answer: "A" }, ...]

    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Didn't find test" });
    if (testResult.status === "completed")
      return res.status(400).json({ message: "This test is already submitted" });

    // Answers check karo
    let correct = 0;
    answers.forEach(({ questionIndex, answer }) => {
      const q = testResult.questions[questionIndex];
      if (q) {
        q.userAnswer = answer;
        q.isCorrect = q.correctAnswer === answer;
        if (q.isCorrect) correct++;
      }
    });

    const wrong = answers.length - correct;
    const skipped = testResult.totalQuestions - answers.length;
    const scorePercentage = Math.round((correct / testResult.totalQuestions) * 100);

    // AI se feedback lo
    const aiFeedback = await evaluateTest(testResult.jobRole, testResult.questions);

    // DB update karo
    testResult.correctAnswers = correct;
    testResult.wrongAnswers = wrong;
    testResult.skippedAnswers = skipped;
    testResult.scorePercentage = scorePercentage;
    testResult.timeTaken = timeTaken || null;
    testResult.overallFeedback = aiFeedback.overallFeedback;
    testResult.strongTopics = aiFeedback.strongTopics;
    testResult.topicsToImprove = aiFeedback.topicsToImprove;
    testResult.status = "completed";
    await testResult.save();

    res.status(200).json({
      message: "Test submitted!",
      data: testResult,
    });
  } catch (error) {
    console.error("Test Submit Error:", error);
    res.status(500).json({ message: "Test submit nahi hua", error: error.message });
  }
};

export const getTestHistory = async (req, res) => {
  try {
    const tests = await TestResult.find({ userId: req.user._id, status: "completed" })
      .sort({ createdAt: -1 })
      .select("jobRole difficulty scorePercentage correctAnswers totalQuestions createdAt overallFeedback");
    res.status(200).json({ data: tests });
  } catch (error) {
    res.status(500).json({ message: "Can't fetch history", error: error.message });
  }
};

// ─────────────────────────────────────────
// 🎤 VOICE MOCK INTERVIEW
// ─────────────────────────────────────────

export const startInterviewController = async (req, res) => {
  try {
    const { jobRole, experienceLevel } = req.body;
    if (!jobRole) return res.status(400).json({ message: "Job role is required " });

    // AI se pehla question lo
    const firstQuestion = await startInterview(jobRole, experienceLevel || "fresher");

    // DB mein session create karo
    const session = await InterviewSession.create({
      userId: req.user._id,
      jobRole,
      experienceLevel: experienceLevel || "fresher",
      status: "in-progress",
    });

    res.status(200).json({
      message: "Interview start! first question:",
      sessionId: session._id,
      ...firstQuestion,
    });
  } catch (error) {
    console.error("Interview Start Error:", error);
    res.status(500).json({ message: "Interview didn't start", error: error.message });
  }
};

export const submitAnswerController = async (req, res) => {
  try {
    const { sessionId, questionNumber, question, transcribedAnswer } = req.body;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Didn't find Interview session" });
    if (session.status === "completed")
      return res.status(400).json({ message: "This interview is already completed" });

    // AI se evaluate + next question lo
    const result = await evaluateAndNextQuestion(
      session.jobRole,
      session.experienceLevel,
      questionNumber,
      question,
      transcribedAnswer,
      session.rounds
    );

    // Is round ko save karo
    session.rounds.push({
      questionNumber,
      question,
      transcribedAnswer,
      answerScore: result.answerScore,
      feedback: result.feedback,
      suggestedAnswer: result.suggestedAnswer,
    });
    session.completedQuestions = questionNumber;
    await session.save();

    const isLastQuestion = questionNumber >= session.totalQuestions;

    res.status(200).json({
      message: isLastQuestion ? "Interview complete!" : "Next question ready:",
      answerScore: result.answerScore,
      feedback: result.feedback,
      isComplete: isLastQuestion,
      nextQuestion: result.nextQuestion,
      questionNumber: isLastQuestion ? null : questionNumber + 1,
    });
  } catch (error) {
    console.error("Answer Submit Error:", error);
    res.status(500).json({ message: "Answer not submitted", error: error.message });
  }
};

export const completeInterviewController = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Cannot find Session" });

    // AI se final feedback lo
    const finalFeedback = await generateFinalFeedback(
      session.jobRole,
      session.experienceLevel,
      session.rounds
    );

    // DB update karo
    Object.assign(session, {
      ...finalFeedback,
      status: "completed",
      completedAt: new Date(),
    });
    await session.save();

    res.status(200).json({
      message: "Interview feedback ready!",
      data: session,
    });
  } catch (error) {
    console.error("Interview Complete Error:", error);
    res.status(500).json({ message: "Final feedback not received", error: error.message });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await InterviewSession.find({
      userId: req.user._id,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .select("jobRole experienceLevel overallScore recommendation completedAt overallFeedback");
    res.status(200).json({ data: interviews });
  } catch (error) {
    res.status(500).json({ message: "History fetch nahi hui", error: error.message });
  }
};

// ─────────────────────────────────────────
// 💬 CHATBOT
// ─────────────────────────────────────────

export const chatController = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ message: "Message required hai" });

    let chatSession;

    if (sessionId) {
      // Existing session
      chatSession = await ChatHistory.findOne({ _id: sessionId, userId: req.user._id });
      if (!chatSession) return res.status(404).json({ message: "Chat session nahi mili" });
    } else {
      // Naya session banao
      const title = await generateSessionTitle(message);
      chatSession = await ChatHistory.create({
        userId: req.user._id,
        sessionTitle: title,
        messages: [],
      });
    }

    // AI se response lo (history ke saath)
    const aiResponse = await chatWithBot(message, chatSession.messages.slice(-10)); // last 10 msgs

    // Dono messages save karo
    chatSession.messages.push({ role: "user", content: message });
    chatSession.messages.push({ role: "assistant", content: aiResponse });
    chatSession.messageCount = chatSession.messages.length;
    chatSession.lastMessageAt = new Date();
    await chatSession.save();

    res.status(200).json({
      message: "Response ready!",
      sessionId: chatSession._id,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Chat mein error aaya", error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .select("sessionTitle messageCount lastMessageAt");
    res.status(200).json({ data: sessions });
  } catch (error) {
    res.status(500).json({ message: "Chat history fetch nahi hui", error: error.message });
  }
};

export const getChatSession = async (req, res) => {
  try {
    const session = await ChatHistory.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session nahi mili" });
    res.status(200).json({ data: session });
  } catch (error) {
    res.status(500).json({ message: "Session fetch nahi hua", error: error.message });
  }
};
