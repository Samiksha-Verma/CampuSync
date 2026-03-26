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

     // 🔹 external OR campus opportunity
    type: {
    type: String,
    enum: ["internship", "job", "campus"],
    default:"campus",
    required: true
  },

  location:{
   type: String,
  },

  logo:{
  type: String,
  },

  // 🔹 admin approval required for campus jobs
  isApproved: {
    type: Boolean,
    default: false
  },

  // 🔹 recruiter reference (only campus opportunity)
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recruiter"
  },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdByRole: {
    type: String,
    enum: ["admin", "faculty", "recruiter"]
  },

   isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Opportunity", opportunitySchema);