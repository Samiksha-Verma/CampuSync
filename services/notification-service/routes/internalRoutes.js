const express = require('express');
const router = express.Router();
const { broadcast } = require('../controllers/broadcastController');
const { verifyInternalSecret } = require('../middleware/internalAuth');

// Never proxied through the gateway - other services call this directly on
// notification-service's own URL. See README for the routing rationale.
router.post('/broadcast', verifyInternalSecret, broadcast);

module.exports = router;
