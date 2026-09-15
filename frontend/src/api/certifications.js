import { client } from './client';

export const listCertifications = ({ category, includeExpired } = {}) =>
  client
    .get('/certifications', {
      params: { ...(category ? { category } : {}), ...(includeExpired ? { includeExpired: 'true' } : {}) },
    })
    .then((r) => r.data.certifications);

export const getCertification = (id) => client.get(`/certifications/${id}`).then((r) => r.data.certification);

export const createCertification = (payload) => client.post('/certifications', payload).then((r) => r.data.certification);

export const updateCertification = (id, payload) =>
  client.put(`/certifications/${id}`, payload).then((r) => r.data.certification);

export const deleteCertification = (id) => client.delete(`/certifications/${id}`).then((r) => r.data);
