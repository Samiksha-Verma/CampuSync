import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import {
  createOpportunity,
  getStudentOpportunities,
} from "../controllers/opportunity.controller.js";

const router = express.Router();

router.post("/", auth, role("faculty", "admin"), createOpportunity);
router.get("/", auth, role("student"), getStudentOpportunities);

export default router;