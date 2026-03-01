import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import eventRoutes from "./routes/event.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";



const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/opportunities", opportunityRoutes);

app.get("/", (req, res) => {
  res.send("CampuSync Backend Running 🚀");
});

export default app;