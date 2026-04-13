import Groq from "groq-sdk";

// ─────────────────────────────────────────
// 📝 MCQ TEST
// ─────────────────────────────────────────
export const generateTest = async (jobRole, difficulty = "medium") => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `You are an expert technical interviewer. Generate a mock test for a "${jobRole}" position.
Difficulty level: ${difficulty}. Generate exactly 10 multiple choice questions testing real technical knowledge.
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "questions": [
    {
      "questionText": "question here",
      "options": { "A": "option A", "B": "option B", "C": "option C", "D": "option D" },
      "correctAnswer": "A",
      "explanation": "why this is correct",
      "topic": "topic name"
    }
  ]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000, temperature: 0.7,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

export const evaluateTest = async (jobRole, questions) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const summary = questions.map((q) => ({ topic: q.topic, correct: q.isCorrect, userAnswer: q.userAnswer, correctAnswer: q.correctAnswer }));
  const prompt = `A student appeared for a "${jobRole}" mock test. Results: ${JSON.stringify(summary, null, 2)}
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallFeedback": "2-3 lines overall performance feedback",
  "strongTopics": ["topic1", "topic2"],
  "topicsToImprove": ["topic1", "topic2"]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800, temperature: 0.7,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────
// 💻 CODING TEST — 2 Problems with Test Cases
// ─────────────────────────────────────────
export const generateCodingTest = async (dsaTopic, difficulty = "medium") => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are an expert competitive programming problem setter like LeetCode/HackerRank.
Generate exactly 2 coding problems on the DSA topic: "${dsaTopic}".
Difficulty: ${difficulty}

