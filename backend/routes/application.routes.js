import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

import {
  apply,
  getMyApplications,
  updateStatus,
  getFacultyApplications,
  getAllApplications,
} from "../controllers/application.controller.js";

const router = express.Router();

// Student apply
router.post(
  "/apply",
  auth,
  role("student"),
  apply
);

// Student history
router.get(
  "/my",
  auth,
  role("student"),
  getMyApplications
);

// Faculty/Admin status update
router.patch(
  "/:id/status",
  auth,
  role("faculty", "admin"),
  updateStatus
);

// Faculty – view applications for own posts
router.get(
  "/faculty",
  auth,
  role("faculty"),
  getFacultyApplications
);

// Admin – view all applications
router.get(
  "/admin",
  auth,
  role("admin"),
  getAllApplications
);

export default router;