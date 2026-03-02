import Application from "../models/Application.model.js";
import Event from "../models/Events.model.js";
import Opportunity from "../models/Opportunity.model.js";

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 📌 Application counts
    const totalApplications = await Application.countDocuments({
      student: studentId,
    });

    const pendingApplications = await Application.countDocuments({
      student: studentId,
      status: "pending",
    });

    const acceptedApplications = await Application.countDocuments({
      student: studentId,
      status: "accepted",
    });

    const rejectedApplications = await Application.countDocuments({
      student: studentId,
      status: "rejected",
    });

    // 📌 Upcoming deadlines (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingEvents = await Event.find({
      isActive: true,
      deadline: { $gte: today, $lte: nextWeek },
    }).select("title deadline");

    const upcomingOpportunities = await Opportunity.find({
      isActive: true,
      deadline: { $gte: today, $lte: nextWeek },
    }).select("company role deadline");

    res.json({
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
      },
      upcomingDeadlines: {
        events: upcomingEvents,
        opportunities: upcomingOpportunities,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};