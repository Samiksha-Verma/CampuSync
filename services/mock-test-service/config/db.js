const mongoose = require('mongoose');

// Local dev starts every service in parallel (see the root package.json's dev
// script) - MongoDB Atlas is a remote cluster, not something that needs to "finish
// booting" like a local container, but a fresh connection can still hit a transient
// network blip right at startup. Retries with backoff instead of crashing on the
// first failure, since nodemon does NOT auto-restart a crashed process without a
// file change.
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[mock-test-service] MongoDB connected');
  } catch (err) {
    console.error(`[mock-test-service] MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}):`, err.message);
    if (attempt >= MAX_RETRIES) {
      console.error('[mock-test-service] Giving up after max retries - exiting.');
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectDB(attempt + 1);
  }
};

module.exports = connectDB;
