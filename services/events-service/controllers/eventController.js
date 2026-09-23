const Event = require('../models/Event');
const notify = require('../utils/notify');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

const REQUIRED_FIELDS = ['name', 'organizingClub', 'coordinatorName', 'contactInfo', 'eventDate', 'deadline', 'registrationLink'];
const UPDATABLE_FIELDS = ['name', 'organizingClub', 'coordinatorName', 'contactInfo', 'description', 'eventDate', 'deadline', 'registrationLink'];

// Admin/Faculty can pass ?includeExpired=true to see history; Students never see expired events.
const buildExpiryFilter = (req) => {
  const includeExpired = req.query.includeExpired === 'true' && ['admin', 'faculty'].includes(req.user.role);
  return includeExpired ? {} : { deadline: { $gte: new Date() } };
};

// GET /events
const listEvents = async (req, res) => {
  try {
    const events = await Event.find(buildExpiryFilter(req)).sort({ deadline: 1 });
    return res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching events' });
  }
};

// GET /events/:id - always returns regardless of expiry, so direct links/history keep working
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.status(200).json({ event });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid event id' });
  }
};

// POST /events (Admin/Faculty only)
// multipart/form-data - upload.single('bannerImage') middleware puts the optional
// image on req.file, everything else lands on req.body as strings like any other form.
const createEvent = async (req, res) => {
  try {
    for (const field of REQUIRED_FIELDS) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    let bannerImageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      bannerImageUrl = result.secure_url;
    }

    const event = await Event.create({
      name: req.body.name,
      organizingClub: req.body.organizingClub,
      coordinatorName: req.body.coordinatorName,
      contactInfo: req.body.contactInfo,
      description: req.body.description,
      eventDate: req.body.eventDate,
      deadline: req.body.deadline,
      registrationLink: req.body.registrationLink,
      bannerImageUrl,
      createdBy: req.user.id,
    });

    await notify({
      type: 'event_created',
      message: `New event posted: ${event.name}`,
      relatedEntityId: event._id,
    });

    return res.status(201).json({ event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while creating the event' });
  }
};

// PUT /events/:id (Admin/Faculty only, creator-or-admin - req.record set by ownership middleware)
// multipart/form-data, same shape as createEvent - a new file replaces the existing
// banner; no file means the current bannerImageUrl (if any) is left untouched.
const updateEvent = async (req, res) => {
  try {
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) req.record[field] = req.body[field];
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      req.record.bannerImageUrl = result.secure_url;
    }

    await req.record.save();

    await notify({
      type: 'event_updated',
      message: `Event updated: ${req.record.name}`,
      relatedEntityId: req.record._id,
    });

    return res.status(200).json({ event: req.record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while updating the event' });
  }
};

// DELETE /events/:id (Admin/Faculty only, creator-or-admin)
const deleteEvent = async (req, res) => {
  try {
    const { _id, name } = req.record;
    await req.record.deleteOne();

    await notify({
      type: 'event_deleted',
      message: `Event removed: ${name}`,
      relatedEntityId: _id,
    });

    return res.status(200).json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while deleting the event' });
  }
};

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };
