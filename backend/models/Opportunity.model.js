import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    eligibility: {
      type: String,
    },

    skills: [
      {
        type: String,
      },
    ],

    stipendOrSalary: {
      type: String,
    },

    officialLink: {
      type: String,
      required: true, // 🔥 MAIN FIX
    },

    deadline: {
      type: Date,
      required: true,
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

export default mongoose.model("Opportunity", opportunitySchema);