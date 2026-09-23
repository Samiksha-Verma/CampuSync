const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizingClub: {
      type: String,
      required: true,
      trim: true,
    },
    coordinatorName: {
      type: String,
      required: true,
      trim: true,
    },
    contactInfo: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    // When the event itself happens - distinct from `deadline` (the registration
    // cutoff). Required going forward; events created before this field existed
    // simply won't have one until an Admin/Faculty edits them to add it.
    eventDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    bannerImageUrl: {
      type: String,
      default: '',
    },
    registrationLink: {
      type: String,
      required: true,
      trim: true,
    },
    // Auth-service Admin/Faculty _id of whoever posted this event.
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
