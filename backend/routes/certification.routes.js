import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import {
  createCertification,
  getActiveCertifications,
  enrollCertification,
  completeCertification,
  myCertifications,
} from "../controllers/certification.controller.js";

const router = express.Router();

// Admin / Faculty
router.post("/", auth, role("admin", "faculty"), createCertification);

// Student
router.get("/", auth, role("student"), getActiveCertifications);
router.post("/enroll", auth, role("student"), enrollCertification);
router.patch("/complete/:id", auth, role("student"), completeCertification);
router.get("/my", auth, role("student"), myCertifications);

export default router;