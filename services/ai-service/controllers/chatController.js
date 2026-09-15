const { callGroqChat, GroqServiceError } = require('../utils/groqClient');

const SYSTEM_PROMPT =
  "You are CampuSync's AI assistant, helping college students with career, academic, and campus-opportunity " +
  'questions - things like resume advice, interview prep, choosing electives, internship strategy, and how to ' +
  "use the platform's Events/Opportunities/Certifications features. Keep answers concise and practical. If asked " +
  "something outside this scope, say so briefly rather than guessing.";

// POST /ai/chat (Student only)
// Stateless per request - the client sends the full conversation history each time
// (the standard way to use these APIs), so there's no server-side session/thread to
// manage or persist. The client's history is already {role: 'user'|'assistant',
// content} - Groq's chat completions are OpenAI-compatible, so that's also exactly
// the shape the API itself expects, no translation needed.
const chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: '"message" is required' });
    }

    const cleanHistory = Array.isArray(history)
      ? history
          .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .map((h) => ({ role: h.role, content: h.content }))
      : [];

    const reply = await callGroqChat({ system: SYSTEM_PROMPT, history: cleanHistory, message });

    return res.status(200).json({ reply });
  } catch (err) {
    if (err instanceof GroqServiceError) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong while chatting with the AI assistant' });
  }
};

module.exports = { chat };
