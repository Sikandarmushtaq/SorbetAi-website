
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';

export default function ChatWindow({
  customer,
  messages,
  messagesEndRef,
  inputRef,
  isSending,
  apiError,
  apiConnected,
  onSendMessage,
}) {
  return (
    <div className="chatbot-conversation">
      <ChatMessages
        messages={messages}
        customer={customer}
        messagesEndRef={messagesEndRef}
        isSending={isSending}
      />

      {!apiConnected && (
        <div className="chatbot-preview-notice">
          Preview mode — API connection pending.
        </div>
      )}

      {apiError && (
        <div className="chatbot-api-error" role="alert">
          {apiError}
        </div>
      )}

      <MessageInput
        inputRef={inputRef}
        isSending={isSending}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
