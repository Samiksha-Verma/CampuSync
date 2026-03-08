import express from "express";
import auth from "../middlewares/auth.middleware.js";

import {
 getSettings,
 updateSettings
} from "../controllers/notificationsetting.controller.js";

const router = express.Router();

router.get("/",auth,getSettings)

router.put("/",auth,updateSettings)

export default router