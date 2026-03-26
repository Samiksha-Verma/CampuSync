import mongoose from "mongoose";

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeUrl: {
      type: String,
      required: true, // Cloudinary URL
    },
    resumePublicId: {
      type: String, // Cloudinary public_id (delete ke liye)
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    sectionScores: {
      skills: { type: Number, min: 0, max: 100 },
      experience: { type: Number, min: 0, max: 100 },
      education: { type: Number, min: 0, max: 100 },
      formatting: { type: Number, min: 0, max: 100 },
      summary: { type: Number, min: 0, max: 100 },
    },
    strengths: [String],       // Kya achha hai resume mein
    improvements: [String],    // Kya improve karna chahiye
    suggestions: [String],     // Specific suggestions
    atsScore: {
      type: Number,
      min: 0,
      max: 100,                // ATS (Applicant Tracking System) compatibility
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

// Student ke saare analyses latest pehle
resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

const ResumeAnalysis = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
export default ResumeAnalysis;
