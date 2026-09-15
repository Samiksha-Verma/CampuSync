const Document = require('../models/Document');

// Student-only vault, no admin override (per design decision - see README).
// Fetches the record once here and attaches it to req.record.
const requireOwner = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.studentId !== req.user.id) {
      return res.status(403).json({ message: 'You can only access your own documents' });
    }

    req.record = document;
    return next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid document id' });
  }
};

module.exports = { requireOwner };
