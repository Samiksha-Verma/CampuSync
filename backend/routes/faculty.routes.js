import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

import {
  getFacultyDashboard,
  getMyEvents,
  getMyExternalOpportunities,
  getApplicationsForMyPosts
} from "../controllers/faculty.controller.js";

const router = express.Router();


// faculty dashboard stats
router.get(
  "/dashboard",
  auth,
  role("faculty"),
  getFacultyDashboard
);


// my events
router.get(
  "/events",
  auth,
  role("faculty"),
  getMyEvents
);


// my external opportunities
router.get(
  "/opportunities",
  auth,
  role("faculty"),
  getMyExternalOpportunities
);


// applications
router.get(
  "/applications",
  auth,
  role("faculty"),
  getApplicationsForMyPosts
);

export default router;