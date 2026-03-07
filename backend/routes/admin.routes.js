import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  getAdminDashboard,
  getAllUsers,
  createFaculty,
  getPendingRecruiters,
  approveRecruiter,
  getPendingOpportunities,
  approveOpportunity,
  createExternalOpportunity,
  addCertification
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  getAllUsers,
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

// get pending recruiters
router.get(
  "//pending-recruiters",
  authMiddleware,
  roleMiddleware("admin"),
  getPendingRecruiters
);

// approve recruiter
router.put(
 "/approve-recruiter/:id",
 authMiddleware,
  roleMiddleware("admin"),
 approveRecruiter
)

router.get(
  "/dashboard", 
  authMiddleware,
  roleMiddleware("admin"), 
  getAdminDashboard
);

router.get(
  "/pending-opportunities", 
  authMiddleware,
  roleMiddleware("admin"), 
  getPendingOpportunities
);

router.put(
  "/approve-opportunity/:id", 
   authMiddleware,
  roleMiddleware("admin"),
  approveOpportunity
);

router.post(
  "/external-opportunity", 
  authMiddleware,
  roleMiddleware("admin"), 
  createExternalOpportunity
);

router.post(
  "/certification", 
  authMiddleware,
  roleMiddleware("admin"),
  addCertification);

export default router;