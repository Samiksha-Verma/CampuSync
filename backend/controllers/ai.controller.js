import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

import { analyzeResume } from "../../ai-services/resumeAnalyzer.js";
import {
  generateTest, evaluateTest,
  generateCodingTest, evaluateCodingProblem,
  generateAptitudeTest, evaluateAptitudeTest,
  generateDSATest, evaluateDSATest,
  generateSubjectiveTest, evaluateSubjectiveTest,
} from "../../ai-services/mockTestGenerator.js";
import { startInterview, evaluateAndNextQuestion, generateFinalFeedback } from "../../ai-services/mockInterviewer.js";
import { chatWithBot, generateSessionTitle } from "../../ai-services/chatbot.js";

import ResumeAnalysis from "../models/ResumeAnalysis.model.js";
import TestResult from "../models/TestResult.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import ChatHistory from "../models/ChatHistory.model.js";

// ─────────────────────────────────────────
// 📄 RESUME ANALYZER
// ─────────────────────────────────────────
export const analyzeResumeController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Resume file required hai" });
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "campusync/resumes", resource_type: "raw" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
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
    const resumeText = await extractTextFromPDF(req.file.buffer);
    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ message: "Resume mein text nahi mila." });
    const analysis = await ResumeAnalysis.create({
      userId: req.user._id, resumeUrl: uploadResult.secure_url,
      resumePublicId: uploadResult.public_id, status: "processing",
    });
    const aiResult = await analyzeResume(resumeText);
    const updated = await ResumeAnalysis.findByIdAndUpdate(
      analysis._id, { ...aiResult, status: "completed" }, { returnDocument: "after" }
    );
    res.status(200).json({ message: "Resume analysis complete!", data: updated });
  } catch (error) {
    console.error("Resume Analysis Error:", error);
    res.status(500).json({ message: "Analysis mein error aaya", error: error.message });
  }
};

export const getResumeHistory = async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).select("-resumePublicId");
    res.status(200).json({ data: analyses });
  } catch (error) {
    res.status(500).json({ message: "History fetch nahi hui", error: error.message });
  }
};

// ─────────────────────────────────────────
// 📝 MCQ TEST
// ─────────────────────────────────────────
export const generateTestController = async (req, res) => {
  try {
    const { jobRole, difficulty } = req.body;
    if (!jobRole) return res.status(400).json({ message: "Job role required hai" });
    const { questions } = await generateTest(jobRole, difficulty);
    const testResult = await TestResult.create({
      userId: req.user._id, testType: "mcq", jobRole,
      difficulty: difficulty || "medium", totalQuestions: questions.length,
      questions: questions.map((q) => ({ ...q, userAnswer: null, isCorrect: false })),
      status: "generated",
    });
    res.status(200).json({
      message: "Test is ready!", testId: testResult._id, jobRole,
      difficulty: difficulty || "medium",
      questions: testResult.questions.map((q) => ({ questionText: q.questionText, options: q.options, topic: q.topic })),
    });
  } catch (error) {
    res.status(500).json({ message: "Test generate nahi hua", error: error.message });
  }
};

export const submitTestController = async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;
    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Test nahi mila" });
    let correct = 0;
    answers.forEach(({ questionIndex, answer }) => {
      const q = testResult.questions[questionIndex];
      if (q) { q.userAnswer = answer; q.isCorrect = q.correctAnswer === answer; if (q.isCorrect) correct++; }
    });
    const scorePercentage = Math.round((correct / testResult.totalQuestions) * 100);
    const aiFeedback = await evaluateTest(testResult.jobRole, testResult.questions);
    Object.assign(testResult, {
      correctAnswers: correct, wrongAnswers: answers.length - correct,
      skippedAnswers: testResult.totalQuestions - answers.length,
      scorePercentage, timeTaken: timeTaken || null,
      overallFeedback: aiFeedback.overallFeedback,
      strongTopics: aiFeedback.strongTopics, topicsToImprove: aiFeedback.topicsToImprove,
      status: "completed",
    });
    await testResult.save();
    res.status(200).json({ message: "Test submitted successfully!", data: testResult });
  } catch (error) {
    res.status(500).json({ message: "Test submit nahi hua", error: error.message });
  }
};

