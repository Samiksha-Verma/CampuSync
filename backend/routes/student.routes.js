import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("student"),
  (req, res) => {
    res.json({
      message: "Student dashboard data",
      student: req.user.name,
    });
  }
);

export default router;