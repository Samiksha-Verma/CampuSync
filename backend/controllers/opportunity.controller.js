import Opportunity from "../models/Opportunity.model.js";

export const createOpportunity = async (req, res) => {
  const opportunity = await Opportunity.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "Opportunity created successfully",
    opportunity,
  });
};

export const getStudentOpportunities = async (req, res) => {
  const opportunities = await Opportunity.find({ isActive: true });
  res.status(200).json(opportunities);
};