export const getTestHistory = async (req, res) => {
  try {
    const tests = await TestResult.find({ userId: req.user._id, status: "completed" })
      .sort({ createdAt: -1 })
      .select("testType jobRole language aptitudeType dsaTopic difficulty scorePercentage overallScore totalScore correctAnswers totalQuestions createdAt overallFeedback");
    res.status(200).json({ data: tests });
  } catch (error) {
    res.status(500).json({ message: "History fetch nahi hui", error: error.message });
  }
};

// ─────────────────────────────────────────
// 💻 CODING TEST — 2 Problems + Test Cases
// ─────────────────────────────────────────
export const generateCodingTestController = async (req, res) => {
  try {
    const { dsaTopic, difficulty } = req.body;
    if (!dsaTopic) return res.status(400).json({ message: "DSA topic required hai" });

    const { problems } = await generateCodingTest(dsaTopic, difficulty);

    const testResult = await TestResult.create({
      userId: req.user._id,
      testType: "coding",
      dsaTopic,
      difficulty: difficulty || "medium",
      codingProblems: problems, // Array of 2 problems
      codingSubmissions: [], // Will be filled on submit
      status: "generated",
    });

    res.status(200).json({
      message: "Coding test ready!",
      testId: testResult._id,
      dsaTopic,
      problems: problems.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints: p.constraints,
        examples: p.examples,
        testCases: p.testCases,
        starterCode: p.starterCode,
        topic: p.topic,
        timeLimit: p.timeLimit,
      })),
    });
  } catch (error) {
    console.error("Coding Test Error:", error);
    res.status(500).json({ message: "Coding test generate nahi hua", error: error.message });
  }
};

// Submit ONE problem at a time
export const submitCodingProblemController = async (req, res) => {
  try {
    const { testId, problemIndex, userCode, language, timeTaken } = req.body;
    if (!testId || userCode === undefined || problemIndex === undefined)
      return res.status(400).json({ message: "testId, problemIndex, aur code required hai" });

    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Test nahi mila" });

    const problem = testResult.codingProblems[problemIndex];
    if (!problem) return res.status(400).json({ message: "Problem nahi mili" });

    // Evaluate this problem
    const evaluation = await evaluateCodingProblem(problem, userCode, language);

    // Save this submission
    const submissionIndex = testResult.codingSubmissions.findIndex(s => s.problemIndex === problemIndex);
    const submission = {
      problemIndex,
      language,
      userCode,
      overallScore: evaluation.overallScore,
      correctnessScore: evaluation.correctnessScore,
      efficiencyScore: evaluation.efficiencyScore,
      codeQualityScore: evaluation.codeQualityScore,
      testCaseResults: evaluation.testCaseResults,
      testCasesPassed: evaluation.testCasesPassed,
      totalTestCases: evaluation.totalTestCases,
      isCorrect: evaluation.isCorrect,
      timeComplexity: evaluation.timeComplexity,
      spaceComplexity: evaluation.spaceComplexity,
      feedback: evaluation.feedback,
      improvements: evaluation.improvements,
      optimalApproach: evaluation.optimalApproach,
      timeTaken: timeTaken || null,
      submittedAt: new Date(),
    };

    if (submissionIndex >= 0) {
      testResult.codingSubmissions[submissionIndex] = submission; // Update existing
    } else {
      testResult.codingSubmissions.push(submission); // Add new
    }

    // If both problems submitted, mark as completed
    if (testResult.codingSubmissions.length >= 2) {
      const totalScore = Math.round(
        testResult.codingSubmissions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / testResult.codingSubmissions.length
      );
      testResult.overallScore = totalScore;
      testResult.status = "completed";
    }

    await testResult.save();

    res.status(200).json({
      message: "Problem submitted!",
      evaluation,
      allSubmitted: testResult.codingSubmissions.length >= 2,
    });
  } catch (error) {
    console.error("Coding Submit Error:", error);
    res.status(500).json({ message: "Code submit nahi hua", error: error.message });
  }
};

