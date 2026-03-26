import Groq from "groq-sdk";

export const generateTest = async (jobRole, difficulty = "medium") => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `
You are an expert technical interviewer. Generate a mock test for a "${jobRole}" position.
Difficulty level: ${difficulty}

Generate exactly 10 multiple choice questions testing real technical knowledge.

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "questions": [
    {
      "questionText": "question here",
      "options": {
        "A": "option A",
        "B": "option B",
        "C": "option C",
        "D": "option D"
      },
      "correctAnswer": "A",
      "explanation": "why this is correct",
      "topic": "topic name"
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000,
    temperature: 0.7,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");

  return JSON.parse(jsonMatch[0]);
};

export const evaluateTest = async (jobRole, questions) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const summary = questions.map((q) => ({
    topic: q.topic,
    correct: q.isCorrect,
    userAnswer: q.userAnswer,
    correctAnswer: q.correctAnswer,
  }));

  const prompt = `
A student appeared for a "${jobRole}" mock test. Here are their results:
${JSON.stringify(summary, null, 2)}

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallFeedback": "2-3 lines overall performance feedback",
  "strongTopics": ["topic1", "topic2"],
  "topicsToImprove": ["topic1", "topic2"]
}`;

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
