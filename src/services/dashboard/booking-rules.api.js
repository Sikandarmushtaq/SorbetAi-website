
import { apiRequest } from '../apiClient';

const BOOKING_RULES_PATH =
  '/api/v1/workspaces/current/ai-brain/booking-rules';

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
