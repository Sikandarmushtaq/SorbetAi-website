import { apiRequest } from '../apiClient';

// Phase 7 / section 18E: workspace-scoped Request Types, NOT the Leads API.
const BASE = (process.env.REACT_APP_API_REQUEST_TYPES_PATH || '/api/v1/workspaces/current/ai-brain/request-types').replace(/\/+$/, '');
const encode = (id) => encodeURIComponent(String(id));
const queryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') query.append(key, String(value));
  });
  return query.toString();
};

export const requestTypesApi = {
  isConfigured: () => true,
  list: (includeArchived = false) => apiRequest(`${BASE}?${queryString({ include_archived: includeArchived })}`),
  get: (id) => apiRequest(`${BASE}/${encode(id)}`),
  create: (body) => apiRequest(BASE, { method: 'POST', body }),
  update: (id, body) => apiRequest(`${BASE}/${encode(id)}`, { method: 'PATCH', body }),
  remove: (id, expectedVersion) => apiRequest(`${BASE}/${encode(id)}?${queryString({ expected_version: expectedVersion })}`, { method: 'DELETE' }),
  // Backward compatibility for the existing LeadsPage .request() lookup.
  request: ({ method = 'GET', id, body, query } = {}) => {
    const endpoint = id ? `${BASE}/${encode(id)}` : BASE;
    const qs = queryString(query);
    return apiRequest(qs ? `${endpoint}?${qs}` : endpoint, { method, body });
  },
};