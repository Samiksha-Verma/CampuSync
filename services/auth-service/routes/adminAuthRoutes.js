const express = require('express');
const router = express.Router();
const { login, getFacultyRequests, approveFacultyRequest, rejectFacultyRequest } = require('../controllers/adminAuthController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/faculty-requests', verifyToken, requireRole('admin'), getFacultyRequests);
router.put('/faculty-requests/:id/approve', verifyToken, requireRole('admin'), approveFacultyRequest);
router.put('/faculty-requests/:id/reject', verifyToken, requireRole('admin'), rejectFacultyRequest);

module.exports = router;
