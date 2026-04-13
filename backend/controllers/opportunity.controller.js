import Opportunity from "../models/Opportunity.model.js";
import User from "../models/User.model.js";
import { sendNotification } from "../services/notification.service.js";

export const createExternalOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.create({
      ...req.body,
      type: req.body.type || "internship",
      createdBy: req.user._id,
      createdByRole: req.user.role,
      isApproved: true,
    });

    // Notify all students
    const students = await User.find({ role: "student" }).select("_id");
    for (const student of students) {
      await sendNotification({
        userId: student._id,
        title: "New Opportunity Posted!",
        message: `${opportunity.company} is hiring for ${opportunity.role}. Apply now!`,
        type: "opportunity",
      });
    }

    res.status(201).json({ message: "Opportunity created", opportunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recruiterPostOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.create({
      ...req.body,
      recruiter: req.user._id,
      type: "campus",
      createdByRole: "recruiter",
      isApproved: false, // Admin approval required
    });

    res.status(201).json({
      message: "Opportunity submitted for admin approval",
      opportunity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({
      isApproved: true,
      isActive: true,
    });
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};