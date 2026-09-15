const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/me', verifyToken, requireRole('student'), getMyNotifications);
router.put('/:id/read', verifyToken, requireRole('student'), markAsRead);

module.exports = router;
