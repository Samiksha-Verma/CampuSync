import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },
    userAnswer: {
      type: String,
      enum: ["A", "B", "C", "D", null],
      default: null,
    },
    isCorrect: { type: Boolean, default: false },
    explanation: { type: String }, // Galat answer ka explanation
    topic: { type: String },       // Kis topic se question hai
  },
  { _id: false }
);

const testResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobRole: {
      type: String,
      required: true, // e.g. "Frontend Developer", "Data Analyst"
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    totalQuestions: { type: Number, default: 10 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    scorePercentage: { type: Number, min: 0, max: 100 },
    timeTaken: { type: Number }, // seconds mein
    questions: [questionSchema],
    overallFeedback: { type: String },  // AI ka overall feedback
    topicsToImprove: [String],          // Weak topics
    strongTopics: [String],             // Strong topics
    status: {
      type: String,
      enum: ["generated", "in-progress", "completed"],
      default: "generated",
    },
  },
  { timestamps: true }
);

// Student ke saare tests latest pehle
testResultSchema.index({ userId: 1, createdAt: -1 });

const TestResult = mongoose.model("TestResult", testResultSchema);
export default TestResult;
