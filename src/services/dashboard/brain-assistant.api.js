import { apiRequest, apiStreamRequest } from '../apiClient';

const BASE = '/api/v1/workspaces/current/ai-brain/assistant';
const id = (value) => encodeURIComponent(String(value));

// All responses are unwrapped from {success,code,message,data} by apiRequest.
export const brainAssistantApi = {
  isConfigured: () => true,
  createSession: () => apiRequest(`${BASE}/sessions`, { method: 'POST', body: {} }),
  sessions: (query = {}) => apiRequest(`${BASE}/sessions?${new URLSearchParams({page: String(query.page || 1),page_size: String(query.page_size || 20)})}`),
  getSession: (sessionId) => apiRequest(`${BASE}/sessions/${id(sessionId)}`),
  message: (sessionId, clientMessageId, text, attachmentIds = []) => apiRequest(`${BASE}/sessions/${id(sessionId)}/messages`, {
    method: 'POST', body: { client_message_id: clientMessageId, text, attachment_ids: attachmentIds },
  }),
  streamMessage: (sessionId, clientMessageId, text, attachmentIds = [], onProgress, signal) => apiStreamRequest(`${BASE}/sessions/${id(sessionId)}/messages/stream`, {
    body: { client_message_id: clientMessageId, text, attachment_ids: attachmentIds },
    onProgress, signal,
  }),
  uploadAttachment: (sessionId, file) => {
    const data = new FormData(); data.append('file', file);
    return apiRequest(`${BASE}/sessions/${id(sessionId)}/attachments`, { method: 'POST', body: data });
  },
  attachment: (sessionId, attachmentId) => apiRequest(`${BASE}/sessions/${id(sessionId)}/attachments/${id(attachmentId)}`),
  reset: (sessionId) => apiRequest(`${BASE}/sessions/${id(sessionId)}/reset`, { method: 'POST', body: {} }),
  remove: (sessionId) => apiRequest(`${BASE}/sessions/${id(sessionId)}`, { method: 'DELETE' }),
  proposals: (query = {}) => apiRequest(`${BASE}/proposals?${new URLSearchParams({status: query.status || 'pending', ...(query.session_id ? {session_id:query.session_id} : {}), page:String(query.page || 1),page_size:String(query.page_size || 20)})}`),
  getProposal: (proposalId) => apiRequest(`${BASE}/proposals/${id(proposalId)}`),
  approve: (proposalId) => apiRequest(`${BASE}/proposals/${id(proposalId)}/approve`, { method:'POST',body:{} }),
  reject: (proposalId) => apiRequest(`${BASE}/proposals/${id(proposalId)}/reject`, { method:'POST',body:{} }),
  approveMany: (proposalIds) => apiRequest(`${BASE}/proposals/approve`, {method:'POST',body:{proposal_ids:proposalIds}}),
};