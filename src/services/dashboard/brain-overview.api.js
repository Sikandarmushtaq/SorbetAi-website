import { apiRequest } from '../apiClient';

// Phase 2+ /overview is distinct from the Phase 1 /knowledge/overview.
import { requiredApiPath } from '../apiConfig';

const OVERVIEW_PATH = requiredApiPath(process.env.REACT_APP_API_BRAIN_OVERVIEW_PATH, 'REACT_APP_API_BRAIN_OVERVIEW_PATH');
const CONFIG_PATH = requiredApiPath(process.env.REACT_APP_API_BRAIN_CONFIG_PATH, 'REACT_APP_API_BRAIN_CONFIG_PATH');

export const brainOverviewApi = {
  isConfigured: () => true,
  request: () => apiRequest(OVERVIEW_PATH),
};

export const brainConfigApi = {
  isConfigured: () => true,
  get: () => apiRequest(CONFIG_PATH),
  update: (changes, expectedVersion) => apiRequest(CONFIG_PATH, {
    method: 'PATCH',
    body: { expected_version: expectedVersion, ...changes },
  }),
};
