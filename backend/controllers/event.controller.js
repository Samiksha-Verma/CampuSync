import Event from "../models/Events.model.js";

export const createEvent = async (req, res) => {
  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json(event);
};

export const getStudentEvents = async (req, res) => {
  const events = await Event.find({ isActive: true });
  res.json(events);
};