import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
  // student ke liye
  collegeId: {
    type: String,
    unique: true,
    sparse: true, // recruiter ke case me allow karega null
  },

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["student", "faculty", "admin", "recruiter"],
    required: true,
  },

  // recruiter specific fields
  companyName: {
    type: String,
  },

  companyWebsite: {
    type: String,
  },

  // recruiter approval system
  isApproved: {
    type: Boolean,
    default: false,
  },

  // OTP verification
  isVerified: {
    type: Boolean,
    default: false,
  },

  otp: String,

  otpExpiry: Date,

},
{ timestamps: true }
);

export default mongoose.model("User", userSchema);