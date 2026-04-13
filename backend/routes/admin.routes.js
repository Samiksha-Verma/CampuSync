import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import {
  getAdminDashboard,
  getAllUsers,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getPendingRecruiters,
  approveRecruiter,
  rejectRecruiter,
  getPendingOpportunities,
  approveOpportunity,
  rejectOpportunity,
  createExternalOpportunity,
  updateOpportunity,
  deleteOpportunity,
  addCertification,
  updateCertification,
  deleteCertification,
  createEvent,
  updateEvent,
  deleteEvent,
  getAIStats,
} from "../controllers/admin.controller.js";

const router = express.Router();

const admin = [authMiddleware, roleMiddleware("admin")];
const adminOrFaculty = [authMiddleware, roleMiddleware(["admin", "faculty"])];

// // ── Dashboard ─────────────────────────────
// router.get("/dashboard", ...admin, getAdminDashboard);
// router.get("/users", ...admin, getAllUsers);
// router.get("/ai-stats", ...admin, getAIStats);

// // ── Faculty ───────────────────────────────
// router.post("/faculty", ...admin, createFaculty);
// router.put("/faculty/:id", ...admin, updateFaculty);
// router.delete("/faculty/:id", ...admin, deleteFaculty);

// // ── Recruiters ────────────────────────────
// router.get("/pending-recruiters", ...admin, getPendingRecruiters);
// router.put("/approve-recruiter/:id", ...admin, approveRecruiter);
// router.put("/reject-recruiter/:id", ...admin, rejectRecruiter);

// // ── Opportunities ─────────────────────────
// router.get("/pending-opportunities", ...admin, getPendingOpportunities);
// router.put("/approve-opportunity/:id", ...admin, approveOpportunity);
// router.put("/reject-opportunity/:id", ...admin, rejectOpportunity);
// router.post("/opportunity", ...adminOrFaculty, createExternalOpportunity);
// router.put("/opportunity/:id", ...adminOrFaculty, updateOpportunity);
// router.delete("/opportunity/:id", ...adminOrFaculty, deleteOpportunity);

// // ── Events ────────────────────────────────
// router.post("/event", ...adminOrFaculty, createEvent);
// router.put("/event/:id", ...adminOrFaculty, updateEvent);
// router.delete("/event/:id", ...adminOrFaculty, deleteEvent);

// // ── Certifications ────────────────────────
// router.post("/certification", ...admin, addCertification);
// router.put("/certification/:id", ...admin, updateCertification);
// router.delete("/certification/:id", ...admin, deleteCertification);

// ── Events ── (faculty bhi kar sakti hai)
router.post("/event", ...adminOrFaculty, createEvent);
router.put("/event/:id", ...adminOrFaculty, updateEvent);
router.delete("/event/:id", ...adminOrFaculty, deleteEvent);

// ── Opportunities ── (faculty bhi kar sakti hai)
router.post("/opportunity", ...adminOrFaculty, createExternalOpportunity);
router.put("/opportunity/:id", ...adminOrFaculty, updateOpportunity);
router.delete("/opportunity/:id", ...adminOrFaculty, deleteOpportunity);

// ── Certifications ── (faculty bhi kar sakti hai)
router.post("/certification", ...adminOrFaculty, addCertification);
router.put("/certification/:id", ...adminOrFaculty, updateCertification);
router.delete("/certification/:id", ...adminOrFaculty, deleteCertification);

// ── Sirf Admin ke liye (ye same rahenge) ──
router.get("/dashboard", ...admin, getAdminDashboard);
router.get("/users", ...admin, getAllUsers);
router.get("/ai-stats", ...admin, getAIStats);
router.post("/faculty", ...admin, createFaculty);
router.put("/faculty/:id", ...admin, updateFaculty);
router.delete("/faculty/:id", ...admin, deleteFaculty);
router.get("/pending-recruiters", ...admin, getPendingRecruiters);
router.put("/approve-recruiter/:id", ...admin, approveRecruiter);
router.put("/reject-recruiter/:id", ...admin, rejectRecruiter);
router.get("/pending-opportunities", ...admin, getPendingOpportunities);
router.put("/approve-opportunity/:id", ...admin, approveOpportunity);
router.put("/reject-opportunity/:id", ...admin, rejectOpportunity);

export default router;