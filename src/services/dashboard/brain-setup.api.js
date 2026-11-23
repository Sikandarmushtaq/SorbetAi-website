
import { apiRequest } from '../apiClient';

const SETUP_PATH =
  '/api/v1/workspaces/current/ai-brain/setup';

export const brainSetupApi = {
  isConfigured: () => true,

  request: ({
    method = 'GET',
    body,
    headers,
  } = {}) => {
    return apiRequest(SETUP_PATH, {
      method,
      body,
      headers,
    });
  },
};
