const express = require('express');
const router = express.Router();
const { listEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireCreatorOrAdmin } = require('../middleware/ownership');
const upload = require('../utils/upload');
const Event = require('../models/Event');

router.get('/', verifyToken, listEvents);
router.get('/:id', verifyToken, getEvent);
router.post('/', verifyToken, requireRole('admin', 'faculty'), upload.single('bannerImage'), createEvent);
router.put(
  '/:id',
  verifyToken,
  requireRole('admin', 'faculty'),
  requireCreatorOrAdmin(Event, 'Event not found'),
  upload.single('bannerImage'),
  updateEvent
);
router.delete('/:id', verifyToken, requireRole('admin', 'faculty'), requireCreatorOrAdmin(Event, 'Event not found'), deleteEvent);

module.exports = router;
