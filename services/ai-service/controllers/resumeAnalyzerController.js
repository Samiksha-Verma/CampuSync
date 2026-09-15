const { callGroqJson, GroqServiceError } = require('../utils/groqClient');
const { getResumePdfBuffer, ResumeInputError } = require('../utils/getResumePdf');
const { extractPdfText } = require('../utils/extractPdfText');

const ANALYSIS_SCHEMA_DESCRIPTION = `{
  "atsScore": number (0-100, ATS - applicant tracking system - compatibility score),
  "summary": string (a short 2-3 sentence overall assessment of this specific resume),
  "keywordsFound": string[] (specific skills/tools/keywords ALREADY clearly present and well-represented in this resume - use the exact terms as they appear, e.g. "React", "PostgreSQL", "Agile"; empty array if genuinely none worth highlighting),
  "keywordsMissing": string[] (specific keywords/tools/phrases NOT present that are commonly expected for the role(s) this resume targets and would concretely improve ATS keyword matching - exact terms to add, e.g. "Docker" or "REST API design", never vague categories like "more technical skills"),
  "strengths": string[] (specific things this resume does well - each MUST reference actual content from the resume, quoting or closely paraphrasing a real bullet point, project, or line; never generic praise like "good experience section"),
  "weaknesses": string[] (specific, actionable content problems - vague or unquantified bullet points, missing sections, unclear job scope, weak action verbs, etc; each must point at an actual part of the resume and say exactly what to change it to; never generic advice like "add more detail"),
  "formattingFeedback": string[] (specific layout/formatting issues - inconsistent date formats, unclear section headers, dense paragraphs, inconsistent spacing, poor use of whitespace, etc, each pointing at where in the document it occurs)
}`;

const REQUIRED_KEYS = [
  'atsScore',
  'summary',
  'keywordsFound',
  'keywordsMissing',
  'strengths',
  'weaknesses',
  'formattingFeedback',
];

// POST /ai/resume-analyzer (Student only)
// Accepts EITHER a fresh multipart "resume" file upload, OR a JSON/form field
// "documentId" referencing an existing document-vault-service document. For the
// vault path, the student's own Authorization header is forwarded as-is to
// vault-service's existing download endpoint - that endpoint already enforces
// "students can only download their own documents", so no new auth machinery is
// needed here; we're just acting on the student's own behalf with their own token.
const analyzeResume = async (req, res) => {
  try {
    let pdfBuffer;
    try {
      pdfBuffer = await getResumePdfBuffer(req);
    } catch (err) {
      if (err instanceof ResumeInputError) return res.status(err.status).json({ message: err.message });
      throw err;
    }

    let resumeText;
    try {
      resumeText = await extractPdfText(pdfBuffer);
    } catch (err) {
      console.error('[resumeAnalyzer] Failed to extract PDF text:', err);
      return res.status(400).json({ message: 'Could not read that PDF - it may be corrupted.' });
    }
    if (!resumeText || !resumeText.trim()) {
      return res
        .status(400)
        .json({ message: 'Could not extract any text from that PDF - it may be a scanned image rather than real text.' });
    }

    const analysis = await callGroqJson({
      system:
        'You are an expert resume reviewer and ATS (applicant tracking system) specialist helping college ' +
        'students preparing for internship and job applications. Read the actual resume content closely before ' +
        'writing anything. Every strength, weakness, and keyword must be grounded in what is genuinely in this ' +
        'specific document - reference real bullet points, project names, or sections. Never write generic, ' +
        'boilerplate advice that could apply to any resume ("add more detail", "use action verbs") without tying ' +
        'it to something concrete on the page. If a section is empty, say so rather than inventing content.',
      prompt:
        `Resume content:\n"""\n${resumeText.trim()}\n"""\n\n` +
        'Analyze this resume and return the structured breakdown: ATS score, keywords already present, ' +
        'specific missing keywords, detailed strengths (each citing real resume content), detailed weaknesses ' +
        '(each specific and actionable), and formatting feedback.',
      schemaDescription: ANALYSIS_SCHEMA_DESCRIPTION,
      requiredKeys: REQUIRED_KEYS,
      maxOutputTokens: 2048,
    });

    return res.status(200).json({ analysis });
  } catch (err) {
    if (err instanceof GroqServiceError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while analyzing the resume' });
  }
};

module.exports = { analyzeResume };
