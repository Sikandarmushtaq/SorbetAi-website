
import { useState } from "react";

import {
  ArrowRight,
  CheckCheck,
  // ChevronLeft,
  Clock3,
  MessageCircle,
  MessageSquareText,
  Send,
  Sparkles,
  Star,
  X,
} from "lucide-react";

const quickReplies = [
  "Opening hours",
  "Your services",
  "Prices",
  "Talk to a person",
  "Contact details",
];

const colours = [
  "#10372a",
  "#ff7a59",
  "#7655bc",
  "#268a69",
];

const initialMessages = [
  {
    id: 1,
    role: "visitor",
    text: "Hi! Are you open on Saturday?",
  },
  {
    id: 2,
    role: "assistant",
    text: "Yes! We're open on Saturday from 10 AM to 5 PM. How can I help?",
  },
];

function sampleReply(question) {
  const value = question.toLowerCase();

  if (/hour|open|saturday|time/.test(value)) {
    return "Our sample opening hours are Monday to Saturday, 10 AM to 5 PM.";
  }

  if (/service/.test(value)) {
    return "We offer a range of services. Which one would you like to know more about?";
  }

  if (/price|cost/.test(value)) {
    return "Prices depend on the service. Tell me what you're looking for and I can help.";
  }

  if (/human|person|team/.test(value)) {
    return "Of course! I'll let the team know you'd like to speak with someone.";
  }

  if (/contact|phone|email/.test(value)) {
    return "You can leave your contact details and the team can follow up with you.";
  }

  return "Thanks for your message! This is a sample website chat conversation.";
}

