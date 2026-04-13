import Event from "../models/Events.model.js";
import Opportunity from "../models/Opportunity.model.js";
import Certification from "../models/Certification.model.js";

export const deactivateExpiredEvents = async () => {
  const now = new Date();
  await Event.updateMany(
    { deadline: { $lt: now }, isActive: true },
    { isActive: false }
  );
  console.log("✅ Expired events deactivated");
};

export const deactivateExpiredOpportunities = async () => {
  const now = new Date();
  await Opportunity.updateMany(
    { deadline: { $lt: now }, isActive: true },
    { isActive: false }
  );
  console.log("✅ Expired opportunities deactivated");
};

export const deactivateExpiredCertifications = async () => {
  const now = new Date();
  await Certification.updateMany(
    { deadline: { $lt: now }, isActive: true },
    { isActive: false }
  );
  console.log("✅ Expired certifications deactivated");
};