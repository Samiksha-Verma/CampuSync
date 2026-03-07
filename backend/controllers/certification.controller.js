import Certification from "../models/Certification.model.js";


// create certification (admin/faculty)
export const createCertification = async(req,res)=>{
 try{

  const certification = await Certification.create({
   title:req.body.title,
   provider:req.body.provider,
   platform:req.body.platform,
   description:req.body.description,
   officialLink:req.body.officialLink,
   deadline:req.body.deadline,
   createdBy:req.user._id
  });

  res.status(201).json({
   message:"Certification added",
   certification
  });

 }catch(err){
  res.status(500).json({message:err.message});
 }
};

// get certifications for students
export const getCertifications = async(req,res)=>{
 try{

  const certifications = await Certification.find({
   isActive:true
  }).sort({createdAt:-1});

  res.json(certifications);

 }catch(err){
  res.status(500).json({message:err.message});
 }
};



// update certification
export const updateCertification = async(req,res)=>{
 try{

  const certification = await Certification.findByIdAndUpdate(
   req.params.id,
   req.body,
   {new:true}
  );

  res.json({
   message:"Certification updated",
   certification
  });

 }catch(err){
  res.status(500).json({message:err.message});
 }
};



// delete certification
export const deleteCertification = async(req,res)=>{
 try{

  await Certification.findByIdAndDelete(req.params.id);

  res.json({
   message:"Certification deleted"
  });

 }catch(err){
  res.status(500).json({message:err.message});
 }
};