// Get full coding test result
export const getCodingTestResultController = async (req, res) => {
  try {
    const { testId } = req.params;
    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Test nahi mila" });
    res.status(200).json({ data: testResult });
  } catch (error) {
    res.status(500).json({ message: "Result fetch nahi hua", error: error.message });
  }
};

// ─────────────────────────────────────────
// 🧮 APTITUDE TEST
// ─────────────────────────────────────────
export const generateAptitudeTestController = async (req, res) => {
  try {
    const { aptitudeType, difficulty } = req.body;
    const { questions } = await generateAptitudeTest(aptitudeType || "mixed", difficulty);
    const testResult = await TestResult.create({
      userId: req.user._id, testType: "aptitude", aptitudeType: aptitudeType || "mixed",
      difficulty: difficulty || "medium", totalQuestions: questions.length,
      questions: questions.map((q) => ({ ...q, userAnswer: null, isCorrect: false })),
      status: "generated",
    });
    res.status(200).json({
      message: "Aptitude test ready!", testId: testResult._id, aptitudeType: aptitudeType || "mixed",
      questions: testResult.questions.map((q) => ({ questionText: q.questionText, options: q.options, category: q.category, topic: q.topic })),
    });
  } catch (error) {
    res.status(500).json({ message: "Aptitude test generate nahi hua", error: error.message });
  }
};

export const submitAptitudeTestController = async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;
    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Test nahi mila" });
    let correct = 0;
    answers.forEach(({ questionIndex, answer }) => {
      const q = testResult.questions[questionIndex];
      if (q) { q.userAnswer = answer; q.isCorrect = q.correctAnswer === answer; if (q.isCorrect) correct++; }
    });
    const scorePercentage = Math.round((correct / testResult.totalQuestions) * 100);
    const aiFeedback = await evaluateAptitudeTest(testResult.aptitudeType, testResult.questions);
    Object.assign(testResult, {
      correctAnswers: correct, wrongAnswers: answers.length - correct,
      skippedAnswers: testResult.totalQuestions - answers.length,
      scorePercentage, overallFeedback: aiFeedback.overallFeedback,
      categoryBreakdown: aiFeedback.categoryBreakdown,
      strongTopics: aiFeedback.strongTopics, topicsToImprove: aiFeedback.topicsToImprove,
      studyTips: aiFeedback.studyTips, timeTaken: timeTaken || null, status: "completed",
    });
    await testResult.save();
    res.status(200).json({ message: "Aptitude test submitted!", data: testResult });
  } catch (error) {
    res.status(500).json({ message: "Aptitude test submit nahi hua", error: error.message });
  }
};

// ─────────────────────────────────────────
// 🧠 DSA TEST
// ─────────────────────────────────────────
export const generateDSATestController = async (req, res) => {
  try {
    const { dsaTopic, difficulty } = req.body;
    if (!dsaTopic) return res.status(400).json({ message: "DSA topic required hai" });
    const { questions } = await generateDSATest(dsaTopic, difficulty);
    const testResult = await TestResult.create({
      userId: req.user._id, testType: "dsa", dsaTopic,
      difficulty: difficulty || "medium", totalQuestions: questions.length,
      questions: questions.map((q) => ({ ...q, userAnswer: null, isCorrect: false })),
      status: "generated",
    });
    res.status(200).json({
      message: "DSA test ready!", testId: testResult._id, dsaTopic,
      questions: testResult.questions.map((q) => ({ questionText: q.questionText, options: q.options, questionType: q.questionType, topic: q.topic })),
    });
  } catch (error) {
    res.status(500).json({ message: "DSA test generate nahi hua", error: error.message });
  }
};

