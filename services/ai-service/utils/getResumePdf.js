const VAULT_SERVICE_URL = process.env.DOCUMENT_VAULT_SERVICE_URL || 'http://localhost:5006';

class ResumeInputError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Shared by resume-analyzer and the voice-interview flow - both accept EITHER a
// fresh multipart "resume" file upload, OR a "documentId" referencing an existing
// document-vault-service document. For the vault path, the student's own
// Authorization header is forwarded as-is to vault-service's existing download
// endpoint - that endpoint already enforces "students can only download their own
// documents", so no new auth machinery is needed here.
const getResumePdfBuffer = async (req) => {
  if (req.file) {
    if (req.file.mimetype !== 'application/pdf') {
      throw new ResumeInputError('Only PDF resumes are supported', 400);
    }
    return req.file.buffer;
  }

  if (req.body.documentId) {
    let vaultRes;
    try {
      vaultRes = await fetch(`${VAULT_SERVICE_URL}/vault/${req.body.documentId}/download`, {
        headers: { Authorization: req.headers.authorization },
      });
    } catch (err) {
      throw new ResumeInputError('Could not reach the document vault', 502);
    }

    if (vaultRes.status === 403 || vaultRes.status === 404) {
      throw new ResumeInputError('Document not found or not accessible', vaultRes.status);
    }
    if (!vaultRes.ok) {
      throw new ResumeInputError('Could not retrieve the document from the vault', 502);
    }

    const contentType = vaultRes.headers.get('content-type');
    if (contentType !== 'application/pdf') {
      throw new ResumeInputError(
        'Only PDF resumes are supported. Re-upload this document to the vault as a PDF.',
        400
      );
    }

    const arrayBuffer = await vaultRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new ResumeInputError('Provide either a "resume" file upload or a "documentId" referencing a vault document', 400);
};

module.exports = { getResumePdfBuffer, ResumeInputError };
