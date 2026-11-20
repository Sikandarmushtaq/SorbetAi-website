import axios from 'axios';

const API_BASE_URL = (
  process.env.REACT_APP_CHATBOT_API_URL || ''
).replace(/\/$/, '');

export const isChatbotApiConfigured = Boolean(API_BASE_URL);

const API_ENDPOINTS = {
  start: '/api/chat/start',
  message: '/api/chat/message',
  end: '/api/chat/end',
};

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
