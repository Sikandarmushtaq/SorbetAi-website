import { apiRequest } from '../apiClient';

// Konvo AI Brain Phase 1: exact endpoints from the API specification.
// Return values are already unwrapped by the existing Axios apiRequest.
const BASE = '/api/v1/workspaces/current/ai-brain/knowledge';
const SECTIONS = {
  FAQs: 'faqs',
  Promotions: 'promotions',
  Documents: 'documents',
  Website: 'website',
  'Chat Training': 'chat-training',
};

const withId = (path, id) => `${path}/${encodeURIComponent(String(id))}`;
const call = (path, method = 'GET', body) => apiRequest(`${BASE}/${path}`, { method, body });

export const knowledgeApi = {
  isConfigured: () => true,
  overview: () => call('overview'),
  applicability: (section, isApplicable) => call('applicability', 'PATCH', {
    section: section === 'Chat Training' ? 'chat_training' : SECTIONS[section] || section,
    is_applicable: isApplicable,
  }),
  list: (section) => call(SECTIONS[section] || section),
  create: (section, body) => call(SECTIONS[section] || section, 'POST', body),
  update: (section, id, body) => call(withId(SECTIONS[section] || section, id), 'PATCH', body),
  remove: (section, id) => call(withId(SECTIONS[section] || section, id), 'DELETE'),
  uploadDocument: (formData) => call('documents', 'POST', formData),
  downloadDocument: (id) => call(`${withId('documents', id)}/download-url`, 'POST'),
  website: () => call('website'),
  saveWebsite: (url) => call('website/crawl', 'POST', { url }),
  removeWebsite: () => call('website', 'DELETE'),
};
