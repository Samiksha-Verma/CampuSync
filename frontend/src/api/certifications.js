import { client } from './client';

export const listCertifications = ({ category, includeExpired } = {}) =>
  client
    .get('/certifications', {
      params: { ...(category ? { category } : {}), ...(includeExpired ? { includeExpired: 'true' } : {}) },
    })
    .then((r) => r.data.certifications);

export const getCertification = (id) => client.get(`/certifications/${id}`).then((r) => r.data.certification);

// Create/update are multipart so an optional bannerImageFile can ride along with the text fields.
const toFormData = ({ bannerImageFile, ...fields }) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value ?? ''));
  if (bannerImageFile) formData.append('bannerImage', bannerImageFile);
  return formData;
};

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const createCertification = (payload) =>
  client.post('/certifications', toFormData(payload), multipart).then((r) => r.data.certification);

export const updateCertification = (id, payload) =>
  client.put(`/certifications/${id}`, toFormData(payload), multipart).then((r) => r.data.certification);

export const deleteCertification = (id) => client.delete(`/certifications/${id}`).then((r) => r.data);
