const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    externalLink: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    // Auth-service Admin/Faculty _id of whoever posted this certification.
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certification', certificationSchema);
