import NotificationSetting from "../models/NotificationSetting.model.js";


export const getSettings = async(req,res)=>{

 const settings = await NotificationSetting.findOne({
  user:req.user._id
 })

 res.json(settings)
}



export const updateSettings = async (req, res) => {
  try {

    const settings = await NotificationSetting.findOneAndUpdate(
      { user: req.user._id },   // filter
      req.body,                 // update
      {
        new: true,
        upsert: true
      }
    );

    res.json(settings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};