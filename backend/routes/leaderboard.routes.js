import express from "express";
import auth from "../middlewares/auth.middleware.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";

const router = express.Router();

router.get("/",auth,getLeaderboard);

export default router;