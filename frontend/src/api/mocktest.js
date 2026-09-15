import { client } from './client';

export const getCategoryStats = () => client.get('/mocktest/categories').then((r) => r.data.categories);

export const getQuestions = (category, count = 10) =>
  client.get('/mocktest/questions', { params: { category, count } }).then((r) => r.data.questions);

export const submitAttempt = (payload) => client.post('/mocktest/submit', payload).then((r) => r.data);

export const getHistory = (category) =>
  client.get('/mocktest/history', { params: category ? { category } : {} }).then((r) => r.data.attempts);

export const createQuestion = (payload) => client.post('/mocktest/questions', payload).then((r) => r.data.question);
