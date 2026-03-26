import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import Recruiter from "../models/Recruiter.model.js";
import Opportunity from "../models/Opportunity.model.js";
import Event from "../models/Events.model.js";
import Application from "../models/Application.model.js";
import Certification from "../models/Certification.model.js";
import { sendNotification } from "../services/notification.service.js";


// 1️⃣ Dashboard Analytics
export const getAdminDashboard = async (req, res) => {
  try {

    const students = await User.countDocuments({ role: "student" });
    const faculty = await User.countDocuments({ role: "faculty" });
    const recruiters = await User.countDocuments({ role: "recruiter" });

    const events = await Event.countDocuments();
    const opportunities = await Opportunity.countDocuments();
    const applications = await Application.countDocuments();

    const pendingRecruiters = await User.countDocuments({
      role: "recruiter",
      isApproved: false
    });

    const pendingOpportunities = await Opportunity.countDocuments({
      type: "campus",
      isApproved: false
    });

    res.json({
      students,
      faculty,
      recruiters,
      events,
      opportunities,
      applications,
      pendingRecruiters,
      pendingOpportunities
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 2️⃣ Get All Users
export const getAllUsers = async (req, res) => {
  try {

    const users = await User.find().select("-password");

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3️⃣ Create Faculty
export const createFaculty = async (req, res) => {
  try {

    const {collegeId, name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = await User.create({
      collegeId,
      name,
      email,
      password: hashedPassword,
      role: "faculty",
      isVerified: true
    });

    res.status(201).json({
      message: "Faculty created successfully",
      faculty
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
  
// 4️⃣ Pending Recruiters
export const getPendingRecruiters = async (req, res) => {
  try {

    const recruiters = await User.find({
      role: "recruiter",
      isApproved: false
    }).select("-password");

    res.json(recruiters);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5️⃣ Approve Recruiter
export const approveRecruiter = async (req, res) => {
  try {

    const recruiter = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    res.json({
      message: "Recruiter approved",
      recruiter
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6️⃣ Pending Opportunities
export const getPendingOpportunities = async (req, res) => {
  try {

    const opportunities = await Opportunity.find({
      type: "campus",
      isApproved: false
    }).populate("recruiter", "name email");

    res.json(opportunities);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 7️⃣ Approve Opportunity
export const approveOpportunity = async (req,res)=>{
 try{

  const opportunity = await Opportunity.findByIdAndUpdate(
   req.params.id,
   {isApproved:true},
   {new:true}
  );

  if(!opportunity){
   return res.status(404).json({
    message:"Opportunity not found"
   });
  }

  // 🔔 fetch all students
  const students = await User.find({role:"student"});

  // 🔔 broadcast notification
  for(const student of students){

   await sendNotification({
    userId:student._id,
    title:"New Opportunity Available",
    message:`${opportunity.company} posted ${opportunity.role}`,
    type:"opportunity"
   });

  }

  res.json({
   message:"Opportunity approved successfully"
  });

 }catch(err){
  res.status(500).json({message:err.message});
 }
};



// 8️⃣ Create External Opportunity
export const createExternalOpportunity = async (req, res) => {
  try {

    const opportunity = await Opportunity.create({
      ...req.body,
      isApproved: true,
      createdBy: req.user._id,
      createdByRole: "admin"
    });

    res.status(201).json({
      message: "opportunity created",
      opportunity
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 9️⃣ Add Certification
export const addCertification = async (req, res) => {
  try {

    const certification = await Certification.create(req.body);

    res.status(201).json({
      message: "Certification added",
      certification
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

