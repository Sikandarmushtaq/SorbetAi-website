
import {
  Bot,
  CalendarCheck2,
  CheckCheck,
  CircleCheck,
  Search,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookMessenger,
  FaWhatsapp,
} from "react-icons/fa";

const chatList = [
  {
    name: "Sophia Lee",
    initials: "SL",
    message: "Can I book for tomorrow?",
    time: "2m",
    icon: FaInstagram,
    color: "instagram",
    active: true,
  },
  {
    name: "Daniel Kim",
    initials: "DK",
    message: "What are your prices?",
    time: "8m",
    icon: FaFacebookMessenger,
    color: "messenger",
  },
  {
    name: "Amira Khan",
    initials: "AK",
    message: "Thanks for the update!",
    time: "18m",
    icon: FaWhatsapp,
    color: "whatsapp",
  },
  {
    name: "Olivia Smith",
    initials: "OS",
    message: "Are you open today?",
    time: "1h",
    color: "website",
  },
];

export default function SocialInboxPreview() {
  return (
    <div
      className="im-inbox"
      aria-label="Illustrative unified customer inbox"
    >
      <div className="im-inbox-topbar">
        <div className="im-inbox-top-left">
          <span className="im-inbox-brand-icon">
            <Bot size={18} />
          </span>

          <div>
            <strong>Inbox</strong>
            <small>All your conversations</small>
          </div>
        </div>

        <span className="im-preview-status">
          <span />
          AI active
        </span>
      </div>

      <div className="im-inbox-body">
        <aside className="im-inbox-sidebar">
          <div className="im-inbox-search">
            <Search size={13} />
            Search chats
          </div>

          <div className="im-inbox-filters">
            <span className="selected">All</span>
            <span>Unread</span>
            <span>AI</span>
          </div>

          <div className="im-inbox-chatlist">
            {chatList.map((chat) => {
              const Icon = chat.icon;

              return (
                <div
                  key={chat.name}
                  className={`im-inbox-list-item ${
                    chat.active ? "is-active" : ""
                  }`}
                >
                  <span className="im-chat-avatar">
                    {chat.initials}
                  </span>

                  <div className="im-list-item-text">
                    <div className="im-list-item-top">
                      <strong>{chat.name}</strong>
                      <small>{chat.time}</small>
                    </div>

                    <p>{chat.message}</p>

                    <span
                      className={`im-channel-mini im-channel-${chat.color}`}
                    >
                      {Icon ? (
                        <Icon size={10} />
                      ) : (
                        <span className="im-web-dot" />
                      )}

                      {chat.color === "website"
                        ? "Website"
                        : chat.color === "instagram"
                        ? "Instagram"
                        : chat.color === "messenger"
                        ? "Messenger"
                        : "WhatsApp"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="im-inbox-conversation">
          <div className="im-conversation-header">
            <span className="im-chat-avatar">SL</span>

            <div>
              <strong>Sophia Lee</strong>

              <span>
                <FaInstagram size={12} />
                Instagram
              </span>
            </div>

            <span className="im-conversation-ai">
              <Bot size={13} />
              AI On
            </span>
          </div>

          <div className="im-conversation-messages">
            <div className="im-message-day">
              Today
            </div>

            <div className="im-message im-message-in">
              Hey! Can I book an appointment
              for tomorrow?
              <small>10:40</small>
            </div>

            <div className="im-message im-message-out">
              <span className="im-ai-label">
                <Bot size={12} />
                AI reply
              </span>

              Of course! We have 3:00 PM and
              5:30 PM available tomorrow.
              Which works better?

              <small>
                10:40
                <CheckCheck size={12} />
              </small>
            </div>

            <div className="im-message im-message-in">
              3:00 PM please.
              <small>10:41</small>
            </div>

            <div className="im-confirmation">
              <span className="im-confirmation-icon">
                <CalendarCheck2 size={19} />
              </span>

              <div>
                <strong>Booking confirmed</strong>
                <small>Tomorrow · 3:00 PM</small>
              </div>

              <CircleCheck
                size={17}
                className="im-confirmation-check"
              />
            </div>
          </div>

          <div className="im-message-composer">
            <span>Type a message...</span>
            <span className="im-send-dot" />
          </div>
        </div>
      </div>

      <div className="im-inbox-footer">
        <span>
          <span className="im-live-dot" />
          AI is handling this conversation
        </span>

        <span>Human takeover available</span>
      </div>
    </div>
  );
}
