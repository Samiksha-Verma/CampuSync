import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import {
  apply,
  getMyApplications,
  updateStatus,
  getAllApplications,
} from "../controllers/application.controller.js";

const router = express.Router();

// Student apply
router.post(
  "/apply",
  auth,
  role("student"),
  upload.single("resume"),
  apply
);

// Student history
router.get(
  "/my",
  auth,
  role("student"),
  getMyApplications
);

// recruiter update status
router.put(
  "/status/:id",
   auth, 
   role("recruiter"), 
   updateStatus
  );


// Admin – view all applications
router.get(
  "/admin",
  auth,
  role("admin"),
  getAllApplications
);

export default router;