require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const certificationRoutes = require('./routes/certificationRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'certification-service' }));

app.use('/certifications', certificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5005;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[certification-service] listening on port ${PORT}`);
  });
});
