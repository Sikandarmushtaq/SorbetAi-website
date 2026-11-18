
import { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';

export default function MessageInput({
  inputRef,
  isSending,
  onSendMessage,
}) {
  const fileInputRef = useRef(null);

  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    if ((!text.trim() && !attachment) || isSending) return;

    onSendMessage(text, attachment);

    setText('');
    setAttachment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachment = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      setAttachment(file);
    }
  };

  return (
    <div className="chatbot-composer">
      {attachment && (
        <div className="chatbot-selected-file">
          <span>{attachment.name}</span>

          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              fileInputRef.current.value = '';
            }}
          >
            ×
          </button>
        </div>
      )}

      <form
        className="chatbot-message-form"
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="chatbot-attach-button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
        >
          <Paperclip size={19} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          hidden
          onChange={handleAttachment}
        />

        <button
          type="submit"
          className="chatbot-send-button"
          disabled={(!text.trim() && !attachment) || isSending}
        >
          Send
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
