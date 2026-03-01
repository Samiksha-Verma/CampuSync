import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { validateCollegeId } from "../utils/collegeIdValidator.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendOTP } from "../services/email.service.js";


export const register = async (req, res) => {
  try {
    const { collegeId, name, email, password } = req.body;

    
    if (!validateCollegeId(collegeId)) {
      return res.status(400).json({ message: "Invalid College ID format" });
    }

    const existingUser = await User.findOne({ collegeId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    

    const user = await User.create({
      collegeId,
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // email service yahan call hoga (next step)
    console.log("OTP:", otp);
    await sendOTP(email, otp);
    console.log("EMAIL USER:", process.env.EMAIL_USER);
console.log("EMAIL PASS LENGTH:", process.env.EMAIL_PASS?.length);

    res.status(201).json({
      message: "Registered successfully. Verify OTP.",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { collegeId, otp } = req.body;

    const user = await User.findOne({ collegeId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Account verified successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { collegeId, password } = req.body;

    const user = await User.findOne({ collegeId });

    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify OTP first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};