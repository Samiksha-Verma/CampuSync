import express from "express";
import auth from "../middlewares/auth.middleware.js";

import {
 getNotifications,
 markAsRead,
 deleteNotification
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/",auth,getNotifications)

router.put("/read/:id",auth,markAsRead)

router.delete("/:id",auth,deleteNotification)

export default router