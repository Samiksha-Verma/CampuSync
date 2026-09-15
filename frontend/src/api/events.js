import { client } from './client';

export const listEvents = (includeExpired = false) =>
  client.get('/events', { params: includeExpired ? { includeExpired: 'true' } : {} }).then((r) => r.data.events);

export const getEvent = (id) => client.get(`/events/${id}`).then((r) => r.data.event);

export const createEvent = (payload) => client.post('/events', payload).then((r) => r.data.event);

export const updateEvent = (id, payload) => client.put(`/events/${id}`, payload).then((r) => r.data.event);

export const deleteEvent = (id) => client.delete(`/events/${id}`).then((r) => r.data);
