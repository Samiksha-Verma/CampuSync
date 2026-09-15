require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketServer');

const notificationRoutes = require('./routes/notificationRoutes');
const internalRoutes = require('./routes/internalRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'notification-service' }));

app.use('/notifications', notificationRoutes);
app.use('/notifications', internalRoutes); // adds POST /notifications/broadcast (internal-secret gated)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
});

const httpServer = http.createServer(app);
const io = initSocket(httpServer);
app.set('io', io); // so broadcastController can reach it via req.app.get('io')

const PORT = process.env.PORT || 5009;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[notification-service] listening on port ${PORT}`);
  });
});
