import { client } from './client';

export const listOpportunities = ({ type, includeExpired } = {}) =>
  client
    .get('/opportunities', { params: { ...(type ? { type } : {}), ...(includeExpired ? { includeExpired: 'true' } : {}) } })
    .then((r) => r.data.opportunities);

export const getOpportunity = (id) => client.get(`/opportunities/${id}`).then((r) => r.data.opportunity);

export const createOpportunity = (payload) => client.post('/opportunities', payload).then((r) => r.data.opportunity);

export const updateOpportunity = (id, payload) => client.put(`/opportunities/${id}`, payload).then((r) => r.data.opportunity);

export const deleteOpportunity = (id) => client.delete(`/opportunities/${id}`).then((r) => r.data);
