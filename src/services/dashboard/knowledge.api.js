import { apiRequest } from '../apiClient';

const BASE = '/api/v1/workspaces/current/ai-brain/knowledge';
const SECTIONS = {
  FAQs: 'faqs', Promotions: 'promotions', Documents: 'documents',
  Website: 'website', 'Chat Training': 'chat-training',
};
const id = (value) => encodeURIComponent(String(value));
const resource = (section) => SECTIONS[section] || section;
const path = (value) => `${BASE}/${value}`;
const call = (url, method = 'GET', body) => apiRequest(path(url), { method, body });
const query = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();

export const knowledgeApi = {
  isConfigured: () => true,
  overview: () => call('overview'),
  applicability: (section, isApplicable) => call('applicability', 'PATCH', {
    section: section === 'Chat Training' ? 'chat_training' : resource(section),
    is_applicable: isApplicable,
  }),
  list: (section) => call(resource(section)),
  create: (section, body) => call(resource(section), 'POST', body),
  update: (section, entryId, body) => call(`${resource(section)}/${id(entryId)}`, 'PATCH', body),
  remove: (section, entryId) => call(`${resource(section)}/${id(entryId)}`, 'DELETE'),
  getDocument: (documentId) => call(`documents/${id(documentId)}`),
  uploadDocument: (formData) => call('documents', 'POST', formData),
  downloadDocument: (documentId) => call(`documents/${id(documentId)}/download-url`, 'POST'),
  website: () => call('website'),
  saveWebsite: (url) => call('website/crawl', 'POST', { url }),
  removeWebsite: () => call('website', 'DELETE'),
  // New Phase 2+ knowledge explorer and review endpoints.
  items: (params = {}) => call(`items?${query({page: 1,page_size: 20,...params})}`),
  item: (itemId, params = {}) => call(`items/${id(itemId)}?${query(params)}`),
  search: (searchText, limit = 20) => call('search', 'POST', {query: searchText,limit}),
  testRetrieval: (question) => call('test-retrieval','POST',{question}),
  processing: (params = {}) => call(`processing-status?${query(params)}`),
  review: (itemId, params = {}) => call(`items/${id(itemId)}/review?${query(params)}`),
  correction: (itemId, expectedVersion, content) => call(`items/${id(itemId)}/correction`,'PUT', {expected_version:expectedVersion,content}),
  removeCorrection: (itemId, expectedVersion) => call(`items/${id(itemId)}/correction?${query({expected_version:expectedVersion})}`,'DELETE'),
  accept: (itemId, body) => call(`items/${id(itemId)}/accept`,'POST',body),
  reindex: (itemId, body) => call(`items/${id(itemId)}/reindex`,'POST',body),
  reject: (itemId, expectedVersion) => call(`items/${id(itemId)}/reject`,'POST',{expected_version:expectedVersion}),
  approve: (itemId, expectedVersion) => call(`items/${id(itemId)}/approve`,'POST',{expected_version:expectedVersion}),
};