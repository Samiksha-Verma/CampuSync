const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    // Self-signup accounts start 'pending' and can't log in until an Admin approves.
    // Defaults to 'active' so accounts created under the old admin-created flow (and
    // anything created directly, e.g. seed scripts) keep working without migration.
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'active',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    // No longer set at creation time (self-signup has no admin involved yet) - kept
    // optional for old rows, and used to record who reviewed the request instead.
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
