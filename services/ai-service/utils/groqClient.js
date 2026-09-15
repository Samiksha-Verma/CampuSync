const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// llama-3.3-70b-versatile (originally requested) is no longer available on this
// account's Groq API key - confirmed live against the /models endpoint, it's not in
// the returned list at all. openai/gpt-oss-120b is the closest available substitute:
// the largest general-purpose instruction-following chat model this key currently
// has access to, with the same JSON-mode support this client relies on.
const MODEL = 'openai/gpt-oss-120b';

class GroqServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Unlike Gemini's error shape, groq-sdk gives a real typed APIError with a reliable
// numeric `.status` - still logs the ORIGINAL error first so a failure is debuggable,
// then maps it to a clean client-facing message.
const mapError = (err) => {
  console.error('[groqClient] Groq API call failed:', err?.status, err?.message, err);

  const status = err?.status;
  const message = String(err?.message || '');

  if (status === 429 || /429|rate.?limit|quota/i.test(message)) {
    return new GroqServiceError('The AI service is rate-limited right now. Please try again shortly.', 429);
  }
  if (/timeout|deadline exceeded/i.test(message)) {
    return new GroqServiceError('The AI service timed out. Please try again.', 504);
  }
  if ((status && status >= 500) || /503|unavailable|internal error|overloaded/i.test(message)) {
    return new GroqServiceError('The AI service is temporarily unavailable. Please try again shortly.', 502);
  }
  if ((status && status >= 400) || /400|401|403|invalid|api key/i.test(message)) {
    return new GroqServiceError('The AI service rejected the request.', 502);
  }
  return new GroqServiceError('Something went wrong while contacting the AI service.', 500);
};

// High-demand/rate-limit responses are often genuinely transient - worth a couple of
// quick retries before giving up, same rationale as the Gemini client this replaced.
// A real 4xx (bad request, bad API key) won't be fixed by retrying.
const isTransientError = (err) => {
  const status = err?.status;
  const message = String(err?.message || '');
  return status === 429 || status === 503 || /429|503|rate.?limit|overloaded|unavailable/i.test(message);
};

const RETRY_ATTEMPTS = 2; // extra attempts after the first - 3 tries total
const RETRY_BASE_DELAY_MS = 1200;

const withTransientRetry = async (fn) => {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err) || attempt === RETRY_ATTEMPTS) throw err;
      const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
      console.warn(
        `[groqClient] Transient error (attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1}), retrying in ${delay}ms:`,
        err?.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
};

// Groq's JSON mode (response_format: {type:'json_object'}) guarantees syntactically
// valid JSON but - unlike Gemini's responseSchema - takes no schema argument, so the
// exact shape has to be spelled out in the prompt itself. `schemaDescription` is a
// human-readable block appended to the system prompt; `requiredKeys` are checked
// after parsing so a shape the model got wrong fails loudly here instead of reaching
// the frontend with missing fields.
const callGroqJson = async ({ system, prompt, schemaDescription, requiredKeys = [], maxOutputTokens = 1024 }) => {
  try {
    const fullSystem =
      `${system}\n\nRespond with ONLY a single valid JSON object - no markdown code fences, no commentary before ` +
      `or after it. It must match exactly this shape:\n${schemaDescription}`;

    const completion = await withTransientRetry(() =>
      groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: fullSystem },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: maxOutputTokens,
        temperature: 0.4,
      })
    );

    const text = completion.choices[0]?.message?.content || '';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error('[groqClient] Groq returned non-JSON despite json_object mode:', text);
      throw new GroqServiceError('The AI service did not return a structured response.', 502);
    }

    const missingKeys = requiredKeys.filter((key) => !(key in parsed));
    if (missingKeys.length) {
      console.error('[groqClient] Groq JSON missing required keys:', missingKeys, parsed);
      throw new GroqServiceError('The AI service returned an incomplete response.', 502);
    }

    return parsed;
  } catch (err) {
    if (err instanceof GroqServiceError) throw err;
    throw mapError(err);
  }
};

// Free-text conversational reply (Chat Assistant). `history` is already in the
// {role: 'user'|'assistant', content} shape the API expects natively - Groq's chat
// completions are OpenAI-compatible, so unlike the Gemini client this replaced, no
// role/shape translation is needed at all.
const callGroqChat = async ({ system, history, message, maxOutputTokens = 1024 }) => {
  try {
    const messages = [{ role: 'system', content: system }, ...history, { role: 'user', content: message }];

    const completion = await withTransientRetry(() =>
      groq.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: maxOutputTokens,
        temperature: 0.6,
      })
    );

    return completion.choices[0]?.message?.content || '';
  } catch (err) {
    throw mapError(err);
  }
};

module.exports = { callGroqJson, callGroqChat, GroqServiceError };
