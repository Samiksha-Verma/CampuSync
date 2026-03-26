import User from "../models/User.model.js";

export const cleanUnverifiedUsers = async () => {
  try {

    const result = await User.deleteMany({
      isVerified: false,
      otpExpiry: { $lt: new Date() }
    });


  } catch (error) {
    console.log("Cleanup error:", error.message);
  }
};