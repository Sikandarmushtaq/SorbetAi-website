import axios from 'axios';

const API_BASE_URL = (
  process.env.REACT_APP_CHATBOT_API_URL || ''
).replace(/\/$/, '');

const API_ENDPOINTS = {
  start: process.env.REACT_APP_CHATBOT_START_PATH,
  message: process.env.REACT_APP_CHATBOT_MESSAGE_PATH,
  end: process.env.REACT_APP_CHATBOT_END_PATH,
};

export const isChatbotApiConfigured = Boolean(API_BASE_URL && Object.values(API_ENDPOINTS).every(path => typeof path === 'string' && /^\/(?!\/)/.test(path)));

// Handles all chatbot HTTP requests.
const chatbotHttp = axios.create({ baseURL: API_BASE_URL });

async function apiRequest(endpoint, body) {
  try {
    const response = await chatbotHttp.post(endpoint, body, {
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    });
    return response.data || {};
  } catch (error) {
    const payload = error?.response?.data;
    throw new Error(payload?.message || error?.message || 'Unable to contact the chatbot.');
  }
}

// API CONNECTION: Start customer conversation.
export async function startConversation(customerDetails) {
  if (!isChatbotApiConfigured) return null;

  return apiRequest(API_ENDPOINTS.start, customerDetails);
}

// API CONNECTION: Send customer message.
export async function sendMessage(conversationId, message, attachment) {
  if (!isChatbotApiConfigured) return null;

  let body;

  if (attachment) {
    body = new FormData();
    body.append('conversationId', conversationId);
    body.append('message', message);
    body.append('attachment', attachment);
  } else {
    body = {
      conversationId,
      message,
    };
  }

  return apiRequest(API_ENDPOINTS.message, body);
}

// API CONNECTION: End conversation.
export async function endConversation(conversationId) {
  if (!isChatbotApiConfigured) return null;

  return apiRequest(API_ENDPOINTS.end, {
    conversationId,
  });
}
