import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String },
  options: { A: String, B: String, C: String, D: String },
  correctAnswer: { type: String },
  userAnswer: { type: String, default: null },
  isCorrect: { type: Boolean, default: false },
  explanation: { type: String },
  topic: { type: String },
  category: { type: String },
  questionType: { type: String },
  userAnswer_text: { type: String },
  expectedPoints: [String],
  maxScore: { type: Number },
  achievedScore: { type: Number },
  feedback_text: { type: String },
  missedPoints: [String],
  goodPoints: [String],
}, { _id: false });

const testCaseResultSchema = new mongoose.Schema({
  testCase: { type: Number },
  input: { type: String },
  expectedOutput: { type: String },
  passed: { type: Boolean },
  note: { type: String },
}, { _id: false });

const codingSubmissionSchema = new mongoose.Schema({
  problemIndex: { type: Number },
  language: { type: String },
  userCode: { type: String },
  overallScore: { type: Number },
  correctnessScore: { type: Number },
  efficiencyScore: { type: Number },
  codeQualityScore: { type: Number },
  testCaseResults: [testCaseResultSchema],
  testCasesPassed: { type: Number },
  totalTestCases: { type: Number },
  isCorrect: { type: Boolean },
  timeComplexity: { type: String },
  spaceComplexity: { type: String },
  feedback: { type: String },
  improvements: [String],
  optimalApproach: { type: String },
  timeTaken: { type: Number },
  submittedAt: { type: Date },
}, { _id: false });

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testType: {
    type: String,
    enum: ["mcq", "coding", "aptitude", "dsa", "subjective"],
    default: "mcq",
  },
  jobRole: { type: String },
  language: { type: String },
  dsaTopic: { type: String },
  aptitudeType: { type: String },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },

  // MCQ / Aptitude / DSA
  totalQuestions: { type: Number },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  skippedAnswers: { type: Number, default: 0 },
  scorePercentage: { type: Number },
  questions: [questionSchema],

  // Coding — 2 problems
  codingProblems: [{ type: Object }],       // Array of 2 problems
  codingSubmissions: [codingSubmissionSchema], // One per problem
  overallScore: { type: Number },

  // Subjective
  totalScore: { type: Number },
  maxPossibleScore: { type: Number },

  // Common feedback
  overallFeedback: { type: String },
  strongTopics: [String],
  topicsToImprove: [String],
  strengths: [String],
  improvements: [String],

  // Aptitude specific
  categoryBreakdown: { type: Object },
  studyTips: [String],

  // DSA specific
  conceptualScore: { type: Number },
  complexityScore: { type: Number },
  nextTopicsToStudy: [String],

  timeTaken: { type: Number },
  status: {
    type: String,
    enum: ["generated", "in-progress", "completed"],
    default: "generated",
  },
}, { timestamps: true });

testResultSchema.index({ userId: 1, createdAt: -1 });
const TestResult = mongoose.model("TestResult", testResultSchema);
export default TestResult;
