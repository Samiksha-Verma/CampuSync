const express = require('express');
const router = express.Router();
const { uploadDocument, getMyDocuments, downloadDocument, deleteDocument } = require('../controllers/vaultController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireOwner } = require('../middleware/ownership');
const upload = require('../utils/upload');

router.post('/upload', verifyToken, requireRole('student'), upload.single('document'), uploadDocument);
router.get('/me', verifyToken, requireRole('student'), getMyDocuments);
router.get('/:id/download', verifyToken, requireRole('student'), requireOwner, downloadDocument);
router.delete('/:id', verifyToken, requireRole('student'), requireOwner, deleteDocument);

module.exports = router;
