import axios from 'axios';

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');
const API_VERSION = '/api/v1';

// ngrok free endpoints may return a browser warning instead of JSON.
// This header is added only for ngrok hosts, not for other production origins.
const IS_NGROK_BACKEND = (() => {
  try {
    const host = new URL(API_ORIGIN).hostname.toLowerCase();
    return ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'].some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
})();
const ACCESS_TOKEN_KEYS = ['bellbee_access_token', 'access_token', 'accessToken'];
const REFRESH_TOKEN_KEYS = ['bellbee_refresh_token', 'refresh_token', 'refreshToken'];

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
};

export class DashboardApiError extends Error {
  constructor(message, code = 'DASHBOARD_API_ERROR', status = 0, endpoint = '', errors = null) {
    super(message);
    this.name = 'DashboardApiError';
    this.code = code;
    this.status = status;
    this.endpoint = endpoint;
    this.errors = errors;
  }
}

// One Axios transport for auth, dashboard resources and uploads. We manage 401
// refresh here rather than in a response interceptor to preserve token locking.
const http = axios.create({ baseURL: API_ORIGIN, validateStatus: () => true });
let refreshPromise = null;

function getStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

export function getStoredToken(type = 'access') {
  const storage = getStorage();
  if (!storage) return '';
  const keys = type === 'refresh' ? REFRESH_TOKEN_KEYS : ACCESS_TOKEN_KEYS;
  for (const key of keys) {
    const value = storage.getItem(key);
    if (value) return value;
  }
  return '';
}

export function storeSessionTokens(tokens, { rotated = false } = {}) {
  const storage = getStorage();
  if (!storage) throw new DashboardApiError('Browser storage is unavailable.', 'STORAGE_UNAVAILABLE');
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new DashboardApiError('The authentication response did not include both tokens.', 'TOKENS_MISSING');
  }

  storage.setItem('bellbee_access_token', tokens.access_token);
  storage.setItem('bellbee_refresh_token', tokens.refresh_token);
  [...ACCESS_TOKEN_KEYS.slice(1), ...REFRESH_TOKEN_KEYS.slice(1)].forEach((key) => storage.removeItem(key));
  window.dispatchEvent(new CustomEvent('bellbee:session-updated', { detail: { rotated } }));
}

export function clearStoredSession() {
  const storage = getStorage();
  if (!storage) return;
  [...ACCESS_TOKEN_KEYS, ...REFRESH_TOKEN_KEYS].forEach((key) => storage.removeItem(key));
  storage.removeItem('bellbee_user');
  storage.removeItem('bellbee_google_profile');
  storage.removeItem('bellbee_pending_verification_email');
  window.dispatchEvent(new Event('bellbee:session-updated'));
}

export function isSessionStorageKey(key) {
  return key === null || ACCESS_TOKEN_KEYS.includes(key) || REFRESH_TOKEN_KEYS.includes(key);
}

export function readJwtPayload(token) {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

export function accessTokenExpiry(token) {
  const expiry = readJwtPayload(token)?.exp;
  return Number.isFinite(expiry) ? expiry * 1000 : null;
}

export function hasAccessToken() {
  return Boolean(getStoredToken('access'));
}

function isPublicAuthEndpoint(path) {
  return /\/api\/v1\/auth\/(signup|login|google|verify-email|resend-verification|refresh|logout|password\/forgot|password\/reset)$/.test(path);
}

function readResponse(response) {
  const value = response.data;
  if (value === undefined || value === null || value === '') return {};
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); }
  catch { return { message: value }; }
}

// Privacy: legacy API console logging is intentionally disabled.
// Do not print request URLs, backend messages, or error objects to the browser console.
/*
function logResponse({ endpoint, method, response, payload }) {
  const details = {
    method,
    endpoint,
    status: response.status,
    success: response.status >= 200 && response.status < 300 && payload?.success !== false,
    code: payload?.code || 'UNKNOWN',
    message: payload?.message || '',
  };
  if (details.success) console.info('[Bellbee API]', details);
  else console.error('[Bellbee API]', details);
}

function logNetworkError(endpoint, method, error) {
  console.error('[Bellbee API]', {
    method,
    endpoint,
    status: 0,
    success: false,
    code: 'NETWORK_ERROR',
    message: error?.message || 'Network request failed.',
  });
}
*/

