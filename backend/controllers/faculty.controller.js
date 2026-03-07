import Event from "../models/Events.model.js";
import Opportunity from "../models/Opportunity.model.js";
import Application from "../models/Application.model.js";


// 1️⃣ Faculty Dashboard Stats
export const getFacultyDashboard = async (req, res) => {
  try {

    const facultyId = req.user._id;

    const totalEvents = await Event.countDocuments({
      createdBy: facultyId
    });

    const totalOpportunities = await Opportunity.countDocuments({
      createdBy: facultyId
    });

    const totalApplications = await Application.countDocuments({
      appliedToType: { $in: ["event", "opportunity"] }
    });

    res.json({
      totalEvents,
      totalOpportunities,
      totalApplications
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 2️⃣ My Events
export const getMyEvents = async (req, res) => {
  try {

    const events = await Event.find({
      createdBy: req.user._id
    }).sort({ createdAt: -1 });

    res.json(events);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 3️⃣ My External Opportunities
export const getMyExternalOpportunities = async (req, res) => {
  try {

    const opportunities = await Opportunity.find({
      createdBy: req.user._id,
      type: "external"
    }).sort({ createdAt: -1 });

    res.json(opportunities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 4️⃣ Applications for My Posts
export const getApplicationsForMyPosts = async (req, res) => {
  try {

    const events = await Event.find({
      createdBy: req.user._id
    }).select("_id");

    const opportunities = await Opportunity.find({
      createdBy: req.user._id
    }).select("_id");

    const eventIds = events.map(e => e._id);
    const opportunityIds = opportunities.map(o => o._id);

    const applications = await Application.find({
      $or: [
        { appliedToType: "event", appliedToId: { $in: eventIds } },
        { appliedToType: "opportunity", appliedToId: { $in: opportunityIds } }
      ]
    })
      .populate("student", "name collegeId email")
      .populate("appliedToId");

    res.json(applications);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};