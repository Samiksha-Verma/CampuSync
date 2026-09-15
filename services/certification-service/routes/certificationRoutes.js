const express = require('express');
const router = express.Router();
const {
  listCertifications,
  getCertification,
  createCertification,
  updateCertification,
  deleteCertification,
} = require('../controllers/certificationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireCreatorOrAdmin } = require('../middleware/ownership');
const Certification = require('../models/Certification');

router.get('/', verifyToken, listCertifications);
router.get('/:id', verifyToken, getCertification);
router.post('/', verifyToken, requireRole('admin', 'faculty'), createCertification);
router.put(
  '/:id',
  verifyToken,
  requireRole('admin', 'faculty'),
  requireCreatorOrAdmin(Certification, 'Certification not found'),
  updateCertification
);
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin', 'faculty'),
  requireCreatorOrAdmin(Certification, 'Certification not found'),
  deleteCertification
);

module.exports = router;
