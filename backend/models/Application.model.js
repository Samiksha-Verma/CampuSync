import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    appliedToType: {
      type: String,
      enum: ["event", "opportunity"],
      required: true,
    },

    appliedToId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "appliedToType",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);