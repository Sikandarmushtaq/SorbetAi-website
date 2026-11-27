import { requiredApiPath } from '../apiConfig';

import { apiRequest } from '../apiClient';

const SETUP_PATH = requiredApiPath(process.env.REACT_APP_API_BRAIN_SETUP_PATH, 'REACT_APP_API_BRAIN_SETUP_PATH');

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
