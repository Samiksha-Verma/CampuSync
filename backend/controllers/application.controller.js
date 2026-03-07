import Application from "../models/Application.model.js";
import Event from "../models/Events.model.js";
import Opportunity from "../models/Opportunity.model.js";

export const apply = async (req, res) => {
  try {
    const { appliedToType, appliedToId } = req.body;

    let target;

    if (appliedToType === "event") {
      target = await Event.findOne({
        _id: appliedToId,
        isActive: true,
      });
    }

    else if (appliedToType === "opportunity") {

      target = await Opportunity.findOne({
        _id: appliedToId,
        isActive: true,
        isApproved: true
      });

      if (!target) {
        return res.status(400).json({
          message: "Opportunity not available",
        });
      }

      // ❗ external opportunity → platform apply not allowed
      if (target.type === "external") {
        return res.status(400).json({
          message:
            "This is an external opportunity. Please apply via the official link.",
        });
      }
    }

    else {
      return res.status(400).json({
        message: "Invalid application type",
      });
    }

    // prevent duplicate
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
  try {

    const { status } = req.body;

    const application = await Application.findById(req.params.id)
      .populate("appliedToId");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // recruiter only
    if (req.user.role !== "recruiter") {
      return res.status(403).json({
        message: "Only recruiter can update application status",
      });
    }

    application.status = status;

    await application.save();

    res.json({
      message: "Application status updated",
      application,
    });

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