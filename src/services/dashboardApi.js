const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const TOKEN_KEYS = {
  access: ['bellbee_access_token', 'access_token', 'accessToken'],
  refresh: ['bellbee_refresh_token', 'refresh_token', 'refreshToken'],
};

const RESOURCE_PATHS = {
  customers: process.env.REACT_APP_API_CUSTOMERS_PATH,
  chats: process.env.REACT_APP_API_CHATS_PATH,
  leads: process.env.REACT_APP_API_LEADS_PATH,
  requestTypes: process.env.REACT_APP_API_REQUEST_TYPES_PATH,
  templates: process.env.REACT_APP_API_TEMPLATES_PATH,
  campaigns: process.env.REACT_APP_API_CAMPAIGNS_PATH,
  suggestions: process.env.REACT_APP_API_SUGGESTIONS_PATH,
  notifications: process.env.REACT_APP_API_NOTIFICATIONS_PATH,
  automationSettings: process.env.REACT_APP_API_AUTOMATION_SETTINGS_PATH,
  channels: process.env.REACT_APP_API_CHANNELS_PATH,
  freePlanStatus: process.env.REACT_APP_API_FREE_PLAN_STATUS_PATH,
  freePlanActivate: process.env.REACT_APP_API_FREE_PLAN_ACTIVATE_PATH,
  testAi: process.env.REACT_APP_API_TEST_AI_PATH,
  profile: process.env.REACT_APP_API_PROFILE_PATH,
  businessAddress: process.env.REACT_APP_API_BUSINESS_ADDRESS_PATH,
  orders: process.env.REACT_APP_API_ORDERS_PATH,
  appointments: process.env.REACT_APP_API_APPOINTMENTS_PATH,
  products: process.env.REACT_APP_API_PRODUCTS_PATH,
  services: process.env.REACT_APP_API_SERVICES_PATH,
  supportTickets: process.env.REACT_APP_API_SUPPORT_TICKETS_PATH,
  dashboardOverview: process.env.REACT_APP_API_DASHBOARD_OVERVIEW_PATH,
  onboarding: process.env.REACT_APP_API_ONBOARDING_PATH,
  referrals: process.env.REACT_APP_API_REFERRALS_PATH,
  billing: process.env.REACT_APP_API_BILLING_PATH,
  brainOverview: process.env.REACT_APP_API_BRAIN_OVERVIEW_PATH,
  brainSetup: process.env.REACT_APP_API_BRAIN_SETUP_PATH,
  businessHours: process.env.REACT_APP_API_BUSINESS_HOURS_PATH,
  bookingRules: process.env.REACT_APP_API_BOOKING_RULES_PATH,
  closedDates: process.env.REACT_APP_API_CLOSED_DATES_PATH,
  staff: process.env.REACT_APP_API_STAFF_PATH,
  locations: process.env.REACT_APP_API_LOCATIONS_PATH,
  knowledge: process.env.REACT_APP_API_KNOWLEDGE_PATH,
  brainAssistant: process.env.REACT_APP_API_BRAIN_ASSISTANT_PATH,
  analytics: process.env.REACT_APP_API_ANALYTICS_PATH,
  billingReports: process.env.REACT_APP_API_BILLING_REPORTS_PATH,
  plans: process.env.REACT_APP_API_PLANS_PATH,
  paymentCollection: process.env.REACT_APP_API_PAYMENT_COLLECTION_PATH,
  whatsappConnection: process.env.REACT_APP_API_WHATSAPP_CONNECTION_PATH,
  websiteChat: process.env.REACT_APP_API_WEBSITE_CHAT_PATH,
  socialConnections: process.env.REACT_APP_API_SOCIAL_CONNECTIONS_PATH,
  businessProfile: process.env.REACT_APP_API_BUSINESS_PROFILE_PATH,
  profileNotifications: process.env.REACT_APP_API_PROFILE_NOTIFICATIONS_PATH,
  devices: process.env.REACT_APP_API_DEVICES_PATH,
  deleteAccount: process.env.REACT_APP_API_DELETE_ACCOUNT_PATH,
};

export class DashboardApiError extends Error {
  constructor(message, code = 'DASHBOARD_API_ERROR', status = 0) {
    super(message);
    this.name = 'DashboardApiError';
    this.code = code;
    this.status = status;
  }
}

export function getStoredToken(type = 'access') {
  const keys = TOKEN_KEYS[type] || [];
  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return '';
}

export function clearStoredSession() {
  [...TOKEN_KEYS.access, ...TOKEN_KEYS.refresh].forEach((key) => window.localStorage.removeItem(key));
}

export function hasAccessToken() {
  return Boolean(getStoredToken('access'));
}

function unwrapResponse(payload) {
  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
    throw new DashboardApiError(payload.message || 'The request could not be completed.', payload.code || 'REQUEST_FAILED');
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export async function apiRequest(path, options = {}) {
  if (!path) throw new DashboardApiError('This API endpoint has not been configured yet.', 'ENDPOINT_NOT_CONFIGURED');

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const token = getStoredToken('access');
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
    body: options.body !== undefined && !(options.body instanceof FormData) && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
  });

  const rawText = await response.text();
  let payload = null;
  if (rawText) {
    try { payload = JSON.parse(rawText); } catch { payload = { message: rawText }; }
  }

  if (!response.ok) {
    throw new DashboardApiError(
      payload?.message || `Request failed (${response.status}).`,
      payload?.code || 'HTTP_ERROR',
      response.status,
    );
  }

  return unwrapResponse(payload);
}

export function getResourcePath(resource) {
  return RESOURCE_PATHS[resource] || '';
}

export function isResourceConfigured(resource) {
  return Boolean(getResourcePath(resource));
}

export async function resourceRequest(resource, options = {}) {
  const basePath = getResourcePath(resource);
  if (!basePath) {
    throw new DashboardApiError(
      `The ${resource} API is not configured yet. Add its endpoint in your environment settings before using this action.`,
      'ENDPOINT_NOT_CONFIGURED',
    );
  }

  const { method = 'GET', id, action, query, body, headers } = options;
  const suffix = [id, action].filter(Boolean).map((part) => encodeURIComponent(String(part))).join('/');
  const url = new URL(`${basePath.replace(/\/$/, '')}${suffix ? `/${suffix}` : ''}`, `${API_BASE_URL}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
  }

  return apiRequest(`${url.pathname}${url.search}`, { method, body, headers });
}

export async function getCurrentUser() {
  if (!hasAccessToken()) return null;
  const response = await apiRequest('/api/v1/auth/me');
  return response?.user || response;
}

export async function getCurrentWorkspace() {
  return apiRequest('/api/v1/workspaces/current');
}

export async function logoutSession() {
  const refreshToken = getStoredToken('refresh');
  try {
    if (refreshToken) {
      await apiRequest('/api/v1/auth/logout', { method: 'POST', body: { refresh_token: refreshToken } });
    }
  } finally {
    clearStoredSession();
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
