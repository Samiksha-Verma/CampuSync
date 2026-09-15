const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    collegeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      // e.g. AEC/2023/005
      match: [/^[A-Z]+\/\d{4}\/\d{3}$/, 'collegeId must be in the format ABC/2023/005'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Not required at the model level - self-signup only collects collegeId/email/
    // password, and these are filled in afterward via the student's own Profile page.
    name: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    branch: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
