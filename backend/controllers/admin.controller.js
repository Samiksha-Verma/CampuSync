import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import Opportunity from "../models/Opportunity.model.js";
import Event from "../models/Events.model.js";
import Application from "../models/Application.model.js";
import Certification from "../models/Certification.model.js";
import { sendNotification } from "../services/notification.service.js";
import TestResult from "../models/TestResult.model.js";
import ResumeAnalysis from "../models/ResumeAnalysis.model.js";
import InterviewSession from "../models/InterviewSession.model.js";

// Helper — broadcast to all students
const notifyAllStudents = async (title, message, type) => {
  const students = await User.find({ role: "student" }).select("_id");
  for (const student of students) {
    await sendNotification({ userId: student._id, title, message, type });
  }
};

// ─────────────────────────────────────────
// 📊 DASHBOARD
// ─────────────────────────────────────────
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      students, faculty, recruiters,
      events, opportunities, applications,
      pendingRecruiters, pendingOpportunities,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "faculty" }),
      User.countDocuments({ role: "recruiter" }),
      Event.countDocuments({ isActive: true }),
      Opportunity.countDocuments({ isActive: true }),
      Application.countDocuments(),
      User.countDocuments({ role: "recruiter", isApproved: false }),
      Opportunity.countDocuments({ type: "campus", isApproved: false }),
    ]);

    res.json({
      students, faculty, recruiters,
      events, opportunities, applications,
      pendingRecruiters, pendingOpportunities,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 🤖 AI STATS
// ─────────────────────────────────────────
export const getAIStats = async (req, res) => {
  try {
    const [
      totalTests,
      totalResumes,
      totalInterviews,
      avgTestScore,
      avgResumeScore,
      testsByType,
    ] = await Promise.all([
      TestResult.countDocuments({ status: "completed" }),
      ResumeAnalysis.countDocuments({ status: "completed" }),
      InterviewSession.countDocuments({ status: "completed" }),
      TestResult.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, avg: { $avg: "$scorePercentage" } } },
      ]),
      ResumeAnalysis.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, avg: { $avg: "$overallScore" } } },
      ]),
      TestResult.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$testType", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      totalTests,
      totalResumes,
      totalInterviews,
      avgTestScore: Math.round(avgTestScore[0]?.avg || 0),
      avgResumeScore: Math.round(avgResumeScore[0]?.avg || 0),
      testsByType,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 👥 ALL USERS
// ─────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 👨‍🏫 FACULTY CRUD
// ─────────────────────────────────────────
export const createFaculty = async (req, res) => {
  try {
    const { collegeId, name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const faculty = await User.create({
      collegeId, name, email,
      password: hashedPassword,
      role: "faculty",
      isVerified: true,
    });
    res.status(201).json({ message: "Faculty created successfully", faculty });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData = { ...rest };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const faculty = await User.findByIdAndUpdate(
      req.params.id, updateData, { new: true }
    ).select("-password");
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    res.json({ message: "Faculty updated", faculty });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Faculty deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 🏢 RECRUITER APPROVAL
// ─────────────────────────────────────────
export const getPendingRecruiters = async (req, res) => {
  try {
    const recruiters = await User.find({
      role: "recruiter", isApproved: false,
    }).select("-password");
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveRecruiter = async (req, res) => {
  try {
    const recruiter = await User.findByIdAndUpdate(
      req.params.id, { isApproved: true }, { new: true }
    ).select("-password");
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

    // Notify recruiter
    await sendNotification({
      userId: recruiter._id,
      title: "Account Approved!",
      message: "Your recruiter account has been approved. You can now post opportunities.",
      type: "opportunity",
    });

    res.json({ message: "Recruiter approved", recruiter });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectRecruiter = async (req, res) => {
  try {
    const recruiter = await User.findById(req.params.id).select("-password");
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

    await sendNotification({
      userId: recruiter._id,
      title: "Account Not Approved",
      message: "Your recruiter account was not approved. Please contact admin for details.",
      type: "opportunity",
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Recruiter rejected and removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 💼 OPPORTUNITY APPROVAL + CRUD
// ─────────────────────────────────────────
export const getPendingOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({
      type: "campus", isApproved: false,
    }).populate("recruiter", "name email companyName");
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id, { isApproved: true }, { new: true }
    );
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });

    // Notify all students
    await notifyAllStudents(
      "New Campus Opportunity!",
      `${opportunity.company} is hiring for ${opportunity.role}. Apply now!`,
      "opportunity"
    );

    res.json({ message: "Opportunity approved", opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate("recruiter", "_id");

    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });

    // Notify recruiter
    if (opportunity.recruiter) {
      await sendNotification({
        userId: opportunity.recruiter._id,
        title: "Opportunity Not Approved",
        message: `Your opportunity "${opportunity.role}" was not approved by admin.`,
        type: "opportunity",
      });
    }

    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Opportunity rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createExternalOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.create({
      ...req.body,
      isApproved: true,
      createdBy: req.user._id,
      createdByRole: "admin",
    });

    // Notify all students
    await notifyAllStudents(
      "New Opportunity Posted!",
      `${opportunity.company} is hiring for ${opportunity.role}. Check it out!`,
      "opportunity"
    );

    res.status(201).json({ message: "Opportunity created", opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    res.json({ message: "Opportunity updated", opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteOpportunity = async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Opportunity deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 📅 EVENTS CRUD
// ─────────────────────────────────────────
export const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user._id,
    });

    // Notify all students
    await notifyAllStudents(
      "New Event Added!",
      `${event.title} by ${event.club}. Don't miss it!`,
      "event"
    );

    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event updated", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 🎓 CERTIFICATIONS CRUD
// ─────────────────────────────────────────
export const addCertification = async (req, res) => {
  try {
    const certification = await Certification.create({
      ...req.body,
      createdBy: req.user._id,
    });

    // Notify all students
    await notifyAllStudents(
      "New Certification Available!",
      `${certification.title} by ${certification.provider} is now available. Enroll now!`,
      "certification"
    );

    res.status(201).json({ message: "Certification added", certification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCertification = async (req, res) => {
  try {
    const certification = await Certification.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!certification) return res.status(404).json({ message: "Certification not found" });
    res.json({ message: "Certification updated", certification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCertification = async (req, res) => {
  try {
    await Certification.findByIdAndDelete(req.params.id);
    res.json({ message: "Certification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};