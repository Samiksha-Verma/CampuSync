import Notification from "../models/Notification.model.js";
import NotificationSetting from "../models/NotificationSetting.model.js";
import User from "../models/User.model.js";
import { sendEmail } from "./email.service.js";

export const sendNotification = async ({
 userId,
 title,
 message,
 type
}) => {

 try{

  // create in-app notification
  await Notification.create({
   user:userId,
   title,
   message,
   type
  });

  // check email settings
  const setting = await NotificationSetting.findOne({user:userId});

  if(setting?.emailNotifications){

   const user = await User.findById(userId);

   await sendEmail(
    user.email,
    title,
    message
   );

  }

 }catch(err){
  console.log(err)
 }

}