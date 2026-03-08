import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import eventRoutes from "./routes/event.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import certificationRoutes from "./routes/certification.routes.js";
import documentRoutes from "./routes/document.routes.js";
import recruiterRoutes from "./routes/recruiter.routes.js";
import studentRoutes from "./routes/student.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import notificationSettingRoutes from "./routes/notificationSetting.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/notifications",notificationRoutes)
app.use("/api/notification-settings",notificationSettingRoutes)

app.get("/", (req, res) => {
  res.send("CampuSync Backend Running 🚀");
});

export default app;