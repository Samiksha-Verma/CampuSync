import { client } from './client';

export const uploadDocument = (file, category) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('category', category);
  return client
    .post('/vault/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.document);
};

export const listDocuments = (category) =>
  client.get('/vault/me', { params: category ? { category } : {} }).then((r) => r.data.documents);

export const deleteDocument = (id) => client.delete(`/vault/${id}`).then((r) => r.data);

// Streams the file back as a blob and triggers a real browser download using the
// filename the server sent - the vault never exposes a direct Cloudinary URL to the
// client, so this is the only way to retrieve the bytes.
export const downloadDocument = async (id, fallbackName) => {
  const res = await client.get(`/vault/${id}/download`, { responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackName || 'document';

  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
