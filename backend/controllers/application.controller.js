import Application from "../models/Application.model.js";
import Event from "../models/Events.model.js";
import Opportunity from "../models/Opportunity.model.js";

export const apply = async (req, res) => {
  try {
    const { appliedToType, appliedToId } = req.body;

    let target;

    // 🔍 STEP 1: check event / opportunity exists & active
    if (appliedToType === "event") {
      target = await Event.findOne({
        _id: appliedToId,
        isActive: true,
      });
    } else if (appliedToType === "opportunity") {
      target = await Opportunity.findOne({
        _id: appliedToId,
        isActive: true,
      });
    } else {
      return res.status(400).json({
        message: "Invalid application type",
      });
    }

    if (!target) {
      return res.status(400).json({
        message: "This application is no longer available",
      });
    }


    //  STEP 2: prevent duplicate application
    const alreadyApplied = await Application.findOne({
      student: req.user._id,
      appliedToType,
      appliedToId,
    });

    if (alreadyApplied) {
      return res.status(400).json({
        message: "You have already applied",
      });
    }

    // ✅ STEP 3: create application
    const application = await Application.create({
      student: req.user._id,
      appliedToType,
      appliedToId,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student application history
export const getMyApplications = async (req, res) => {
  const applications = await Application.find({
    student: req.user._id,
  }).populate("appliedToId");

  res.json(applications);
};

// Faculty/Admin updates status
export const updateStatus = async (req, res) => {
  const { status } = req.body;

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json({
    message: "Application status updated",
    application,
  });
};

export const getFacultyApplications = async (req, res) => {
  try {
    // 1️⃣ get all events & opportunities created by this faculty
    const events = await Event.find({ createdBy: req.user._id }).select("_id");
    const opportunities = await Opportunity.find({ createdBy: req.user._id }).select("_id");

    const eventIds = events.map((e) => e._id);
    const opportunityIds = opportunities.map((o) => o._id);

    // 2️⃣ find applications for those IDs
    const applications = await Application.find({
      $or: [
        { appliedToType: "event", appliedToId: { $in: eventIds } },
        { appliedToType: "opportunity", appliedToId: { $in: opportunityIds } },
      ],
    })
      .populate("student", "name collegeId email")
      .populate("appliedToId");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("student", "name collegeId email role")
      .populate("appliedToId");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};