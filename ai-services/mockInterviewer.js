import Groq from "groq-sdk";

export const startInterview = async (jobRole, experienceLevel) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `
You are a professional interviewer conducting a voice interview for a "${jobRole}" position.
Candidate experience level: ${experienceLevel}

Generate the FIRST interview question. It should be an opening question like "Tell me about yourself".
Keep the question concise (1-2 sentences max) since it will be spoken aloud via text-to-speech.

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "question": "the interview question here",
  "questionNumber": 1,
  "totalQuestions": 5
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");

  return JSON.parse(jsonMatch[0]);
};

export const evaluateAndNextQuestion = async (
  jobRole,
  experienceLevel,
  questionNumber,
  question,
  transcribedAnswer,
  previousRounds
) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const isLastQuestion = questionNumber >= 5;

  const prompt = `
You are a professional interviewer for a "${jobRole}" position (${experienceLevel} level).

Current Question ${questionNumber}/5: "${question}"
Candidate's Answer: "${transcribedAnswer}"

Previous questions asked: ${previousRounds.map((r) => r.question).join(" | ")}

Evaluate this answer and ${isLastQuestion ? "set nextQuestion to null" : "generate the next interview question"}.
Keep all text concise since responses will be spoken via text-to-speech.

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "answerScore": <number 1-10>,
  "feedback": "2-3 sentences feedback on this answer",
  "suggestedAnswer": "what a good answer would include",
  "nextQuestion": ${isLastQuestion ? "null" : '"next interview question here"'}
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
    temperature: 0.7,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");

  return JSON.parse(jsonMatch[0]);
};

export const generateFinalFeedback = async (jobRole, experienceLevel, rounds) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const roundsSummary = rounds.map((r) => ({
    question: r.question,
    answer: r.transcribedAnswer,
    score: r.answerScore,
  }));

  const prompt = `
You are evaluating a completed voice interview for a "${jobRole}" position (${experienceLevel}).

Interview Summary:
${JSON.stringify(roundsSummary, null, 2)}

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallScore": <number 0-100>,
  "communicationScore": <number 0-10>,
  "technicalScore": <number 0-10>,
  "confidenceScore": <number 0-10>,
  "strengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2", "area3"],
  "overallFeedback": "3-4 sentences comprehensive feedback",
  "recommendation": "Strong Hire"
}

recommendation must be one of: "Strong Hire", "Hire", "Maybe", "No Hire"`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.7,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");

  return JSON.parse(jsonMatch[0]);
};
