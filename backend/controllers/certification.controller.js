import Certification from "../models/Certification.model.js";
import CertificationCompletion from "../models/CertificationCompletion.model.js";


// Add certification
export const createCertification = async (req, res) => {
  const certification = await Certification.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "Certification added successfully",
    certification,
  });
};

// Get all certifications (student view)
export const getActiveCertifications = async (req, res) => {
  const certifications = await Certification.find({ isActive: true });
  res.json(certifications);
};

/* ================= STUDENT ================= */

// Enroll in certification
export const enrollCertification = async (req, res) => {
  const { certificationId } = req.body;

  const alreadyEnrolled = await CertificationCompletion.findOne({
    student: req.user._id,
    certification: certificationId,
  });

  if (alreadyEnrolled) {
    return res.status(400).json({
      message: "Already enrolled",
    });
  }

  const enrollment = await CertificationCompletion.create({
    student: req.user._id,
    certification: certificationId,
  });

  res.status(201).json({
    message: "Enrolled successfully",
    enrollment,
  });
};

// Mark certification as completed
export const completeCertification = async (req, res) => {
  const completion = await CertificationCompletion.findOneAndUpdate(
    {
      student: req.user._id,
      certification: req.params.id,
    },
    {
      status: "completed",
      completedAt: new Date(),
    },
    { new: true }
  );

  res.json({
    message: "Certification marked as completed",
    completion,
  });
};

// Student certification history
export const myCertifications = async (req, res) => {
  const certifications = await CertificationCompletion.find({
    student: req.user._id,
  }).populate("certification");

  res.json(certifications);
};