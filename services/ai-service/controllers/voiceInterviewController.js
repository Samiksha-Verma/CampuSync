const { callGroqJson, GroqServiceError } = require('../utils/groqClient');
const { getResumePdfBuffer, ResumeInputError } = require('../utils/getResumePdf');
const { extractPdfText } = require('../utils/extractPdfText');

// Total spoken questions per interview - within the requested 8-10 range. Kept as a
// single constant so the "wrap up now" check in nextQuestion and the messaging here
// always agree.
const TARGET_QUESTIONS = 9;

const INTERVIEWER_PERSONA =
  'You are an experienced technical interviewer conducting a spoken mock interview with a college student. ' +
  'Ask real, substantive questions the way a human interviewer would - natural spoken phrasing, not written-exam ' +
  'phrasing. Cover BREADTH across the candidate\'s different skills, projects, and experience rather than drilling ' +
  'deep into a single topic - a good interview samples several distinct areas instead of following up ' +
  'exhaustively on just one. Ground every question in something specific and real from the resume (a named ' +
  'project, technology, or role) and the target job role, never a generic question that could apply to anyone.';

const START_SCHEMA_DESCRIPTION = `{
  "candidateSummary": string (a dense 3-5 sentence internal summary of this candidate's background from their resume - concrete skills, technologies, named projects, and experience relevant to the target role. This replaces the resume as context for every later question in this interview, so it must carry every specific detail worth asking about - do not summarize vaguely),
  "skillAreas": string[] (5 to 8 distinct, specific skill/topic areas drawn from THIS resume that are relevant to the stated role and worth covering across the interview - e.g. a specific technology, a named project, a domain like "system design" or "databases", or a soft-skill area like "teamwork" if the resume shows real evidence of it; each must be specific to this candidate, never generic filler categories),
  "firstQuestion": string (the opening spoken interview question - grounded in the resume and role, natural to say aloud, not a generic icebreaker like "tell me about yourself" unless the resume genuinely gives nothing better to open with),
  "firstQuestionArea": string (which one of skillAreas this first question targets - must be an exact match, copied verbatim, to one of the entries in skillAreas)
}`;

const NEXT_SCHEMA_DESCRIPTION = `{
  "question": string (the next spoken interview question - should follow naturally from the conversation so far, a brief natural acknowledgment of the previous answer is fine before pivoting, but must move to a genuinely different skill area rather than following up further on the same one),
  "questionArea": string (copy this EXACTLY, verbatim, same wording and capitalization, do not paraphrase or shorten it, from one of the strings in the provided skillAreas list - whichever one this question targets; must be an area that has NOT already been covered by a prior question, unless every area has already been covered at least once, in which case pick whichever area most deserves a deeper second question)
}`;

const SUMMARY_SCHEMA_DESCRIPTION = `{
  "overallClarityScore": number (0-100, average clarity across all answers in the interview),
  "overallRelevanceScore": number (0-100, average relevance/directness across all answers),
  "summary": string (a 2-4 sentence holistic assessment of the candidate's performance across the whole interview),
  "strengths": string[] (specific things the candidate did well, each referencing a specific question or answer from the transcript),
  "improvementSuggestions": string[] (specific, actionable suggestions for improvement, each referencing a specific question or answer where relevant),
  "areaBreakdown": [{"area": string, "performance": string (one short sentence on how the candidate did specifically in this area)}, ...] (one entry per skill area actually asked about in this interview)
}`;

// The model is asked to copy a skillArea string verbatim, but it still sometimes
// paraphrases it (different word order, "&" vs "and", etc). Snapping
// back to the canonical label by word-overlap keeps the "areas already covered" dedup
// logic (and the UI's area badges) consistent across turns instead of silently
// drifting into a new label every time the same topic comes up.
const wordsOf = (s) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );

const normalizeArea = (rawArea, skillAreas) => {
  if (!rawArea) return rawArea;
  if (skillAreas.includes(rawArea)) return rawArea;
  const rawWords = wordsOf(rawArea);
  let best = rawArea;
  let bestScore = 0;
  for (const area of skillAreas) {
    const areaWords = wordsOf(area);
    const overlap = [...rawWords].filter((w) => areaWords.has(w)).length;
    const score = overlap / Math.max(1, Math.min(rawWords.size, areaWords.size));
    if (score > bestScore) {
      bestScore = score;
      best = area;
    }
  }
  return bestScore >= 0.5 ? best : rawArea;
};

const formatTranscript = (history) =>
  history
    .map((h, i) => `Q${i + 1} (${h.area || 'general'}): ${h.question}\nA${i + 1}: ${h.answer?.trim() || '(no answer given)'}`)
    .join('\n\n');

// POST /ai/interview/start (Student only)
// Accepts a resume (fresh upload or vault documentId, same dual-input pattern as
// /ai/resume-analyzer) plus the target role, extracts the resume's text once, and
// returns a candidateSummary + skillAreas that the client carries forward on every
// subsequent /next call instead of resending the PDF - cheaper and faster than
// re-uploading the full document every turn.
const startInterview = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ message: '"role" is required' });
    }

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
      console.error('[voiceInterview] Failed to extract PDF text:', err);
      return res.status(400).json({ message: 'Could not read that PDF - it may be corrupted.' });
    }
    if (!resumeText || !resumeText.trim()) {
      return res
        .status(400)
        .json({ message: 'Could not extract any text from that PDF - it may be a scanned image rather than real text.' });
    }

    const result = await callGroqJson({
      system: INTERVIEWER_PERSONA,
      prompt:
        `Resume content:\n"""\n${resumeText.trim()}\n"""\n\n` +
        `The candidate is interviewing for this role: "${role.trim()}". Read their resume, identify the ` +
        'distinct skill areas worth covering across a full interview for this role, and ask your opening question.',
      schemaDescription: START_SCHEMA_DESCRIPTION,
      requiredKeys: ['candidateSummary', 'skillAreas', 'firstQuestion', 'firstQuestionArea'],
      maxOutputTokens: 2048,
    });

    return res.status(200).json({
      candidateSummary: result.candidateSummary,
      skillAreas: result.skillAreas,
      question: result.firstQuestion,
      questionArea: normalizeArea(result.firstQuestionArea, result.skillAreas),
      questionNumber: 1,
      totalTarget: TARGET_QUESTIONS,
      isComplete: false,
      closingRemark: '',
    });
  } catch (err) {
    if (err instanceof GroqServiceError) return res.status(err.status).json({ message: err.message });
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while starting the interview' });
  }
};

