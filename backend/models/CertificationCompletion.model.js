import mongoose from "mongoose";

const certificationCompletionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certification",
      required: true,
    },

    status: {
      type: String,
      enum: ["enrolled", "completed"],
      default: "enrolled",
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "CertificationCompletion",
  certificationCompletionSchema
);