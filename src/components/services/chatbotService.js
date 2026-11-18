
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
async function apiRequest(endpoint, body) {
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: isFormData
      ? {}
      : {
          'Content-Type': 'application/json',
        },
    body: isFormData ? body : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed: ${response.status}`
    );
  }

  return data;
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
