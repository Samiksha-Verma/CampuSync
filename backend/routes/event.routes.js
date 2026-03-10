import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { applyEvent } from "../controllers/event.controller.js";
import {
  createEvent,
  getStudentEvents,
} from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", auth, role("faculty", "admin"), createEvent);
router.get("/", auth, role("student"), getStudentEvents);
router.post(
 "/apply",
 auth,
 role("student"),
 applyEvent
);

export default router;