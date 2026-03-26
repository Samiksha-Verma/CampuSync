import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

import {
  getStudentDashboard,
  getMyApplications,
  getOpportunitiesFeed,
  getUpcomingDeadlines,
  getInternships,
  getJobs,
  getCampusOpportunities
} from "../controllers/student.controller.js";

const router = express.Router();


// dashboard stats
router.get(
  "/dashboard",
  auth,
  role("student"),
  getStudentDashboard
);


// my applications
router.get(
  "/applications",
  auth,
  role("student"),
  getMyApplications
);


router.get("/internships", 
  auth,
  role("student"),
  getInternships);
router.get("/jobs",
  auth,
  role("student"),
  getJobs);
router.get("/campus",
   getCampusOpportunities);
// opportunities feed
router.get(
  "/opportunities",
  auth,
  role("student"),
  getOpportunitiesFeed
);


// upcoming deadlines
router.get(
  "/deadlines",
  auth,
  role("student"),
  getUpcomingDeadlines
);

export default router;