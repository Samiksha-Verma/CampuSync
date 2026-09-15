require('dotenv').config();


const express = require('express');
const cors = require('cors');
const multer = require('multer');

const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'ai-service' }));

app.use('/ai', aiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Turns multer errors (oversized file, wrong mimetype) into clean JSON instead of a crash
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('are supported')) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log(`[ai-service] listening on port ${PORT}`);
});
