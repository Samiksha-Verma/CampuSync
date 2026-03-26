import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./config/db.js";
import startDeadlineJob from "./jobs/deadline.job.js";
import cron from "node-cron";

import { cleanUnverifiedUsers } from "./cron/cleanup.job.js";
const PORT = process.env.PORT || 5000;
console.log("ENV TEST:", process.env.CLOUDINARY_API_KEY);
console.log("API KEY CHECK:", process.env.ANTHROPIC_API_KEY);

connectDB();
startDeadlineJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// 🔥 CRON JOB
cron.schedule("* * * * *", () => {
  
  cleanUnverifiedUsers();
});