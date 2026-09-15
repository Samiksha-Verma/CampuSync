import { client } from './client';

// Long timeout - AI calls (especially resume analysis) can still take a while under
// load or retries; the gateway itself allows up to 60s for this prefix.
const AI_TIMEOUT = 55000;

export const analyzeResumeFile = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return client
    .post('/ai/resume-analyzer', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: AI_TIMEOUT })
    .then((r) => r.data.analysis);
};

export const analyzeResumeDocument = (documentId) =>
  client.post('/ai/resume-analyzer', { documentId }, { timeout: AI_TIMEOUT }).then((r) => r.data.analysis);

export const sendChatMessage = (message, history) =>
  client.post('/ai/chat', { message, history }, { timeout: AI_TIMEOUT }).then((r) => r.data.reply);

export const getRecommendations = () =>
  client.get('/ai/recommendations', { timeout: AI_TIMEOUT }).then((r) => r.data.recommendations);

export const startInterviewFile = (file, role) => {
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('role', role);
  return client
    .post('/ai/interview/start', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: AI_TIMEOUT })
    .then((r) => r.data);
};

export const startInterviewDocument = (documentId, role) =>
  client.post('/ai/interview/start', { documentId, role }, { timeout: AI_TIMEOUT }).then((r) => r.data);

export const getNextInterviewQuestion = (payload) =>
  client.post('/ai/interview/next', payload, { timeout: AI_TIMEOUT }).then((r) => r.data);

export const getInterviewSummary = (payload) =>
  client.post('/ai/interview/summary', payload, { timeout: AI_TIMEOUT }).then((r) => r.data.feedback);