export const submitDSATestController = async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;
    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Test nahi mila" });
    let correct = 0;
    answers.forEach(({ questionIndex, answer }) => {
      const q = testResult.questions[questionIndex];
      if (q) { q.userAnswer = answer; q.isCorrect = q.correctAnswer === answer; if (q.isCorrect) correct++; }
    });
    const scorePercentage = Math.round((correct / testResult.totalQuestions) * 100);
    const aiFeedback = await evaluateDSATest(testResult.dsaTopic, testResult.questions);
    Object.assign(testResult, {
      correctAnswers: correct, wrongAnswers: answers.length - correct,
      skippedAnswers: testResult.totalQuestions - answers.length,
      scorePercentage, overallFeedback: aiFeedback.overallFeedback,
      conceptualScore: aiFeedback.conceptualScore, complexityScore: aiFeedback.complexityScore,
      strongTopics: aiFeedback.strongAreas, topicsToImprove: aiFeedback.weakAreas,
      nextTopicsToStudy: aiFeedback.nextTopicsToStudy,
      timeTaken: timeTaken || null, status: "completed",
    });
    await testResult.save();
    res.status(200).json({ message: "DSA test submitted!", data: testResult });
  } catch (error) {
    res.status(500).json({ message: "DSA test submit nahi hua", error: error.message });
  }
};

// ─────────────────────────────────────────
// 📝 SUBJECTIVE TEST
// ─────────────────────────────────────────
export const generateSubjectiveTestController = async (req, res) => {
  try {
    const { jobRole, difficulty } = req.body;
    if (!jobRole) return res.status(400).json({ message: "Job role required hai" });
    const { questions } = await generateSubjectiveTest(jobRole, difficulty);
    const testResult = await TestResult.create({
      userId: req.user._id, testType: "subjective", jobRole,
      difficulty: difficulty || "medium", totalQuestions: questions.length,
      maxPossibleScore: questions.reduce((sum, q) => sum + (q.maxScore || 10), 0),
      questions: questions.map((q) => ({ ...q, userAnswer_text: "" })),
      status: "generated",
    });
    res.status(200).json({
      message: "Subjective test ready!", testId: testResult._id, jobRole,
      questions: testResult.questions.map((q) => ({ questionText: q.questionText, topic: q.topic, maxScore: q.maxScore })),
    });
  } catch (error) {
    res.status(500).json({ message: "Subjective test generate nahi hua", error: error.message });
  }
};

export const submitSubjectiveTestController = async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;
    const testResult = await TestResult.findOne({ _id: testId, userId: req.user._id });
    if (!testResult) return res.status(404).json({ message: "Test nahi mila" });
    answers.forEach(({ questionIndex, answer }) => {
      if (testResult.questions[questionIndex]) testResult.questions[questionIndex].userAnswer_text = answer;
    });
    const questionsWithAnswers = testResult.questions.map((q, i) => ({
      index: i, question: q.questionText, expectedPoints: q.expectedPoints,
      userAnswer: q.userAnswer_text, maxScore: q.maxScore,
    }));
    const evaluation = await evaluateSubjectiveTest(testResult.jobRole, questionsWithAnswers);
    evaluation.evaluations.forEach((e) => {
      const q = testResult.questions[e.questionIndex];
      if (q) { q.achievedScore = e.score; q.feedback_text = e.feedback; q.missedPoints = e.missedPoints; q.goodPoints = e.goodPoints; }
    });
    const scorePercentage = Math.round((evaluation.totalScore / evaluation.maxPossibleScore) * 100);
    Object.assign(testResult, {
      totalScore: evaluation.totalScore, scorePercentage,
      overallFeedback: evaluation.overallFeedback, strengths: evaluation.strengths,
      improvements: evaluation.improvements, timeTaken: timeTaken || null, status: "completed",
    });
    await testResult.save();
    res.status(200).json({ message: "Subjective test submitted!", data: testResult });
  } catch (error) {
    res.status(500).json({ message: "Subjective test submit nahi hua", error: error.message });
  }
};

