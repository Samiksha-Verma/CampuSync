import Groq from "groq-sdk";

export const analyzeResume = async (resumeText) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const prompt = `
You are an expert resume reviewer. Analyze this resume carefully and give UNIQUE scores based on actual content.

STRICT RULES:
- Every resume is different — scores must reflect actual quality
- Do NOT give same scores to different resumes
- Analyze each section independently and carefully

SCORING GUIDE:
- overallScore: Based on all sections combined
- skills: Rate based on variety, relevance, and depth of skills listed
- experience: Real job = 70-90, Only projects = 40-65, No projects = 10-30
- education: Based on college tier, CGPA if mentioned, relevant degree
- formatting: Clean and readable = 80-95, Messy = 30-60
- summary: Strong and specific = 75-90, Generic = 40-65, Missing = 0
- atsScore: Keyword-rich = 70-85, Missing keywords = 40-60, Tables/images = penalize

PENALIZE FOR:
- No certifications: -10
- No metrics/numbers in projects: -10
- Generic project descriptions: -8
- Missing LinkedIn/GitHub: -5
- No action verbs: -5

REWARD FOR:
- Quantified achievements: +10
- Multiple strong projects: +8
- Relevant certifications: +10
- Clean ATS-friendly format: +8

RESUME CONTENT:
${resumeText}

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallScore": <number 0-100>,
  "sectionScores": {
    "skills": <number 0-100>,
    "experience": <number 0-100>,
    "education": <number 0-100>,
    "formatting": <number 0-100>,
    "summary": <number 0-100>
  },
  "atsScore": <number 0-100>,
  "strengths": ["specific strength from THIS resume", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement for THIS resume", "improvement 2", "improvement 3"],
  "suggestions": ["actionable suggestion for THIS resume", "suggestion 2", "suggestion 3"]
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");

  return JSON.parse(jsonMatch[0]);
};