// POST /ai/interview/next (Student only)
// Stateless per request, like Chat Assistant - the client resends role,
// candidateSummary, skillAreas, and the full Q&A history each time. Whether the
// interview is done is decided deterministically here by question count (never left
// to the model to guess), so the interview always lands on exactly TARGET_QUESTIONS
// questions; the model is only asked to pick WHICH not-yet-covered area to ask about next.
const nextQuestion = async (req, res) => {
  try {
    const { role, candidateSummary, skillAreas, history } = req.body;

    if (
      !role ||
      typeof role !== 'string' ||
      !candidateSummary ||
      typeof candidateSummary !== 'string' ||
      !Array.isArray(skillAreas) ||
      !Array.isArray(history)
    ) {
      return res.status(400).json({ message: 'role, candidateSummary, skillAreas, and history are required' });
    }

    const questionsAskedSoFar = history.length;

    if (questionsAskedSoFar >= TARGET_QUESTIONS) {
      return res.status(200).json({
        isComplete: true,
        question: '',
        questionArea: '',
        closingRemark: "That's a wrap on the interview questions — nicely done. Let's look at how you did.",
        questionNumber: questionsAskedSoFar,
        totalTarget: TARGET_QUESTIONS,
      });
    }

    // Rather than just describing coverage in prose and trusting the model to spread
    // questions out on its own (observed live: it can fixate on one area 3+ times
    // while others go untouched), compute the actual least-asked area(s) server-side
    // and hand the model a closed shortlist it MUST pick from. This is what keeps
    // repeat rounds distributed instead of drilling one topic.
    const areaCounts = {};
    skillAreas.forEach((area) => {
      areaCounts[area] = 0;
    });
    history.forEach((h) => {
      if (h.area in areaCounts) areaCounts[h.area] += 1;
    });
    const minCount = Math.min(...Object.values(areaCounts));
    const eligibleAreas = skillAreas.filter((area) => areaCounts[area] === minCount);

    const result = await callGroqJson({
      system: INTERVIEWER_PERSONA,
      prompt:
        `Role: ${role}\nCandidate background: ${candidateSummary}\n` +
        `This will be question ${questionsAskedSoFar + 1} of ${TARGET_QUESTIONS} total.\n\n` +
        `Transcript so far:\n${formatTranscript(history)}\n\n` +
        `You MUST set questionArea to exactly one of these areas (copied verbatim): ${eligibleAreas.join(', ')}\n` +
        `These are the area(s) asked about the fewest times so far (${minCount} time(s) each) - to keep the ` +
        'interview balanced across the candidate\'s skills, do not choose any other area even if a different ' +
        'one feels like a more natural follow-up to the last answer.\n\n' +
        'Ask the next question, targeting one of those eligible areas.',
      schemaDescription: NEXT_SCHEMA_DESCRIPTION,
      requiredKeys: ['question', 'questionArea'],
      maxOutputTokens: 1024,
    });

    return res.status(200).json({
      isComplete: false,
      question: result.question,
      questionArea: normalizeArea(result.questionArea, skillAreas),
      closingRemark: '',
      questionNumber: questionsAskedSoFar + 1,
      totalTarget: TARGET_QUESTIONS,
    });
  } catch (err) {
    if (err instanceof GroqServiceError) return res.status(err.status).json({ message: err.message });
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while generating the next question' });
  }
};

// POST /ai/interview/summary (Student only)
// One aggregated report across the whole transcript.
const getInterviewSummary = async (req, res) => {
  try {
    const { role, candidateSummary, history } = req.body;

    if (
      !role ||
      typeof role !== 'string' ||
      !candidateSummary ||
      typeof candidateSummary !== 'string' ||
      !Array.isArray(history) ||
      history.length === 0
    ) {
      return res.status(400).json({ message: 'role, candidateSummary, and a non-empty history are required' });
    }

    const feedback = await callGroqJson({
      system:
        'You are an expert interview coach for college students preparing for internship/job interviews. ' +
        'Evaluate the ENTIRE interview transcript holistically - structure, relevance, and clarity across all ' +
        'answers together, not each answer in isolation. Give specific, actionable feedback that references real ' +
        'moments from the transcript, never generic advice.',
      prompt:
        `Role interviewed for: ${role}\nCandidate background: ${candidateSummary}\n\n` +
        `Full interview transcript:\n${formatTranscript(history)}\n\n` +
        "Evaluate the candidate's overall performance across this entire interview.",
      schemaDescription: SUMMARY_SCHEMA_DESCRIPTION,
      requiredKeys: [
        'overallClarityScore',
        'overallRelevanceScore',
        'summary',
        'strengths',
        'improvementSuggestions',
        'areaBreakdown',
      ],
      maxOutputTokens: 3072,
    });

    return res.status(200).json({ feedback });
  } catch (err) {
    if (err instanceof GroqServiceError) return res.status(err.status).json({ message: err.message });
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while generating interview feedback' });
  }
};

module.exports = { startInterview, nextQuestion, getInterviewSummary };
