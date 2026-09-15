const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

// Uploaded as "authenticated" resources (not the default "public") - a bare fetch
// of the returned URL gets a 401 without a valid signature. This is deliberately
// different from user-service's avatar uploads: avatars are meant to be public,
// vault documents (which can include ID documents) are not. See README.
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'campusync/vault', resource_type: 'auto', type: 'authenticated', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
