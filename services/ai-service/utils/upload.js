const multer = require('multer');

// PDF only - text is extracted server-side (see utils/extractPdfText.js) since the
// model is text-only; DOCX/DOC are rejected to keep exactly one document format to
// parse (see README, Phase 6).
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF resumes are supported'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

module.exports = upload;
