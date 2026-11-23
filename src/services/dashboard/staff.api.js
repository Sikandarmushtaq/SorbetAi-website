
import { apiRequest } from '../apiClient';

const STAFF_PATH =
  '/api/v1/workspaces/current/ai-brain/staff';

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
