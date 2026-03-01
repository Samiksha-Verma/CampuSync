import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    club: { type: String, required: true },
    coordinator: { type: String },
    contact: { type: String },
    description: { type: String },
    registrationLink: { type: String },

    deadline: { type: Date, required: true },

    isActive: {
      type: Boolean,
      default: true, // auto false after deadline
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);