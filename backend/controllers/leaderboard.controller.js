import User from "../models/User.model.js";

export const getLeaderboard = async (req,res)=>{

 const leaderboard = await User.find({role:"student"})
  .sort({points:-1})
  .limit(10)
  .select("name points badges");

 res.json(leaderboard);

};