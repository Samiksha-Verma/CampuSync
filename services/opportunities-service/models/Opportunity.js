const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    eligibilityCriteria: {
      type: String,
      default: '',
      trim: true,
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    stipendOrSalary: {
      type: String,
      default: '',
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    applicationLink: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['internship', 'job'],
      required: true,
    },
    // Auth-service Admin/Faculty _id of whoever posted this opportunity.
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Opportunity', opportunitySchema);
