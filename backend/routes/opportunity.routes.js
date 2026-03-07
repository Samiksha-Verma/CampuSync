import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

import {
 createExternalOpportunity,
 recruiterPostOpportunity,
 getStudentOpportunities
} from "../controllers/opportunity.controller.js";

const router = express.Router();


// faculty/admin external
router.post(
 "/external",
 auth,
 role("admin","faculty"),
 createExternalOpportunity
)


// recruiter campus
router.post(
 "/recruiter-post",
 auth,
 role("recruiter"),
 recruiterPostOpportunity
)


// student view
router.get(
 "/student",
 auth,
 role("student"),
 getStudentOpportunities
)

export default router;