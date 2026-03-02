import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./config/db.js";
import startDeadlineJob from "./jobs/deadline.job.js";

const PORT = process.env.PORT || 5000;
console.log("ENV TEST:", process.env.CLOUDINARY_API_KEY);

connectDB();
startDeadlineJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});