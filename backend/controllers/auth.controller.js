import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { validateCollegeId } from "../utils/collegeIdValidator.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendOTP } from "../services/email.service.js";


// REGISTER
export const register = async (req, res) => {
  try {

    const {
      role,
      collegeId,
      name,
      email,
      password,
      companyName,
      companyWebsite
    } = req.body;


    // ---------- STUDENT REGISTER ----------
    if (role === "student") {

      if (!collegeId) {
        return res.status(400).json({
          message: "College ID is required for students"
        });
      }

      if (!validateCollegeId(collegeId)) {
        return res.status(400).json({
          message: "Invalid College ID format"
        });
      }

      const existingUser = await User.findOne({ collegeId });

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const otp = generateOTP();

      const user = await User.create({
        role,
        collegeId,
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpiry: Date.now() + 10 * 60 * 1000
      });

      await sendOTP(email, otp);

      return res.status(201).json({
        message: "Student registered. Verify OTP.",
        userId: user._id
      });
    }


    // ---------- RECRUITER REGISTER ----------
    if (role === "recruiter") {

      if (!companyName) {
        return res.status(400).json({
          message: "Company name is required"
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          message: "Recruiter already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        role,
        name,
        email,
        password: hashedPassword,
        companyName,
        companyWebsite,
        isApproved: false,
        isVerified: true
      });

      return res.status(201).json({
        message: "Recruiter registered. Waiting for admin approval.",
        userId: user._id
      });
    }


    return res.status(400).json({
      message: "Invalid role"
    });


  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// VERIFY OTP (only for students)
export const verifyOTP = async (req, res) => {
  try {

    const { collegeId, otp } = req.body;

    const user = await User.findOne({ collegeId });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP"
      });
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
      token
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// LOGIN
export const login = async (req, res) => {
  try {

    const { collegeId, email, password } = req.body;

    let user;

    // student login
    if (collegeId) {
      user = await User.findOne({ collegeId });
    }

    // recruiter login
    if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        message: "Invalid credentials"
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify OTP first"
      });
    }

    // recruiter approval check
    if (user.role === "recruiter" && !user.isApproved) {
      return res.status(403).json({
        message: "Recruiter account pending admin approval"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};