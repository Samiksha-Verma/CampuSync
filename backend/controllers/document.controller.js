import cloudinary from "../config/cloudinary.js";
import Document from "../models/Document.model.js";
import streamifier from "streamifier";

export const uploadDocument = async (req, res) => {
  console.log(req.body)
  console.log(req.file)
console.log("Uploader exists:", typeof cloudinary.uploader);
  console.log("Cloudinary key:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("Cloudinary key:", process.env.CLOUDINARY_API_KEY);
  
  console.log("Before config:", cloudinary.config());
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `campusync/${req.body.type}`,
        resource_type: "auto",
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }

        const document = await Document.create({
          student: req.user._id,
          type: req.body.type,
          originalName: req.file.originalname,
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
        });

    //  console.log("Cloudinary key:", process.env.CLOUDINARY_API_KEY);

        res.status(201).json({
          message: "Document uploaded successfully",
          document,
        });
      }
    );
console.log("Cloudinary key:", process.env.CLOUDINARY_API_KEY);

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyDocuments = async (req, res) => {
  const documents = await Document.find({
    student: req.user._id,
  });

  res.json(documents);
};