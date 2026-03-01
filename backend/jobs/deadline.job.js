import cron from "node-cron";
import { deactivateExpiredEvents } from "../services/deadline.service.js";

const startDeadlineJob = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running deadline job...");
    await deactivateExpiredEvents();
  });
};

export default startDeadlineJob;