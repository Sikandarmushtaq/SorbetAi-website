
import { apiRequest } from '../apiClient';

const LOCATIONS_PATH =
  '/api/v1/workspaces/current/ai-brain/locations';

export const locationsApi = {
  isConfigured: () => true,

  request: ({
    method = 'GET',
    id,
    body,
    headers,
  } = {}) => {
    const path = id
      ? `${LOCATIONS_PATH}/${encodeURIComponent(String(id))}`
      : LOCATIONS_PATH;

    return apiRequest(path, {
      method,
      body,
      headers,
    });
  },
};
