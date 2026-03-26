import mongoose from "mongoose";

const interviewRoundSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    question: { type: String, required: true },       // AI ka question
    transcribedAnswer: { type: String },              // Voice → Text
    answerScore: { type: Number, min: 0, max: 10 },   // Is question ka score
    feedback: { type: String },                       // Is answer ka feedback
    suggestedAnswer: { type: String },                // AI ka better answer
    duration: { type: Number },                       // Kitne seconds mein jawab diya
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobRole: {
      type: String,
      required: true, // e.g. "Backend Developer", "UI/UX Designer"
    },
    experienceLevel: {
      type: String,
      enum: ["fresher", "1-2 years", "3-5 years"],
      default: "fresher",
    },
    totalQuestions: { type: Number, default: 5 },
    completedQuestions: { type: Number, default: 0 },
    rounds: [interviewRoundSchema],     // Har question ka record

    // Final Scores
    overallScore: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 10 },
    technicalScore: { type: Number, min: 0, max: 10 },
    confidenceScore: { type: Number, min: 0, max: 10 },

    // Final Feedback
    strengths: [String],
    areasToImprove: [String],
    overallFeedback: { type: String },
    recommendation: {
      type: String,
      enum: ["Strong Hire", "Hire", "Maybe", "No Hire"],
    },

    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned"],
      default: "in-progress",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Student ke saare interviews latest pehle
interviewSessionSchema.index({ userId: 1, createdAt: -1 });

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
export default InterviewSession;
