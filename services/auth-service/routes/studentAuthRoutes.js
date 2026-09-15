const express = require('express');
const router = express.Router();
const { signup, updateMe, login } = require('../controllers/studentAuthController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.put('/me', verifyToken, updateMe);

module.exports = router;
