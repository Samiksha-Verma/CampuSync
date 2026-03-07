import Opportunity from "../models/Opportunity.model.js";


export const createExternalOpportunity = async (req,res)=>{

 const opportunity = await Opportunity.create({
   ...req.body,
   type:"external",
   createdBy:req.user._id,
   createdByRole:req.user.role,
   isApproved:true
 })

 res.status(201).json({
   message:"External opportunity created",
   opportunity
 })

}

// recruiter campus opportunity
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

// student dashboard opportunities
export const getStudentOpportunities = async(req,res)=>{

 const opportunities = await Opportunity.find({
   isApproved:true,
   isActive:true
 })

 res.json(opportunities)

}