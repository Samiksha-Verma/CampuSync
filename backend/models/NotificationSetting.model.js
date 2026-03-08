import mongoose from "mongoose";

const notificationSettingSchema = new mongoose.Schema({

 user:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User",
  unique:true
 },

 emailNotifications:{
  type:Boolean,
  default:true
 },

 opportunityAlerts:{
  type:Boolean,
  default:true
 },

 eventReminders:{
  type:Boolean,
  default:true
 }

})

export default mongoose.model(
 "NotificationSetting",
 notificationSettingSchema
)