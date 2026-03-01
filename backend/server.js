import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import startDeadlineJob from "./jobs/deadline.job.js";


dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();
startDeadlineJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});