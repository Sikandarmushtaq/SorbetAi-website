import { requiredApiPath } from '../apiConfig';

import { apiRequest } from '../apiClient';

const BOOKING_RULES_PATH = requiredApiPath(process.env.REACT_APP_API_BOOKING_RULES_PATH, 'REACT_APP_API_BOOKING_RULES_PATH');

export const bookingRulesApi = {
  isConfigured: () => true,

  request: ({
    method = 'GET',
    body,
    headers,
  } = {}) => {
    return apiRequest(BOOKING_RULES_PATH, {
      method,
      body,
      headers,
    });
  },
};
