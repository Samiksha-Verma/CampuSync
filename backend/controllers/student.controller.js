import Application from "../models/Application.model.js";
import Opportunity from "../models/Opportunity.model.js";


// 1️⃣ Student Dashboard Stats
export const getStudentDashboard = async (req, res) => {
  try {

    const studentId = req.user._id;

    const totalApplications = await Application.countDocuments({
      student: studentId
    });

    const pending = await Application.countDocuments({
      student: studentId,
      status: "pending"
    });

    const shortlisted = await Application.countDocuments({
      student: studentId,
      status: "shortlisted"
    });

    const rejected = await Application.countDocuments({
      student: studentId,
      status: "rejected"
    });

    const selected = await Application.countDocuments({
      student: studentId,
      status: "selected"
    });

    res.json({
      totalApplications,
      pending,
      shortlisted,
      rejected,
      selected
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 2️⃣ My Applications
export const getMyApplications = async (req, res) => {
  try {

    const applications = await Application.find({
      student: req.user._id
    })
      .populate("appliedToId")
      .sort({ createdAt: -1 });

    res.json(applications);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 3️⃣ Opportunities Feed
export const getOpportunitiesFeed = async (req, res) => {
  try {

    const opportunities = await Opportunity.find({
      isApproved: true,
      isActive: true
    })
      .sort({ createdAt: -1 });

    res.json(opportunities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 4️⃣ Upcoming Deadlines
export const getUpcomingDeadlines = async (req, res) => {
  try {

    const opportunities = await Opportunity.find({
      isApproved: true,
      isActive: true,
      deadline: { $gte: new Date() }
    })
      .sort({ deadline: 1 })
      .limit(5);

    res.json(opportunities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};