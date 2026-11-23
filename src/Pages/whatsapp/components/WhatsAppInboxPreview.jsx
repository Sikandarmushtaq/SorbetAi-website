
import {
  Bot,
  CheckCheck,
  CircleCheck,
  MoreHorizontal,
  Search,
  Send,
  UserRound,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const conversations = [
  {
    initials: 'SA',
    name: 'Sarah Ahmed',
    message: 'Can I book Saturday?',
    time: '2m',
    selected: true,
    color: 'coral',
  },
  {
    initials: 'AK',
    name: 'Ali Khan',
    message: 'Thank you!',
    time: '8m',
    selected: false,
    color: 'lavender',
  },
  {
    initials: 'MJ',
    name: 'Maya James',
    message: 'What are your hours?',
    time: '1h',
    selected: false,
    color: 'yellow',
  },
];

export default function WhatsAppInboxPreview() {
  return (
    <div className="wa-inbox-shell">
      <div className="wa-inbox-topbar">
        <div className="wa-inbox-heading">
          <span className="wa-inbox-top-icon">
            <FaWhatsapp size={19} />
          </span>

          <div>
            <strong>Inbox</strong>
            <small>Customer conversations</small>
          </div>
        </div>

        <div className="wa-inbox-top-actions">
          <span className="wa-inbox-online">
            <span />
            AI active
          </span>
          <MoreHorizontal size={19} />
        </div>
      </div>

      <div className="wa-inbox-layout">
        <aside className="wa-inbox-sidebar">
          <div className="wa-inbox-search">
            <Search size={14} />
            <span>Search chats</span>
          </div>

          <div className="wa-inbox-filter-row">
            <span className="active">All</span>
            <span>Unread</span>
          </div>

          <div className="wa-inbox-conversations">
            {conversations.map((chat) => (
              <div
                className={`wa-inbox-conversation ${
                  chat.selected ? 'selected' : ''
                }`}
                key={chat.name}
              >
                <span
                  className={`wa-inbox-avatar wa-avatar-${chat.color}`}
                >
                  {chat.initials}
                </span>

                <div className="wa-inbox-conversation-text">
                  <div className="wa-inbox-conversation-title">
                    <strong>{chat.name}</strong>
                    <small>{chat.time}</small>
                  </div>

                  <p>{chat.message}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="wa-inbox-chat">
          <div className="wa-inbox-chat-header">
            <span className="wa-inbox-avatar wa-avatar-coral">
              SA
            </span>

            <div className="wa-inbox-contact">
              <strong>Sarah Ahmed</strong>
              <small>
                <FaWhatsapp />
                WhatsApp
              </small>
            </div>

            <span className="wa-inbox-ai-status">
              <Bot size={13} />
              AI On
            </span>
          </div>

          <div className="wa-inbox-chat-body">
            <div className="wa-chat-date">
              Today
            </div>

            <div className="wa-chat-message wa-chat-customer">
              Hi! Can I book an appointment this
              Saturday at 4 PM?
              <small>10:42</small>
            </div>

            <div className="wa-chat-message wa-chat-ai">
              <div className="wa-chat-ai-label">
                <Bot size={13} />
                AI reply
              </div>

              Yes! Saturday at 4 PM is available.
              Would you like me to confirm it?

              <small>
                10:42
                <CheckCheck size={13} />
              </small>
            </div>

            <div className="wa-chat-message wa-chat-customer">
              Yes, please!
              <small>10:43</small>
            </div>

            <div className="wa-chat-booking">
              <div className="wa-chat-booking-icon">
                <CircleCheck size={18} />
              </div>

              <div>
                <strong>Appointment confirmed</strong>
                <span>Saturday · 4:00 PM</span>
              </div>

              <span className="wa-chat-booking-check">
                <CheckCheck size={15} />
              </span>
            </div>
          </div>

          <div className="wa-inbox-composer">
            <UserRound size={16} />
            <span>Type a message...</span>
            <span className="wa-inbox-send">
              <Send size={14} />
            </span>
          </div>
        </div>
      </div>

      <div className="wa-inbox-footer">
        <span>
          <span className="wa-inbox-footer-dot" />
          Conversation handled by AI
        </span>

        <span>Take over anytime</span>
      </div>
    </div>
  );
}
