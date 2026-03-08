import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({

 student:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User",
  required:true
 },

 opportunity:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"Opportunity",
  required:true
 },

 // resume uploaded by student
 resumeUrl:{
  type:String,
  required:true
 },
 
 status:{
   type:String,
   enum:["pending","shortlisted","rejected","selected"],
   default:"pending"
  }
  

},{timestamps:true})

export default mongoose.model("Application",applicationSchema)