// ─────────────────────────────────────────
// 🎤 VOICE INTERVIEW
// ─────────────────────────────────────────
export const startInterviewController = async (req, res) => {
  try {
    const { jobRole, experienceLevel } = req.body;
    if (!jobRole) return res.status(400).json({ message: "Job role required hai" });
    const firstQuestion = await startInterview(jobRole, experienceLevel || "fresher");
    const session = await InterviewSession.create({
      userId: req.user._id, jobRole, experienceLevel: experienceLevel || "fresher", status: "in-progress",
    });
    res.status(200).json({ message: "Interview started! First question:", sessionId: session._id, ...firstQuestion });
  } catch (error) {
    console.error("Interview Start Error:", error);
    res.status(500).json({ message: "Could not start interview", error: error.message });
  }
};

export const submitAnswerController = async (req, res) => {
  try {
    const { sessionId, questionNumber, question, transcribedAnswer } = req.body;
    const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session nahi mili" });
    const result = await evaluateAndNextQuestion(
      session.jobRole, session.experienceLevel, questionNumber, question, transcribedAnswer, session.rounds
    );
    session.rounds.push({ questionNumber, question, transcribedAnswer, answerScore: result.answerScore, feedback: result.feedback, suggestedAnswer: result.suggestedAnswer });
    session.completedQuestions = questionNumber;
    await session.save();
    const isLastQuestion = questionNumber >= session.totalQuestions;
    res.status(200).json({ message: isLastQuestion ? "Interview complete!" : "Next question:", answerScore: result.answerScore, feedback: result.feedback, isComplete: isLastQuestion, nextQuestion: result.nextQuestion, questionNumber: isLastQuestion ? null : questionNumber + 1 });
  } catch (error) {
    res.status(500).json({ message: "Answer submit nahi hua", error: error.message });
  }
};

export const completeInterviewController = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await InterviewSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session nahi mili" });
    const finalFeedback = await generateFinalFeedback(session.jobRole, session.experienceLevel, session.rounds);
    Object.assign(session, { ...finalFeedback, status: "completed", completedAt: new Date() });
    await session.save();
    res.status(200).json({ message: "Interview feedback ready!", data: session });
  } catch (error) {
    res.status(500).json({ message: "Final feedback nahi mili", error: error.message });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await InterviewSession.find({ userId: req.user._id, status: "completed" })
      .sort({ createdAt: -1 }).select("jobRole experienceLevel overallScore recommendation completedAt overallFeedback");
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
      chatSession = await ChatHistory.findOne({ _id: sessionId, userId: req.user._id });
      if (!chatSession) return res.status(404).json({ message: "Session nahi mili" });
    } else {
      const title = await generateSessionTitle(message);
      chatSession = await ChatHistory.create({ userId: req.user._id, sessionTitle: title, messages: [] });
    }
    const aiResponse = await chatWithBot(message, chatSession.messages.slice(-10));
    chatSession.messages.push({ role: "user", content: message });
    chatSession.messages.push({ role: "assistant", content: aiResponse });
    chatSession.messageCount = chatSession.messages.length;
    chatSession.lastMessageAt = new Date();
    await chatSession.save();
    res.status(200).json({ message: "Response ready!", sessionId: chatSession._id, response: aiResponse });
  } catch (error) {
    res.status(500).json({ message: "Chat mein error aaya", error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id }).sort({ lastMessageAt: -1 }).select("sessionTitle messageCount lastMessageAt");
    res.status(200).json({ data: sessions });
  } catch (error) {
    res.status(500).json({ message: "Chat history fetch nahi hui", error: error.message });
  }
};

export const getChatSession = async (req, res) => {
  try {
    const session = await ChatHistory.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session nahi mili" });
    res.status(200).json({ data: session });
  } catch (error) {
    res.status(500).json({ message: "Session fetch nahi hua", error: error.message });
  }
};
