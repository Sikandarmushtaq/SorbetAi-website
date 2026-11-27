import { requiredApiPath } from '../apiConfig';

import { apiRequest } from '../apiClient';

const LOCATIONS_PATH = requiredApiPath(process.env.REACT_APP_API_LOCATIONS_PATH, 'REACT_APP_API_LOCATIONS_PATH');

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
