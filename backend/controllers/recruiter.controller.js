import Opportunity from "../models/Opportunity.model.js";
import Application from "../models/Application.model.js";


export const recruiterPostOpportunity = async (req,res)=>{

 const opportunity = await Opportunity.create({

  ...req.body,

  recruiter:req.user.id,

  type:"campus",

  createdByRole:"recruiter"

 })

 res.status(201).json({
  message:"Opportunity submitted for admin approval"
 })

}

// 1️⃣ Recruiter Dashboard Stats
export const getRecruiterDashboard = async (req, res) => {
  try {

    const recruiterId = req.user._id;

    const totalJobs = await Opportunity.countDocuments({
      recruiter: recruiterId
    });

    const totalApplications = await Application.countDocuments();

    const shortlisted = await Application.countDocuments({
      status: "shortlisted"
    });

    const selected = await Application.countDocuments({
      status: "selected"
    });

    res.json({
      totalJobs,
      totalApplications,
      shortlisted,
      selected
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 2️⃣ Recruiter My Opportunities
export const getMyOpportunities = async (req, res) => {
  try {

    const opportunities = await Opportunity.find({
      recruiter: req.user._id
    });

    res.json(opportunities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 3️⃣ Get Applicants for Opportunity
export const getOpportunityApplicants = async (req, res) => {
  try {

    const applications = await Application.find({
      appliedToId: req.params.id
    })
      .populate("student", "name collegeId email")
      .populate("appliedToId");

    res.json(applications);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 4️⃣ Update Opportunity
export const updateOpportunity = async (req, res) => {
  try {

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Opportunity updated",
      opportunity
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 5️⃣ Delete Opportunity
export const deleteOpportunity = async (req, res) => {
  try {

    await Opportunity.findByIdAndDelete(req.params.id);

    res.json({
      message: "Opportunity deleted"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};