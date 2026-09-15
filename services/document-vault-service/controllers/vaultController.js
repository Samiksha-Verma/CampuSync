const Document = require('../models/Document');
const cloudinary = require('../config/cloudinary');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

const CATEGORIES = ['resume', 'certificate', 'offer_letter', 'id_document', 'internship_proof', 'other'];

// POST /vault/upload (Student only)
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided (field name must be "document")' });
    }

    const { category } = req.body;
    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(', ')}` });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `doc_${req.user.id}_${Date.now()}`,
    });

    const document = await Document.create({
      studentId: req.user.id,
      category,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      cloudinaryPublicId: result.public_id,
      cloudinaryResourceType: result.resource_type,
      cloudinaryFormat: result.format,
    });

    return res.status(201).json({ document });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while uploading the document' });
  }
};

// GET /vault/me?category=... (Student only)
const getMyDocuments = async (req, res) => {
  try {
    const filter = { studentId: req.user.id };

    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const documents = await Document.find(filter).sort({ uploadedAt: -1 });
    return res.status(200).json({ documents });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while fetching your documents' });
  }
};

// GET /vault/:id/download (Student only, own documents - req.record set by ownership middleware)
// Fetches the file server-side via a freshly-signed Cloudinary URL and streams the bytes
// back directly - the client never sees the Cloudinary URL at all, so there's nothing to
// leak or bypass the ownership check with.
//
// Uses cloudinary.utils.private_download_url() specifically - NOT cloudinary.url() with
// sign_url:true. Both look plausible for this, but only private_download_url produces a
// signature "authenticated"-type resources actually accept (it signs against Cloudinary's
// Admin API, matching what the Upload API itself validates); sign_url computes a
// differently-scoped signature meant for tamper-proofing transformation params on public
// delivery URLs, and 401s here even with an identical path/version/format. Confirmed by
// testing both directly against the real API before settling on this one.
const downloadDocument = async (req, res) => {
  try {
    const { cloudinaryPublicId, cloudinaryResourceType, cloudinaryFormat, fileType, fileName } = req.record;

    const signedUrl = cloudinary.utils.private_download_url(cloudinaryPublicId, cloudinaryFormat, {
      resource_type: cloudinaryResourceType,
      type: 'authenticated',
    });

    const cloudinaryRes = await fetch(signedUrl);
    if (!cloudinaryRes.ok) {
      console.error('Cloudinary fetch failed:', cloudinaryRes.status);
      return res.status(502).json({ message: 'Could not retrieve the file from storage' });
    }

    const arrayBuffer = await cloudinaryRes.arrayBuffer();

    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while downloading the document' });
  }
};

// DELETE /vault/:id (Student only, own documents - req.record set by ownership middleware)
const deleteDocument = async (req, res) => {
  try {
    const { cloudinaryPublicId, cloudinaryResourceType } = req.record;

    await cloudinary.uploader.destroy(cloudinaryPublicId, {
      resource_type: cloudinaryResourceType,
      type: 'authenticated',
    });

    await req.record.deleteOne();

    return res.status(200).json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while deleting the document' });
  }
};

module.exports = { uploadDocument, getMyDocuments, downloadDocument, deleteDocument };
