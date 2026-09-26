const Opportunity = require('../models/Opportunity');
const notify = require('../utils/notify');

const ROLE_TYPES = ['Remote', 'Full-time', 'Internship'];

// "https://www.Google.com/careers" -> "google.com". Returns '' for empty input and
// null when the value can't be read as a domain.
const normalizeDomain = (raw) => {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return '';
  const host = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split(/[/?#]/)[0].replace(/^www\./, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
};

const REQUIRED_FIELDS =['companyName', 'role', 'deadline', 'applicationLink', 'type', 'roleType'];
const UPDATABLE_FIELDS = [
  'companyName',
  'role',
  'eligibilityCriteria',
  'skillsRequired',
  'location',
  'companyWebsite',
  'roleType',
  'stipendOrSalary',
  'deadline',
  'applicationLink',
  'description',
  'type',
];

// Admin/Faculty can pass ?includeExpired=true to see history; Students never see expired postings.
const buildExpiryFilter = (req) => {
  const includeExpired = req.query.includeExpired === 'true' && ['admin', 'faculty'].includes(req.user.role);
  return includeExpired ? {} : { deadline: { $gte: new Date() } };
};

// GET /opportunities?type=internship|job
const listOpportunities = async (req, res) => {
  try {
    const filter = buildExpiryFilter(req);

    if (req.query.type && ['internship', 'job'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const opportunities = await Opportunity.find(filter).sort({ deadline: 1 });
    return res.status(200).json({ opportunities });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching opportunities' });
  }
};

// GET /opportunities/:id - always returns regardless of expiry
const getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }
    return res.status(200).json({ opportunity });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid opportunity id' });
  }
};

// POST /opportunities (Admin/Faculty only)
const createOpportunity = async (req, res) => {
  try {
    for (const field of REQUIRED_FIELDS) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    if (!['internship', 'job'].includes(req.body.type)) {
      return res.status(400).json({ message: 'type must be "internship" or "job"' });
    }

    if (!ROLE_TYPES.includes(req.body.roleType)) {
      return res.status(400).json({ message: `roleType must be one of ${ROLE_TYPES.join(', ')}` });
    }

    const companyWebsite = normalizeDomain(req.body.companyWebsite);
    if (companyWebsite === null) {
      return res.status(400).json({ message: 'companyWebsite must be a valid domain, e.g. google.com' });
    }

    const opportunity = await Opportunity.create({
      companyName: req.body.companyName,
      companyWebsite,
      role: req.body.role,
      eligibilityCriteria: req.body.eligibilityCriteria,
      skillsRequired: req.body.skillsRequired,
      location: req.body.location,
      roleType: req.body.roleType,
      stipendOrSalary: req.body.stipendOrSalary,
      deadline: req.body.deadline,
      applicationLink: req.body.applicationLink,
      description: req.body.description,
      type: req.body.type,
      createdBy: req.user.id,
    });

    await notify({
      type: 'opportunity_created',
      message: `New ${opportunity.type}: ${opportunity.companyName} - ${opportunity.role}`,
      relatedEntityId: opportunity._id,
    });

    return res.status(201).json({ opportunity });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while creating the opportunity' });
  }
};

// PUT /opportunities/:id (Admin/Faculty only, creator-or-admin - req.record set by ownership middleware)
const updateOpportunity = async (req, res) => {
  try {
    if (req.body.type !== undefined && !['internship', 'job'].includes(req.body.type)) {
      return res.status(400).json({ message: 'type must be "internship" or "job"' });
    }

    if (req.body.roleType !== undefined && !ROLE_TYPES.includes(req.body.roleType)) {
      return res.status(400).json({ message: `roleType must be one of ${ROLE_TYPES.join(', ')}` });
    }

    if (req.body.companyWebsite !== undefined) {
      const companyWebsite = normalizeDomain(req.body.companyWebsite);
      if (companyWebsite === null) {
        return res.status(400).json({ message: 'companyWebsite must be a valid domain, e.g. google.com' });
      }
      req.body.companyWebsite = companyWebsite;
    }

    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) req.record[field] = req.body[field];
    }
    await req.record.save();

    await notify({
      type: 'opportunity_updated',
      message: `Opportunity updated: ${req.record.companyName} - ${req.record.role}`,
      relatedEntityId: req.record._id,
    });

    return res.status(200).json({ opportunity: req.record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while updating the opportunity' });
  }
};

// DELETE /opportunities/:id (Admin/Faculty only, creator-or-admin)
const deleteOpportunity = async (req, res) => {
  try {
    const { _id, companyName, role } = req.record;
    await req.record.deleteOne();

    await notify({
      type: 'opportunity_deleted',
      message: `Opportunity removed: ${companyName} - ${role}`,
      relatedEntityId: _id,
    });

    return res.status(200).json({ message: 'Opportunity deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while deleting the opportunity' });
  }
};

module.exports = { listOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity };
