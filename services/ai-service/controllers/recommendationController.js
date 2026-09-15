const { callGroqJson, GroqServiceError } = require('../utils/groqClient');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const OPPORTUNITIES_SERVICE_URL = process.env.OPPORTUNITIES_SERVICE_URL || 'http://localhost:5004';

const RECOMMEND_SCHEMA_DESCRIPTION = `{
  "recommendations": [
    {
      "opportunityId": string (the id field of the opportunity, copied exactly),
      "companyName": string,
      "role": string,
      "matchScore": number (0-100, how good a fit this is for the student),
      "reason": string (one or two sentences on why this is a good fit)
    },
    ...
  ]
}
(recommendations is a ranked list of the opportunities most relevant to this student, most relevant first)`;

// GET /ai/recommendations (Student only)
// The one endpoint in this service that's inherently cross-service - both calls
// forward the student's own Authorization header, reusing the exact same
// authorization each service already enforces for that student's own requests.
const getRecommendations = async (req, res) => {
  try {
    const authHeader = { Authorization: req.headers.authorization };

    let profileRes;
    try {
      profileRes = await fetch(`${USER_SERVICE_URL}/users/profile/${req.user.id}`, { headers: authHeader });
    } catch (err) {
      return res.status(502).json({ message: 'Could not reach the profile service' });
    }
    if (!profileRes.ok) {
      return res.status(502).json({ message: 'Could not fetch your profile' });
    }
    const { profile } = await profileRes.json();

    let opportunitiesRes;
    try {
      opportunitiesRes = await fetch(`${OPPORTUNITIES_SERVICE_URL}/opportunities`, { headers: authHeader });
    } catch (err) {
      return res.status(502).json({ message: 'Could not reach the opportunities service' });
    }
    if (!opportunitiesRes.ok) {
      return res.status(502).json({ message: 'Could not fetch opportunities' });
    }
    const { opportunities } = await opportunitiesRes.json();

    if (!opportunities.length) {
      return res.status(200).json({ recommendations: [] });
    }

    const trimmedOpportunities = opportunities.map((o) => ({
      id: o._id,
      companyName: o.companyName,
      role: o.role,
      type: o.type,
      eligibilityCriteria: o.eligibilityCriteria,
      skillsRequired: o.skillsRequired,
      deadline: o.deadline,
    }));

    const result = await callGroqJson({
      system:
        'You are a career advisor for college students, matching them to relevant internship/job postings ' +
        'based on their branch and skills. Favor postings whose eligibility/skills genuinely align; do not ' +
        'recommend something just to fill out the list.',
      prompt:
        `Student profile:\nbranch: ${profile.branch || 'not specified'}\n` +
        `skills: ${(profile.skills || []).join(', ') || 'none listed'}\n\n` +
        `Available opportunities (JSON):\n${JSON.stringify(trimmedOpportunities)}\n\n` +
        'Rank the most relevant opportunities for this student.',
      schemaDescription: RECOMMEND_SCHEMA_DESCRIPTION,
      requiredKeys: ['recommendations'],
      maxOutputTokens: 2048,
    });

    return res.status(200).json({ recommendations: result.recommendations });
  } catch (err) {
    if (err instanceof GroqServiceError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while generating recommendations' });
  }
};

module.exports = { getRecommendations };
