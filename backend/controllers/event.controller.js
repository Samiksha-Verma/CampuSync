import Event from "../models/Events.model.js";
import Application from "../models/Application.model.js";
import { addPoints } from "../services/gamification.service.js";
export const createEvent = async (req, res) => {
  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json(event);
};

export const getStudentEvents = async (req, res) => {
  const events = await Event.find({ isActive: true });
  res.json(events);
};

export const applyEvent = async (req,res)=>{

 try{

  const {eventId} = req.body

  const event = await Event.findOne({
   _id:eventId,
   isActive:true
  })

  if(!event){
   return res.status(400).json({
    message:"Event not available"
   })
  }

  // prevent duplicate
  const alreadyApplied = await Application.findOne({
   student:req.user._id,
   event:eventId
  })

  if(alreadyApplied){
   return res.status(400).json({
    message:"Already applied"
   })
  }

  const application = await Application.create({
   student:req.user._id,
   event:eventId
  })

  //  gamification points
  await addPoints(req.user._id,10)

  res.json({
   message:"Event applied successfully",
   application
  })

 }catch(err){
  res.status(500).json({message:err.message})
 }

}