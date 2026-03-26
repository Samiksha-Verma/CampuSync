import Groq from "groq-sdk";

export const chatWithBot = async (userMessage, previousMessages = []) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const formattedHistory = previousMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are CampuSync's AI career assistant helping college students in India. 
Always respond in English only.
You help with: career guidance, resume tips, interview preparation, job search strategies, 
skill development, internship advice, and general career questions.
Keep responses concise, friendly, and practical.
Always be encouraging and supportive.`,
      },
      ...formattedHistory,
      { role: "user", content: userMessage },
    ],
    max_tokens: 800,
    temperature: 0.8,
  });

  return response.choices[0].message.content;
};

export const generateSessionTitle = async (firstMessage) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Generate a very short title (3-5 words max) for a chat that starts with: "${firstMessage}". 
Respond with ONLY the title, nothing else, no quotes, no punctuation.`,
      },
    ],
    max_tokens: 20,
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
};
