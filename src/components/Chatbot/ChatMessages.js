
import { CheckCheck } from 'lucide-react';

export default function ChatMessages({
  messages = [],
  customer,
  messagesEndRef,
  isSending,
}) {
  return (
    <div className="chatbot-messages">
      {messages.map((message) => {
        const isUser = message.sender === 'user';

        return (
          <div
            key={message.id}
            className={`chatbot-message-row ${
              isUser ? 'user-row' : 'assistant-row'
            }`}
          >
            <div
              className={`chatbot-message ${
                isUser ? 'user-message' : 'assistant-message'
              }`}
            >
              <span className="chatbot-message-sender">
                {isUser ? customer?.name || 'You' : 'Bellbee Ai'}
              </span>

              {message.text && <p>{message.text}</p>}

              {message.fileName && (
                <small className="chatbot-attachment-name">
                  Attachment: {message.fileName}
                </small>
              )}

              {isUser && (
                <small className="chatbot-message-status">
                  <CheckCheck size={12} />
                  Sent
                </small>
              )}
            </div>
          </div>
        );
      })}

      {isSending && (
        <div className="chatbot-message-row assistant-row">
          <div className="chatbot-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
