import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { getStudentDashboard } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get(
  "/student",
  auth,
  role("student"),
  getStudentDashboard
);

export default router;