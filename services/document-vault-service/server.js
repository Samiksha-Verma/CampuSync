require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./config/db');

const vaultRoutes = require('./routes/vaultRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'document-vault-service' }));

app.use('/vault', vaultRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Turns multer errors (oversized file, wrong mimetype) into clean JSON instead of a crash
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('are allowed')) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5006;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[document-vault-service] listening on port ${PORT}`);
  });
});
