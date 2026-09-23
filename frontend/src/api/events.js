import { client } from './client';

export const listEvents = (includeExpired = false) =>
  client.get('/events', { params: includeExpired ? { includeExpired: 'true' } : {} }).then((r) => r.data.events);

export const getEvent = (id) => client.get(`/events/${id}`).then((r) => r.data.event);

// payload may include a `bannerImageFile` (File, optional) alongside the plain text
// fields - always sent as multipart/form-data so the optional image rides along in
// the same request rather than a separate upload step.
const toFormData = ({ bannerImageFile, ...fields }) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value ?? ''));
  if (bannerImageFile) formData.append('bannerImage', bannerImageFile);
  return formData;
};

export const createEvent = (payload) =>
  client
    .post('/events', toFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.event);

export const updateEvent = (id, payload) =>
  client
    .put(`/events/${id}`, toFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.event);

export const deleteEvent = (id) => client.delete(`/events/${id}`).then((r) => r.data);
