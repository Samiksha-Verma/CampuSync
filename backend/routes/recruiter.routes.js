import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

import {
  getRecruiterDashboard,
  getMyOpportunities,
  getOpportunityApplicants,
  updateOpportunity,
  deleteOpportunity,
  recruiterPostOpportunity
} from "../controllers/recruiter.controller.js";

const router = express.Router();


router.post(
 "/opportunity",
 auth,
 role("recruiter"),
 recruiterPostOpportunity
);

// recruiter dashboard
router.get(
  "/dashboard",
  auth,
  role("recruiter"),
  getRecruiterDashboard
);


// recruiter jobs
router.get(
  "/my-opportunities",
  auth,
  role("recruiter"),
  getMyOpportunities
);


// applicants list
router.get(
  "/opportunity/:id/applicants",
  auth,
  role("recruiter"),
  getOpportunityApplicants
);


// update job
router.put(
  "/opportunity/:id",
  auth,
  role("recruiter"),
  updateOpportunity
);


// delete job
router.delete(
  "/opportunity/:id",
  auth,
  role("recruiter"),
  deleteOpportunity
);

export default router;