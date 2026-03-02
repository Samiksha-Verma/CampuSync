import mongoose from "mongoose";

const certificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    provider: {
      type: String, // Coursera, Google, AWS etc.
      required: true,
    },

    description: {
      type: String,
    },

    officialLink: {
      type: String,
      required: true,
    },

    deadline: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Certification", certificationSchema);