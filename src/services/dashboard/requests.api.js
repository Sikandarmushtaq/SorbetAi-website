import { apiRequest } from '../apiClient';

// Phase 7 / section 18F: real saved customer requests, NOT Leads and NOT Test AI.
const BASE = (process.env.REACT_APP_API_REQUESTS_PATH || '/api/v1/workspaces/current/requests').replace(/\/+$/, '');
const id = (value) => encodeURIComponent(String(value));
const withQuery = (url, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((v) => query.append(key, String(v)));
    else query.append(key, String(value));
  });
  return query.size ? `${url}?${query.toString()}` : url;
};

export const requestsApi = {
  list: (params = {}) => apiRequest(withQuery(BASE, params)),
  summary: () => apiRequest(`${BASE}/summary`),
  get: (requestId) => apiRequest(`${BASE}/${id(requestId)}`),
  update: (requestId, body) => apiRequest(`${BASE}/${id(requestId)}`, { method: 'PATCH', body }),
  transition: (requestId, body) => apiRequest(`${BASE}/${id(requestId)}/transition`, { method: 'POST', body }),
  addNote: (requestId, text) => apiRequest(`${BASE}/${id(requestId)}/notes`, { method: 'POST', body: { text } }),
  events: (requestId, params = {}) => apiRequest(withQuery(`${BASE}/${id(requestId)}/events`, params)),
};