export default function WebsiteChatPreview() {
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [view, setView] = useState("chat");
  const [accent, setAccent] = useState("#10372a");
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [visitor, setVisitor] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const visitorCount = messages.filter(
    (message) => message.role === "visitor"
  ).length;

  function sendSampleMessage(text) {
    const question = text.trim();
    if (!question) return;

    const id = Date.now();

    setMessages((previous) => [
      ...previous,
      {
        id,
        role: "visitor",
        text: question,
      },
      {
        id: id + 1,
        role: "assistant",
        text: sampleReply(question),
      },
    ]);

    setDraft("");
  }

  function submitMessage(event) {
    event.preventDefault();
    sendSampleMessage(draft);
  }

  function submitVisitor(event) {
    event.preventDefault();

    if (!visitor.name.trim() || !visitor.phone.trim()) {
      return;
    }

    // Only switches the local demo screen.
    // No visitor details are transmitted.
    setView("chat");
  }

  return (
    <div
      className="wc-preview"
      style={{ "--wc-preview-accent": accent }}
    >
      <div className="wc-preview-toolbar">
        <span>
          <span className="wc-preview-toolbar-dot" />
          LIVE WIDGET PREVIEW
        </span>

        <div className="wc-preview-colours">
          {colours.map((colour) => (
            <button
              type="button"
              key={colour}
              className={`wc-colour-swatch ${
                accent === colour ? "is-selected" : ""
              }`}
              style={{ background: colour }}
              aria-label={`Preview colour ${colour}`}
              aria-pressed={accent === colour}
              onClick={() => setAccent(colour)}
            />
          ))}
        </div>
      </div>

      <div className="wc-demo-site">
        {/* Mock website behind the widget */}

        <div className="wc-demo-site-header">
          <span className="wc-demo-site-mark" />
          <span className="wc-demo-site-name">
            YOUR WEBSITE
          </span>

          <div className="wc-demo-site-nav">
            <span>Home</span>
            <span>Services</span>
            <span>Contact</span>
          </div>
        </div>

        <div className="wc-demo-site-body">
          <span className="wc-demo-small-label">
            WELCOME TO OUR STUDIO
          </span>

          <h3>
            A little more
            <br />
            <em>time for you.</em>
          </h3>

          <p>
            Thoughtful services, beautiful experiences
            and helpful support.
          </p>

          <span className="wc-demo-site-button">
            Explore services
            <ArrowRight size={13} />
          </span>
        </div>

        <div
          className="wc-demo-decoration"
          aria-hidden="true"
        />

        {/* Chat widget */}
        {widgetOpen ? (
          <div className="wc-widget">
            <div className="wc-widget-header">
              <div className="wc-widget-header-left">
                <span className="wc-widget-header-icon">
                  <MessageSquareText size={20} />
                </span>

                <div>
                  <strong>Chat with us</strong>
                  <small>
                    <span className="wc-widget-online" />
                    AI assistant available
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="wc-widget-close"
                onClick={() => setWidgetOpen(false)}
                aria-label="Close preview chat"
              >
                <X size={17} />
              </button>
            </div>

            <div className="wc-widget-tabs">
              <button
                type="button"
                className={view === "chat" ? "is-active" : ""}
                onClick={() => setView("chat")}
              >
                Chat
              </button>

              <button
                type="button"
                className={view === "form" ? "is-active" : ""}
                onClick={() => setView("form")}
              >
                Lead form
              </button>
            </div>

            {view === "form" ? (
              <form
                className="wc-widget-form"
                onSubmit={submitVisitor}
              >
                <div className="wc-widget-form-intro">
                  <strong>Before we get started...</strong>
                  <p>
                    Tell us a little about yourself so
                    the team can follow up.
                  </p>
                </div>

                <label>
                  Your name *
                  <input
                    type="text"
                    value={visitor.name}
                    onChange={(e) =>
                      setVisitor((previous) => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    autoComplete="off"
                    required
                  />
                </label>

                <label>
                  Phone number *
                  <input
                    type="tel"
                    value={visitor.phone}
                    onChange={(e) =>
                      setVisitor((previous) => ({
                        ...previous,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Your phone number"
                    autoComplete="off"
                    required
                  />
                </label>

                <label>
                  Email (optional)
                  <input
                    type="email"
                    value={visitor.email}
                    onChange={(e) =>
                      setVisitor((previous) => ({
                        ...previous,
                        email: e.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    autoComplete="off"
                  />
                </label>

                <button
                  type="submit"
                  className="wc-widget-form-submit"
                >
                  Start chatting
                  <ArrowRight size={15} />
                </button>

                <p className="wc-widget-demo-note">
                  Preview only. Your details are not sent.
                </p>
              </form>
            ) : (
              <>
                <div className="wc-widget-messages">
                  <div className="wc-widget-day">Today</div>

                  <div className="wc-widget-greeting">
                    <Sparkles size={14} />
                    Hi there! How can I help you today?
                  </div>

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`wc-widget-message wc-widget-${message.role}`}
                    >
                      {message.text}

                      <small>
                        10:42
                        {message.role === "visitor" && (
                          <CheckCheck size={12} />
                        )}
                      </small>
                    </div>
                  ))}
                </div>

                <div className="wc-widget-quick-replies">
                  {quickReplies.map((reply) => (
                    <button
                      type="button"
                      key={reply}
                      onClick={() => sendSampleMessage(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <form
                  className="wc-widget-composer"
                  onSubmit={submitMessage}
                >
                  <input
                    type="text"
                    aria-label="Type a sample message"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />

                  <button
                    type="submit"
                    aria-label="Send sample message"
                    disabled={!draft.trim()}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}

            <div className="wc-widget-footnote">
              <span className="wc-widget-footnote-live" />
              Interactive demo · No messages sent
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="wc-chat-bubble"
            onClick={() => setWidgetOpen(true)}
            aria-label="Open sample website chat"
          >
            <MessageCircle size={25} />
            <span />
          </button>
        )}

        <span className="wc-widget-corner-label">
          <Clock3 size={13} />
          Visitors can ask at any hour
        </span>
      </div>

      <div className="wc-preview-bottom">
        <span>
          <Star size={14} />
          Customisable chat widget
        </span>

        <span>
          {visitorCount} sample visitor messages
        </span>
      </div>
    </div>
  );
}
