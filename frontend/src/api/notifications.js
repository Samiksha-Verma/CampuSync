import { client } from './client';

export const getMyNotifications = () => client.get('/notifications/me').then((r) => r.data.notifications);

export const markNotificationRead = (id) => client.put(`/notifications/${id}/read`).then((r) => r.data.notification);
