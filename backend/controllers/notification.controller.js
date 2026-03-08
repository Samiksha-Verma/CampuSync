import Notification from "../models/Notification.model.js";


// get my notifications
export const getNotifications = async(req,res)=>{
 try{

  const notifications = await Notification.find({
   user:req.user._id
  }).sort({createdAt:-1});

  res.json(notifications)

 }catch(err){
  res.status(500).json({message:err.message})
 }
}

// mark as read
export const markAsRead = async(req,res)=>{
 try{
  const notification = await Notification.findByIdAndUpdate(
   req.params.id,
   {isRead:true},
   {new:true}
  )

  res.json(notification)

 }catch(err){
  res.status(500).json({message:err.message})
 }
}


// delete notification
export const deleteNotification = async(req,res)=>{
 try{

  await Notification.findByIdAndDelete(req.params.id)

  res.json({
   message:"Notification deleted"
  })

 }catch(err){
  res.status(500).json({message:err.message})
 }
}