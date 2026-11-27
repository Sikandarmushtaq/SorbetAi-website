import { apiRequest, apiStreamRequest } from '../apiClient';

const BASE = '/api/v1/workspaces/current/ai-brain/test-ai';
const id = (value) => encodeURIComponent(String(value));

// JSON variants are used in UI: a checked reply is returned as reply.content.
// The streaming variants require an authenticated POST + SSE decoder, not EventSource.
export const testAiApi = {
  isConfigured: () => true,
  createSession: () => apiRequest(`${BASE}/sessions`, { method: 'POST', body: {} }),
  sessions: (query = {}) => apiRequest(`${BASE}/sessions?${new URLSearchParams({ page: String(query.page || 1), page_size: String(query.page_size || 20) })}`),
  getSession: (sessionId, query = {}) => apiRequest(`${BASE}/sessions/${id(sessionId)}?${new URLSearchParams({ page: String(query.page || 1), page_size: String(query.page_size || 50) })}`),
  message: (sessionId, clientMessageId, text) => apiRequest(`${BASE}/sessions/${id(sessionId)}/messages`, {
    method: 'POST', body: { client_message_id: clientMessageId, text },
  }),
  streamMessage: (sessionId, clientMessageId, text, onProgress, signal) => apiStreamRequest(`${BASE}/sessions/${id(sessionId)}/messages/stream`, {
    body: { client_message_id: clientMessageId, text }, onProgress, signal,
  }),
  reset: (sessionId) => apiRequest(`${BASE}/sessions/${id(sessionId)}/reset`, { method: 'POST', body: {} }),
  remove: (sessionId) => apiRequest(`${BASE}/sessions/${id(sessionId)}`, { method: 'DELETE' }),
  explain: (sessionId, messageId) => apiRequest(`${BASE}/sessions/${id(sessionId)}/messages/${id(messageId)}/explain`),
};