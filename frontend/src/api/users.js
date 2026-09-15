import { client } from './client';

export const getProfile = (userId) => client.get(`/users/profile/${userId}`).then((r) => r.data.profile);

export const updateProfile = (userId, updates) =>
  client.put(`/users/profile/${userId}`, updates).then((r) => r.data.profile);

export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return client
    .post(`/users/profile/${userId}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.profile);
};
