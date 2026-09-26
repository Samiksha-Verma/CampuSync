const Certification = require('../models/Certification');
const notify = require('../utils/notify');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

const REQUIRED_FIELDS = ['courseName', 'platform', 'deadline', 'externalLink'];
const UPDATABLE_FIELDS = ['courseName', 'platform', 'companyName', 'deadline', 'description', 'externalLink', 'category'];

// Admin/Faculty can pass ?includeExpired=true to see history; Students never see expired postings.
const buildExpiryFilter = (req) => {
  const includeExpired = req.query.includeExpired === 'true' && ['admin', 'faculty'].includes(req.user.role);
  return includeExpired ? {} : { deadline: { $gte: new Date() } };
};

// GET /certifications?category=...
const listCertifications = async (req, res) => {
  try {
    const filter = buildExpiryFilter(req);

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const certifications = await Certification.find(filter).sort({ deadline: 1 });
    return res.status(200).json({ certifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching certifications' });
  }
};

// GET /certifications/:id - always returns regardless of expiry
const getCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    return res.status(200).json({ certification });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid certification id' });
  }
};

// POST /certifications (Admin/Faculty only)
const createCertification = async (req, res) => {
  try {
    for (const field of REQUIRED_FIELDS) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    let bannerImageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      bannerImageUrl = result.secure_url;
    }

    const certification = await Certification.create({
      bannerImageUrl,
      courseName: req.body.courseName,
      platform: req.body.platform,
      companyName: req.body.companyName,
      deadline: req.body.deadline,
      description: req.body.description,
      externalLink: req.body.externalLink,
      category: req.body.category,
      createdBy: req.user.id,
    });

    await notify({
      type: 'certification_created',
      message: `New certification posted: ${certification.courseName}`,
      relatedEntityId: certification._id,
    });

    return res.status(201).json({ certification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while creating the certification' });
  }
};

// PUT /certifications/:id (Admin/Faculty only, creator-or-admin - req.record set by ownership middleware)
const updateCertification = async (req, res) => {
  try {
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) req.record[field] = req.body[field];
    }
    // A new file replaces the banner; no file leaves the current one untouched.
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      req.record.bannerImageUrl = result.secure_url;
    }
    await req.record.save();

    await notify({
      type: 'certification_updated',
      message: `Certification updated: ${req.record.courseName}`,
      relatedEntityId: req.record._id,
    });

    return res.status(200).json({ certification: req.record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while updating the certification' });
  }
};

// DELETE /certifications/:id (Admin/Faculty only, creator-or-admin)
const deleteCertification = async (req, res) => {
  try {
    const { _id, courseName } = req.record;
    await req.record.deleteOne();

    await notify({
      type: 'certification_deleted',
      message: `Certification removed: ${courseName}`,
      relatedEntityId: _id,
    });

    return res.status(200).json({ message: 'Certification deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while deleting the certification' });
  }
};

module.exports = { listCertifications, getCertification, createCertification, updateCertification, deleteCertification };
