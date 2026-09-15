import { client } from './client';

export const studentSignup = (collegeId, email, password) =>
  client.post('/auth/student/signup', { collegeId, email, password }).then((r) => r.data);

export const studentLogin = (collegeId, password) =>
  client.post('/auth/student/login', { collegeId, password }).then((r) => r.data);

export const updateStudentMe = (updates) => client.put('/auth/student/me', updates).then((r) => r.data.user);

export const facultySignup = (payload) => client.post('/auth/faculty/signup', payload).then((r) => r.data);

export const facultyLogin = (email, password) =>
  client.post('/auth/faculty/login', { email, password }).then((r) => r.data);

export const adminLogin = (email, password) =>
  client.post('/auth/admin/login', { email, password }).then((r) => r.data);

export const getFacultyRequests = (status = 'pending') =>
  client.get('/auth/admin/faculty-requests', { params: { status } }).then((r) => r.data.requests);

export const approveFacultyRequest = (id) =>
  client.put(`/auth/admin/faculty-requests/${id}/approve`).then((r) => r.data.faculty);

export const rejectFacultyRequest = (id, reason) =>
  client.put(`/auth/admin/faculty-requests/${id}/reject`, { reason }).then((r) => r.data.faculty);
