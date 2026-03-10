import User from "../models/User.model.js";

export const addPoints = async (userId, points) => {

 const user = await User.findById(userId);

 if(!user) return;

 user.points += points;

 // badge logic
 if(user.points >= 200 && !user.badges.includes("Career Champion")){
  user.badges.push("Career Champion");
 }

 else if(user.points >= 100 && !user.badges.includes("Opportunity Hunter")){
  user.badges.push("Opportunity Hunter");
 }

 else if(user.points >= 50 && !user.badges.includes("Rising Star")){
  user.badges.push("Rising Star");
 }

 await user.save();

};