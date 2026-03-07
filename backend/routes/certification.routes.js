import express from "express";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

import {
 createCertification,
 getCertifications,
 updateCertification,
 deleteCertification
} from "../controllers/certification.controller.js";

const router = express.Router();


// admin / faculty add certification
router.post(
 "/",
 auth,
 role("admin","faculty"),
 createCertification
);


// student view certifications
router.get(
 "/",
 auth,
 getCertifications
);


// admin update certification
router.put(
 "/:id",
 auth,
 role("admin"),
 updateCertification
);


// admin delete certification
router.delete(
 "/:id",
 auth,
 role("admin"),
 deleteCertification
);

export default router;