import { apiRequest } from '../apiClient';

// Phase 2+ /overview is distinct from the Phase 1 /knowledge/overview.
const BASE = '/api/v1/workspaces/current/ai-brain';

export const brainOverviewApi = {
  isConfigured: () => true,
  request: () => apiRequest(`${BASE}/overview`),
};

export const brainConfigApi = {
  isConfigured: () => true,
  get: () => apiRequest(`${BASE}/ai-config`),
  update: (changes, expectedVersion) => apiRequest(`${BASE}/ai-config`, {
    method: 'PATCH',
    body: { expected_version: expectedVersion, ...changes },
  }),
};
