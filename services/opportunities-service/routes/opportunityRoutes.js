const express = require('express');
const router = express.Router();
const {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} = require('../controllers/opportunityController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { requireCreatorOrAdmin } = require('../middleware/ownership');
const Opportunity = require('../models/Opportunity');

router.get('/', verifyToken, listOpportunities);
router.get('/:id', verifyToken, getOpportunity);
router.post('/', verifyToken, requireRole('admin', 'faculty'), createOpportunity);
router.put(
  '/:id',
  verifyToken,
  requireRole('admin', 'faculty'),
  requireCreatorOrAdmin(Opportunity, 'Opportunity not found'),
  updateOpportunity
);
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin', 'faculty'),
  requireCreatorOrAdmin(Opportunity, 'Opportunity not found'),
  deleteOpportunity
);

module.exports = router;
