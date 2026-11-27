import { requiredApiPath } from '../apiConfig';

import { apiRequest } from '../apiClient';

const HOURS_PATH = requiredApiPath(process.env.REACT_APP_API_BUSINESS_HOURS_PATH, 'REACT_APP_API_BUSINESS_HOURS_PATH');

export const businessHoursApi = {
  isConfigured: () => true,

  request: ({
    method = 'GET',
    body,
    query,
    headers,
  } = {}) => {
    const params = new URLSearchParams();

    if (query?.location_id) {
      params.set('location_id', query.location_id);
    }

    const queryString = params.toString();

    const path = queryString
      ? `${HOURS_PATH}?${queryString}`
      : HOURS_PATH;

    return apiRequest(path, {
      method,
      body,
      headers,
    });
  },
};