Each problem must have:
- A clear title and description
- Input/output format
- 3 concrete test cases with expected outputs
- Starter code in Python, JavaScript, Java, C++, and C

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "problems": [
    {
      "id": 1,
      "title": "Problem title",
      "description": "Full problem description",
      "inputFormat": "What input the function receives",
      "outputFormat": "What output is expected",
      "constraints": "Time/space constraints like 1 <= n <= 10^5",
      "examples": [
        { "input": "nums = [2,7,11,15], target = 9", "output": "0 1", "explanation": "Because nums[0] + nums[1] == 9" }
      ],
      "testCases": [
        { "input": "test input 1", "expectedOutput": "expected output 1" },
        { "input": "test input 2", "expectedOutput": "expected output 2" },
        { "input": "test input 3", "expectedOutput": "expected output 3" }
      ],
      "starterCode": {
        "python": "def solution(nums):\\n    pass",
        "javascript": "function solution(nums) {\\n    \\n}",
        "java": "class Solution {\\n    public int[] solve() {\\n        \\n    }\\n}",
        "cpp": "#include<bits/stdc++.h>\\nusing namespace std;\\nint main() {\\n    return 0;\\n}",
        "c": "#include<stdio.h>\\nint main() {\\n    return 0;\\n}"
      },
      "topic": "${dsaTopic}",
      "timeLimit": "30 minutes"
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4000, temperature: 0.7,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

// Evaluate ONE coding problem submission
export const evaluateCodingProblem = async (problem, userCode, language) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are an expert code reviewer evaluating a ${language} solution for a coding problem.

Problem: ${problem.title}
Description: ${problem.description}

Test Cases:
${JSON.stringify(problem.testCases, null, 2)}

Student's ${language} Code:
\`\`\`${language}
${userCode}
\`\`\`

Evaluate this code carefully. Check if it would pass each test case logically.

Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallScore": <number 0-100>,
  "correctnessScore": <number 0-10>,
  "efficiencyScore": <number 0-10>,
  "codeQualityScore": <number 0-10>,
  "testCaseResults": [
    { "testCase": 1, "input": "test input", "expectedOutput": "expected", "passed": true, "note": "Why passed or failed" },
    { "testCase": 2, "input": "test input", "expectedOutput": "expected", "passed": false, "note": "Why failed" },
    { "testCase": 3, "input": "test input", "expectedOutput": "expected", "passed": true, "note": "Why passed" }
  ],
  "testCasesPassed": <number 0-3>,
  "totalTestCases": 3,
  "isCorrect": <true or false>,
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "feedback": "Detailed feedback on the solution in 2-3 sentences",
  "improvements": ["improvement 1", "improvement 2"],
  "optimalApproach": "Brief description of the optimal approach"
}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500, temperature: 0.4,
  });

  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────
// 🧮 APTITUDE TEST
// ─────────────────────────────────────────
export const generateAptitudeTest = async (aptitudeType = "mixed", difficulty = "medium") => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const typeDesc = {
    quantitative: "mathematical problems including percentages, profit-loss, time-speed-distance, averages, ratios",
    logical: "logical reasoning including patterns, sequences, analogies, blood relations, directions",
    verbal: "verbal ability including synonyms, antonyms, sentence completion, reading comprehension",
    mixed: "mix of quantitative math, logical reasoning, and verbal ability questions",
  };
  const prompt = `You are an aptitude test expert. Generate 15 aptitude questions.
Type: ${aptitudeType} — ${typeDesc[aptitudeType] || typeDesc.mixed}
Difficulty: ${difficulty}
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "questions": [
    {
      "questionText": "question here",
      "options": { "A": "option A", "B": "option B", "C": "option C", "D": "option D" },
      "correctAnswer": "A",
      "explanation": "step by step solution",
      "category": "Quantitative/Logical/Verbal",
      "topic": "specific topic like Percentages, Patterns etc"
    }
  ]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4000, temperature: 0.6,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

export const evaluateAptitudeTest = async (aptitudeType, questions) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const summary = questions.map((q) => ({ category: q.category, topic: q.topic, correct: q.isCorrect }));
  const prompt = `Student completed a ${aptitudeType} aptitude test. Results: ${JSON.stringify(summary, null, 2)}
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallFeedback": "2-3 lines feedback",
  "categoryBreakdown": { "Quantitative": 70, "Logical": 60, "Verbal": 80 },
  "strongTopics": ["topic1", "topic2"],
  "topicsToImprove": ["topic1", "topic2"],
  "studyTips": ["tip1", "tip2", "tip3"]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800, temperature: 0.6,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────
// 🧠 DSA TEST
// ─────────────────────────────────────────
export const generateDSATest = async (topic, difficulty = "medium") => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `You are a DSA expert. Generate 10 DSA questions on topic: "${topic}".
Difficulty: ${difficulty}. Mix of conceptual MCQ and complexity analysis questions.
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "questions": [
    {
      "questionText": "question here",
      "options": { "A": "option A", "B": "option B", "C": "option C", "D": "option D" },
      "correctAnswer": "A",
      "explanation": "detailed explanation",
      "topic": "${topic}",
      "questionType": "conceptual or complexity"
    }
  ]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3000, temperature: 0.6,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

export const evaluateDSATest = async (topic, questions) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const summary = questions.map((q) => ({ questionType: q.questionType, correct: q.isCorrect }));
  const prompt = `Student completed a DSA test on "${topic}". Results: ${JSON.stringify(summary, null, 2)}
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "overallFeedback": "2-3 lines feedback on DSA knowledge",
  "conceptualScore": 70,
  "complexityScore": 60,
  "strongAreas": ["area1", "area2"],
  "weakAreas": ["area1", "area2"],
  "nextTopicsToStudy": ["topic1", "topic2", "topic3"]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800, temperature: 0.6,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return naiah kiya");
  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────
// 📝 SUBJECTIVE TEST
// ─────────────────────────────────────────
export const generateSubjectiveTest = async (jobRole, difficulty = "medium") => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `You are an expert interviewer. Generate 5 subjective questions for a "${jobRole}" position.
Difficulty: ${difficulty}. Questions should require detailed written answers.
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "questions": [
    {
      "questionText": "detailed question here",
      "expectedPoints": ["key point 1", "key point 2", "key point 3"],
      "topic": "topic name",
      "maxScore": 10
    }
  ]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000, temperature: 0.7,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return nahi kiya");
  return JSON.parse(jsonMatch[0]);
};

export const evaluateSubjectiveTest = async (jobRole, questionsWithAnswers) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = `You are evaluating a subjective test for "${jobRole}" position.
Questions and Answers: ${JSON.stringify(questionsWithAnswers, null, 2)}
Respond ONLY in this exact JSON format (no extra text, no markdown, no backticks):
{
  "evaluations": [
    {
      "questionIndex": 0,
      "score": 7,
      "feedback": "specific feedback on this answer",
      "missedPoints": ["missed point 1"],
      "goodPoints": ["good point 1"]
    }
  ],
  "totalScore": 35,
  "maxPossibleScore": 50,
  "overallFeedback": "2-3 lines overall feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000, temperature: 0.5,
  });
  const text = response.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI ne valid JSON return naiah kiya");
  return JSON.parse(jsonMatch[0]);
};

