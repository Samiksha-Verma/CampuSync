import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/add-event",
  authMiddleware,
  roleMiddleware("faculty", "admin"),
  (req, res) => {
    res.json({ message: "Event added successfully" });
  }
);

export default router;