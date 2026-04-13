import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { applyEvent } from "../controllers/event.controller.js";
import {
  createEvent,
  getStudentEvents,
} from "../controllers/event.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post(
  "/create",
  auth,
  role("faculty", "admin"),
  upload.single("image"), // ✅ ADD THIS
  createEvent
);

router.get("/", auth, role("student","admin","faculty"), getStudentEvents);

router.post(
 "/apply",
 auth,
 role("student"),
 applyEvent
);



export default router;