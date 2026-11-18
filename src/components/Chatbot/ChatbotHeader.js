export default function ChatbotHeader({ screen, onEndChat }) {
  return (
    <div className="chatbot-header">
      <span className="chatbot-header-title">Chat with us</span>

      {screen === 'chat' && (
        <button
          type="button"
          className="chatbot-end-button"
          onClick={onEndChat}
        >
          End Chat
        </button>
      )}
    </div>
  );
}