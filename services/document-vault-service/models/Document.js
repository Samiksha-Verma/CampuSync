const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    // Auth-service Student _id (not a Mongoose ref - lives in a different DB).
    studentId: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['resume', 'certificate', 'offer_letter', 'id_document', 'internship_proof', 'other'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    // Cloudinary secure_url. Stored as an "authenticated" resource (see README) -
    // this URL alone is inert without a signature, so exposing it in API responses
    // doesn't bypass the download endpoint's ownership check.
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    // Not in the original field list - required to reliably delete the right
    // Cloudinary resource later (destroy() needs both, not just the URL).
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    cloudinaryResourceType: {
      type: String,
      required: true,
    },
    // Also not in the original field list - needed by cloudinary.utils.private_download_url()
    // at download time to regenerate a working signed URL for this "authenticated" resource.
    cloudinaryFormat: {
      type: String,
      required: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Document', documentSchema);
