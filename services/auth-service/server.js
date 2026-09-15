require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const studentAuthRoutes = require('./routes/studentAuthRoutes');
const facultyAuthRoutes = require('./routes/facultyAuthRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const internalRoutes = require('./routes/internalRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'auth-service' }));

app.use('/auth/student', studentAuthRoutes);
app.use('/auth/faculty', facultyAuthRoutes);
app.use('/auth/admin', adminAuthRoutes);
app.use('/auth/internal', internalRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[auth-service] listening on port ${PORT}`);
  });
});
