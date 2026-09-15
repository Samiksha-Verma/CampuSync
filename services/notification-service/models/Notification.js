const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // A specific Student _id (targeted - e.g. a per-student status update), or null
    // for a broadcast meant for every current student (e.g. "new event posted"). No
    // caller currently sets this to a specific student (the one use case that did,
    // opportunity application status, was removed - opportunities are a pure listing
    // now), but the capability stays generic for whatever future notification needs it.
    recipientId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // The Event/Opportunity/Certification _id this notification is about.
    relatedEntityId: {
      type: String,
    },
    // Used only when recipientId is set (targeted) - a single reader, so a single flag works.
    isRead: {
      type: Boolean,
      default: false,
    },
    // Used only when recipientId is null (broadcast) - one document is read by many
    // students, so a single isRead boolean can't represent per-student read state.
    // Tracks which students have read this broadcast instead.
    readBy: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
