import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { upload } from "../config/multer.js";
import {
  uploadDocument,
  getMyDocuments,
} from "../controllers/document.controller.js";

const router = express.Router();

// Upload
router.post(
  "/upload",
  auth,
  role("student"),
  upload.single("file"),
  uploadDocument
);

// View own documents
router.get(
  "/my",
  auth,
  role("student"),
  getMyDocuments
);

export default router;