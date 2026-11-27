import { requiredApiPath } from '../apiConfig';

import { apiRequest } from '../apiClient';

const STAFF_PATH = requiredApiPath(process.env.REACT_APP_API_STAFF_PATH, 'REACT_APP_API_STAFF_PATH');

export const staffApi = {
  isConfigured: () => true,

  request: ({
    method = 'GET',
    id,
    body,
    headers,
  } = {}) => {
    let path = STAFF_PATH;

    // PATCH and DELETE require staff ID
    if (id !== undefined && id !== null && id !== '') {
      path += `/${encodeURIComponent(String(id))}`;
    }

    return apiRequest(path, {
      method,
      body,
      headers,
    });
  },
};
