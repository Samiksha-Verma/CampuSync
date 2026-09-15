const express = require('express');
const router = express.Router();
const { getStudentById } = require('../controllers/internalController');
const { verifyInternalSecret } = require('../middleware/internalAuth');

// Never proxied through the gateway - other services call this directly on
// auth-service's own URL.
router.get('/students/:id', verifyInternalSecret, getStudentById);

module.exports = router;