function unwrapResponse(payload, status, endpoint) {
  if (payload && typeof payload === 'object' && payload.success === false) {
    throw new DashboardApiError(
      payload.message || 'The request could not be completed.',
      payload.code || 'REQUEST_FAILED',
      status,
      endpoint,
      payload?.errors,
    );
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

async function refreshSessionToken(rejectedAccessToken = '') {
  const currentAccessToken = getStoredToken('access');
  if (currentAccessToken && rejectedAccessToken && currentAccessToken !== rejectedAccessToken) {
    return currentAccessToken;
  }
  if (refreshPromise) return refreshPromise;

  const refreshToken = getStoredToken('refresh');
  if (!refreshToken) return '';

  const rotate = async () => {
    // Another tab may have rotated or cleared the session while we waited.
    if (getStoredToken('refresh') !== refreshToken) return getStoredToken('access');

    const endpoint = `${API_VERSION}/auth/refresh`;
    const data = await performRequest(endpoint, {
      method: 'POST',
      body: { refresh_token: refreshToken },
    }, '', false).catch((error) => {
      if (error.status !== 401) throw error;
      if (getStoredToken('refresh') === refreshToken) clearStoredSession();
      return null;
    });

    if (!data || getStoredToken('refresh') !== refreshToken) return getStoredToken('access');
    storeSessionTokens(data, { rotated: true });
    return data.access_token;
  };

  // The backend treats reuse of a rotated token as session revocation.
  const locks = typeof navigator !== 'undefined' ? navigator.locks : null;
  refreshPromise = (locks ? locks.request('bellbee:refresh-session', rotate) : rotate())
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function performRequest(path, options, tokenOverride, hasRetried) {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  const usesCustomAuthorization = headers.has('Authorization');
  headers.set('Accept', 'application/json');
  if (IS_NGROK_BACKEND) headers.set('ngrok-skip-browser-warning', 'true');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) headers.set('Content-Type', 'application/json');

  const token = tokenOverride || getStoredToken('access');
  if (token && !headers.has('Authorization') && !isPublicAuthEndpoint(endpoint)) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response;
  let payload;
  try {
    // Axios serializes object bodies as JSON; FormData retains its browser
    // generated multipart boundary. Axios errors become DashboardApiError.
    response = await http.request({
      ...options,
      url: endpoint,
      method,
      headers: Object.fromEntries(headers.entries()),
      data: options.body,
      // Preserve the existing fetch-style envelope parsing contract.
      transformResponse: [(data) => data],
    });
    payload = readResponse(response);
    // logResponse({ endpoint, method, response, payload }); // disabled for privacy
  } catch (error) {
    // logNetworkError(endpoint, method, error); // disabled for privacy
    throw new DashboardApiError(
      error?.message || 'Unable to connect to the backend.',
      'NETWORK_ERROR',
      0,
      endpoint,
    );
  }

  if (response.status === 401 && !isPublicAuthEndpoint(endpoint) && !usesCustomAuthorization) {
    const newAccessToken = hasRetried ? '' : await refreshSessionToken(token);
    if (newAccessToken) return performRequest(path, options, newAccessToken, true);
    if (token && getStoredToken('access') === token) clearStoredSession();
  }

  if (response.status < 200 || response.status >= 300) {
    throw new DashboardApiError(
      payload?.message || `Request failed (${response.status}).`,
      payload?.code || 'HTTP_ERROR',
      response.status,
      endpoint,
      payload?.errors,
    );
  }

  return unwrapResponse(payload, response.status, endpoint);
}

export async function apiRequest(path, options = {}) {
  if (!path) {
    throw new DashboardApiError('An API endpoint is required.', 'ENDPOINT_REQUIRED');
  }
  return performRequest(path, options, '', false);
}

/**
 * Browser SSE-over-POST using the same Axios instance and JWT refresh as
 * apiRequest(). EventSource cannot send the Bearer token or JSON POST body.
 * The only published assistant text is the validated terminal "reply" event.
 * Progress is metadata (e.g. "checking_hours"), never partial AI content.
 */
export async function apiStreamRequest(path, { body, onProgress, signal } = {}) {
  if (!path) throw new DashboardApiError('An API endpoint is required.', 'ENDPOINT_REQUIRED');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const payload = JSON.stringify(body || {});

  const requestOnce = async (token, retried = false) => {
    let offset = 0;
    let buffer = '';
    let terminal = null;

    const processEvent = (raw) => {
      let eventName = 'message';
      const dataLines = [];
      for (const line of raw.split(/\r?\n/)) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      }
      if (!dataLines.length) return;
      let value;
      try { value = JSON.parse(dataLines.join('\n')); }
      catch { return; }
      if (eventName === 'reply' || eventName === 'error') {
        terminal = { event: eventName, data: value };
      } else if (!terminal && typeof onProgress === 'function') {
        onProgress(eventName, value);
      }
    };

    const ingest = (additional) => {
      if (!additional || terminal) return;
      buffer += additional;
      let match;
      while ((match = /\r?\n\r?\n/.exec(buffer)) !== null) {
        const raw = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        processEvent(raw);
        if (terminal) break;
      }
    };

    // onDownloadProgress receives the complete responseText-so-far, not a
    // single delta. Never parse previously seen data a second time.
    const onDownloadProgress = ({ event }) => {
      const target = event?.currentTarget || event?.target;
      let snapshot;
      try { snapshot = target?.responseText; } catch { return; }
      if (typeof snapshot !== 'string' || snapshot.length <= offset) return;
      const delta = snapshot.slice(offset);
      offset = snapshot.length;
      ingest(delta);
    };

    let response;
    try {
      response = await http.request({
        url: endpoint,
        method: 'POST',
        data: payload,
        responseType: 'text',
        transformResponse: [(value) => value],
        headers: {
          Accept: 'text/event-stream, application/json',
          'Content-Type': 'application/json',
          ...(IS_NGROK_BACKEND ? { 'ngrok-skip-browser-warning': 'true' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 120000,
        signal,
        onDownloadProgress,
      });
    } catch (failure) {
      if (signal?.aborted) throw failure;
      throw new DashboardApiError(
        failure?.message || 'Streaming connection failed.',
        'STREAM_INTERRUPTED', 0, endpoint,
      );
    }

    // Axios may deliver the last chunk only at request completion.
    const raw = typeof response.data === 'string' ? response.data : '';
    if (raw.length > offset) ingest(raw.slice(offset));
    if (!terminal && buffer.trim()) processEvent(buffer.trim());

    if (response.status === 401 && !retried) {
      const refreshed = await refreshSessionToken(token);
      if (refreshed) return requestOnce(refreshed, true);
      if (token && getStoredToken('access') === token) clearStoredSession();
    }

    let json = {};
    const contentType = String(response.headers?.['content-type'] || '');
    if (contentType.includes('json') || (raw.trim().startsWith('{') && !terminal)) {
      try { json = JSON.parse(raw); } catch { json = {}; }
    }

    if (response.status < 200 || response.status >= 300) {
      throw new DashboardApiError(
        json?.message || `Streaming request failed (${response.status}).`,
        json?.code || 'HTTP_ERROR', response.status, endpoint, json?.errors,
      );
    }

    // The backend explicitly specifies a 202 JSON processing response. The
    // caller must retry with exactly the same client_message_id and text.
    if (response.status === 202) return null;

    if (terminal?.event === 'error') {
      throw new DashboardApiError(
        terminal.data?.message || 'The AI could not finish its response.',
        terminal.data?.code || 'STREAM_ERROR',
        terminal.data?.http_status || 0, endpoint,
      );
    }
    if (terminal?.event === 'reply') return terminal.data;

    // Older backend deployments may return normal JSON for this endpoint.
    if (json && (json.data?.reply || json.reply)) {
      return unwrapResponse(json, response.status, endpoint);
    }
    throw new DashboardApiError(
      'The stream ended before a confirmed reply. Retry the same message safely.',
      'STREAM_INTERRUPTED', response.status, endpoint,
    );
  };

  let token = getStoredToken('access');
  const expiry = accessTokenExpiry(token);
  if ((!token || (expiry !== null && expiry <= Date.now())) && getStoredToken('refresh')) {
    token = await refreshSessionToken(token) || token;
  }
  return requestOnce(token);
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
      `The ${resource} API endpoint is not configured. Add its exact backend path to the environment file.`,
      'ENDPOINT_NOT_CONFIGURED',
    );
  }

  const { method = 'GET', id, action, query, body, headers } = options;
  const suffix = [id, action].filter((part) => part !== undefined && part !== null && part !== '')
    .map((part) => encodeURIComponent(String(part)))
    .join('/');
  const url = new URL(
    `${basePath.replace(/\/$/, '')}${suffix ? `/${suffix}` : ''}`,
    `${API_ORIGIN}/`,
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return apiRequest(`${url.pathname}${url.search}`, { method, body, headers });
}

export function createResourceApi(resource) {
  return {
    resource,
    isConfigured: () => isResourceConfigured(resource),
    request: (options = {}) => resourceRequest(resource, options),
  };
}

export async function refreshAccessToken() {
  return refreshSessionToken();
}

export async function getCurrentUser() {
  if (!hasAccessToken() && !getStoredToken('refresh')) return null;
  const accessToken = getStoredToken('access');
  const expiry = accessTokenExpiry(accessToken);
  if (!accessToken || (expiry !== null && expiry <= Date.now())) {
    const refreshed = await refreshSessionToken(accessToken);
    if (!refreshed) {
      if (accessToken && getStoredToken('access') === accessToken) clearStoredSession();
      return null;
    }
  }
  const response = await apiRequest(`${API_VERSION}/auth/me`);
  const user = response?.user ?? response;
  if (!user?.id) {
    throw new DashboardApiError('The backend did not return a valid user profile.', 'USER_MISSING');
  }
  return user;
}

export async function getCurrentWorkspace() {
  return apiRequest(`${API_VERSION}/workspaces/current`);
}
// new connnected api       
export async function logoutSession() {
  const refreshToken = getStoredToken('refresh');
  clearStoredSession();
  if (refreshToken) {
    await apiRequest(`${API_VERSION}/auth/logout`, {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}