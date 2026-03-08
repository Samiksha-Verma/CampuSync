import NotificationSetting from "../models/NotificationSetting.model.js";


export const getSettings = async(req,res)=>{

 const settings = await NotificationSetting.findOne({
  user:req.user._id
 })

 res.json(settings)
}



export const updateSettings = async(req,res)=>{

 const settings = await NotificationSetting.findOneAndUpdate(

  {user:req.user._id},

  req.body,

  {new:true,upsert:true}

 )

 res.json(settings)
}