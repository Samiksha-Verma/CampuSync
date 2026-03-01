import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { createFaculty } from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.json({ message: "All users data" });
  }
);

router.post(
  "/create-faculty",
  authMiddleware,
  roleMiddleware("admin"),
  createFaculty
);

export default router;