import Event from "../models/Events.model.js";
import Application from "../models/Application.model.js";
import { addPoints } from "../services/gamification.service.js";
import { sendNotification } from "../services/notification.service.js";
import User from "../models/User.model.js";
import cloudinary from "../config/cloudinary.js";


export const createEvent = async (req, res) => {
  try {
    let imageUrl = "";

    // ✅ CLOUDINARY UPLOAD (FIXED)
    if (req.file) {
      const uploadStream = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "campusync/events" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

      const result = await uploadStream();
      imageUrl = result.secure_url;
    }

    const event = await Event.create({
      ...req.body,
      image: imageUrl, // ✅ same
      createdBy: req.user._id,
    });

    // ✅ notification (unchanged)
    const students = await User.find({ role: "student" }).select("_id");
    for (const student of students) {
      await sendNotification({
        userId: student._id,
        title: "New Event Added!",
        message: `${event.title} by ${event.club}. Don't miss it!`,
        type: "event",
      });
    }

    res.status(201).json({ message: "Event created", event });

  } catch (err) {
    console.error("EVENT ERROR:", err); // 👈 DEBUG ADD (important)
    res.status(500).json({ message: err.message });
  }
};


export const getStudentEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const applyEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findOne({ _id: eventId, isActive: true });
    if (!event) return res.status(400).json({ message: "Event not available" });

    const alreadyApplied = await Application.findOne({
      student: req.user._id,
      event: eventId,
    });
    if (alreadyApplied) return res.status(400).json({ message: "Already applied" });

    const application = await Application.create({
      student: req.user._id,
      event: eventId,
    });

    // Gamification points
    await addPoints(req.user._id, 10);

    res.json({ message: "Event applied successfully", application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};