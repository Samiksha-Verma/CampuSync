const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireSelfOrAdmin } = require('../middleware/ownership');
const upload = require('../utils/upload');

router.get('/:userId', verifyToken, getProfile);
router.put('/:userId', verifyToken, requireSelfOrAdmin, updateProfile);
router.post('/:userId/avatar', verifyToken, requireSelfOrAdmin, upload.single('avatar'), uploadAvatar);

module.exports = router;
