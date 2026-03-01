import Event from "../models/Events.model.js";

export const deactivateExpiredEvents = async () => {
  const now = new Date();

  await Event.updateMany(
    { deadline: { $lt: now }, isActive: true },
    { isActive: false }
  );
};