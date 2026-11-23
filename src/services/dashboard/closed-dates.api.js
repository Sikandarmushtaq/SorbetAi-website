
import { apiRequest } from '../apiClient';

const SPECIAL_HOURS_PATH =
  '/api/v1/workspaces/current/ai-brain/special-hours';

export const closedDatesApi = {
  isConfigured: () => true,

  request: ({
    method = 'GET',
    id,
    body,
    query,
    headers,
  } = {}) => {
    let path = SPECIAL_HOURS_PATH;

    // Used when deleting a special date
    if (id !== undefined && id !== null) {
      path += `/${encodeURIComponent(String(id))}`;
    }

    // Optional branch/location filter
    const params = new URLSearchParams();

    if (query?.location_id) {
      params.set('location_id', query.location_id);
    }

    const queryString = params.toString();

    if (queryString) {
      path += `?${queryString}`;
    }

    return apiRequest(path, {
      method,
      body,
      headers,
    });
  },
};
