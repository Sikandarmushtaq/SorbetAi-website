
import { Link } from "react-router-dom";




import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Bot,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flag,
  Headset,
  Image,
  Link2,
  MessageCircle,
  MessagesSquare,
  MousePointerClick,
  Rocket,
  Send,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookMessenger,
} from "react-icons/fa";


// Shared section heading
function SectionHeading({
  label,
  title,
  accent,
  description,
}) {
  return (
    <div className="im-section-heading im-reveal">
      <span className="im-kicker">{label}</span>

      <h2>
        {title} <em>{accent}</em>
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

// =======================================
// WHAT IT HELPS WITH
// =======================================

const benefits = [
  {
    icon: MessageCircle,
    title: "Direct messages",
    description:
      "Your AI answers customer DMs in the same inbox as WhatsApp.",
    color: "lavender",
    number: "01",
  },
  {
    icon: AtSign,
    title: "Story replies & mentions",
    description:
      "Keep track of story replies and supported business mentions in one place.",
    color: "coral",
    number: "02",
  },
  {
    icon: MessagesSquare,
    title: "Questions in comments",
    description:
      "Reply publicly when enabled, or invite a commenter into a private conversation.",
    color: "yellow",
    number: "03",
  },
  {
    icon: ShieldAlert,
    title: "Spam and abuse",
    description:
      "Flag suspicious comments and optionally hide them when your settings allow.",
    color: "green",
    number: "04",
  },
];

export function SocialBenefits() {
  return (
    <section className="im-section im-benefits">
      <div className="im-container">
        <SectionHeading
          label="WHAT IT HELPS WITH"
          title="Every message matters."
          accent="Every channel counts."
          description="From a simple question to a booking enquiry, manage more conversations without losing the personal touch."
        />

        <div className="im-benefits-grid">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="im-benefit-card im-reveal"
                key={item.title}
              >
                <div className="im-card-top">
                  <span
                    className={`im-feature-icon im-icon-${item.color}`}
                  >
                    <Icon size={23} />
                  </span>

                  <span className="im-card-number">
                    {item.number}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =======================================
// HOW IT WORKS
// =======================================

const steps = [
  {
    number: "01",
    icon: FaInstagram,
    title: "Get Instagram ready",
    description:
      "For the Facebook Login connection flow, use an eligible Instagram Professional account linked to your Facebook Page, with message access enabled.",
    color: "lavender",
  },
  {
    number: "02",
    icon: Link2,
    title: "Continue with Facebook",
    description:
      "Sign in through Meta and approve the permissions needed to manage messages for your Page.",
    color: "yellow",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Choose your Page",
    description:
      "Finish connecting and manage supported Instagram and Messenger conversations in your shared inbox.",
    color: "coral",
  },
];

export function SocialHowItWorks() {
  return (
    <section
      className="im-section im-how"
      id="im-how-it-works"
    >
      <div className="im-container">
        <SectionHeading
          label="HOW IT WORKS"
          title="Connect once."
          accent="Start talking."
          description="A straightforward setup using Meta's official business connection flow."
        />

        <div className="im-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="im-step-card im-reveal"
                key={step.number}
              >
                <span className="im-step-number">
                  {step.number}
                </span>

                <span
                  className={`im-feature-icon im-icon-${step.color}`}
                >
                  <Icon size={24} />
                </span>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =======================================
// INSTAGRAM + MESSENGER FEATURES
// =======================================

const instagramFeatures = [
  {
    icon: MessageCircle,
    title: "Direct messages",
    description:
      "AI-assisted answers, with manual takeover whenever needed.",
  },
  {
    icon: AtSign,
    title: "Story replies and mentions",
    description:
      "Handle supported story interactions and mentions according to your reply settings.",
  },
  {
    icon: Image,
    title: "Photos and voice notes",
    description:
      "Enable photo and audio understanding from Automation Settings.",
  },
  {
    icon: MousePointerClick,
    title: "Quick replies",
    description:
      "Offer supported tappable response options to keep conversations moving.",
  },
];

const messengerFeatures = [
  {
    icon: MessagesSquare,
    title: "Messages to your Page",
    description:
      "Your AI responds to supported Messenger conversations in one shared inbox.",
  },
  {
    icon: FileText,
    title: "Files and attachments",
    description:
      "Handle supported documents and attachments according to each channel's API capabilities.",
  },
  {
    icon: AtSign,
    title: "Page post comments",
    description:
      "Review comments and enable approved public-reply automations.",
  },
  {
    icon: Send,
    title: "Long replies",
    description:
      "Split lengthy AI responses into manageable messages when needed.",
  },
];

function FeaturePanel({
  title,
  subtitle,
  icon: Icon,
  items,
  variant,
  id,
}) {
  return (
    <div
      id={id}
      className={`im-channel-panel im-panel-${variant} im-reveal`}
    >
      <div className="im-channel-panel-header">
        <span className="im-channel-logo">
          <Icon size={29} />
        </span>

        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="im-channel-feature-list">
        {items.map((item) => {
          const ItemIcon = item.icon;

          return (
            <div
              className="im-channel-feature"
              key={item.title}
            >
              <span className="im-channel-feature-icon">
                <ItemIcon size={19} />
              </span>

              <div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SocialChannelFeatures() {
  return (
    <section className="im-section im-channels">
      <div className="im-container">
        <SectionHeading
          label="CHANNEL FEATURES"
          title="Two social channels."
          accent="One AI teammate."
          description="Each platform has its own capabilities, while your team keeps conversations together."
        />

        <div className="im-channel-grid">
          <FeaturePanel
            title="On Instagram"
            subtitle="Messages, stories, media and quick replies"
            icon={FaInstagram}
            items={instagramFeatures}
            variant="instagram"
          />

          <FeaturePanel
            id="im-messenger"
            title="On Facebook Messenger"
            subtitle="Page messages, comments and attachments"
            icon={FaFacebookMessenger}
            items={messengerFeatures}
            variant="messenger"
          />
        </div>
      </div>
    </section>
  );
}

// =======================================
// COMMENTS AUTOMATION
// =======================================

const commentFeatures = [
  {
    icon: MessageCircle,
    title: "Public replies",
    description:
      "Turn on comment replies in Automation Settings to let AI answer eligible questions under your posts.",
  },
  {
    icon: Send,
    title: "One private reply",
    description:
      "Where Meta permits it, invite a commenter into a private conversation using a single private reply.",
  },
  {
    icon: SlidersHorizontal,
    title: "You control the cap",
    description:
      "Set how many automatic comment replies can be sent per post each hour.",
  },
  {
    icon: Flag,
    title: "Spam protection",
    description:
      "Flag suspicious comments. Enable automatic hiding only when the necessary permissions are available.",
  },
];

export function SocialCommentAutomation() {
  return (
    <section className="im-section im-comments">
      <div className="im-container im-comments-layout">
        <div className="im-comments-copy im-reveal">
          <span className="im-kicker">
            COMMENTS AUTOMATION
          </span>

          <h2>
            Comments, handled <em>with care.</em>
          </h2>

          <p>
            Not every comment needs the same answer.
            Control when AI responds, when it sends
            a private invitation, and when your team
            should review a conversation.
          </p>

          <div className="im-comments-demo">
            <div className="im-comment-demo-head">
              <span className="im-comment-demo-avatar">
                AL
              </span>

              <div>
                <strong>Alex Morgan</strong>
                <small>Comment on your post</small>
              </div>

              <span className="im-comment-demo-time">
                2m
              </span>
            </div>

            <div className="im-comment-demo-message">
              Do you have appointments available
              this weekend?
            </div>

            <div className="im-comment-demo-response">
              <Bot size={17} />

              <div>
                <strong>Suggested AI reply</strong>
                <p>
                  Hi! Yes, we have weekend slots.
                  Send us a message and we'll
                  help you book.
                </p>
              </div>
            </div>

            <div className="im-comment-demo-bottom">
              <span>
                <CheckCircle2 size={14} />
                Preview only
              </span>

              <span>Reply rules apply</span>
            </div>
          </div>
        </div>

        <div className="im-comments-list">
          {commentFeatures.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                className="im-comment-feature im-reveal"
                key={feature.title}
              >
                <span className="im-comment-feature-number">
                  0{index + 1}
                </span>

                <span className="im-comment-feature-icon">
                  <Icon size={21} />
                </span>

                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =======================================
// REQUIREMENTS
// =======================================

const requirements = [
  "The Facebook and Instagram add-on, if required by your Bellbee plan.",
  "A Facebook account with permission to manage your business Page.",
  "For the Facebook-linked Instagram setup: an eligible Professional account with messaging access enabled.",
  "Each connected Page and Instagram account assigned to the correct business workspace.",
];

const limitations = [
  "Automated messages must respect Meta's allowed messaging windows and platform policies.",
  "Comments should move to private chat for sensitive bookings, orders or customer details.",
  "WhatsApp campaigns are separate from Instagram and Messenger messaging.",
  "Automated hide, reply and handoff features need their respective permissions and backend configuration.",
];

export function SocialRequirements() {
  return (
    <section className="im-section im-requirements">
      <div className="im-container">
        <SectionHeading
          label="BEFORE YOU CONNECT"
          title="Everything you need."
          accent="Nothing unnecessary."
          description="Know the requirements and limits before enabling social messaging."
        />

        <div className="im-requirements-grid">
          <article className="im-requirements-card im-reveal">
            <div className="im-requirements-heading">
              <span className="im-feature-icon im-icon-green">
                <CheckCircle2 size={22} />
              </span>

              <h3>What you need</h3>
            </div>

            <ul>
              {requirements.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={17} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="im-requirements-card im-reveal">
            <div className="im-requirements-heading">
              <span className="im-feature-icon im-icon-yellow">
                <ShieldCheck size={22} />
              </span>

              <h3>What it does not do</h3>
            </div>

            <ul>
              {limitations.map((item) => (
                <li key={item}>
                  <XCircle size={17} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="im-requirements-note im-reveal">
          <UserRoundCheck size={20} />
          <span>
            When a person replies manually, your
            backend can pause AI in that conversation
            until the team enables it again.
          </span>
        </div>
      </div>
    </section>
  );
}

// =======================================
// FREQUENTLY ASKED QUESTIONS
// =======================================

const faqs = [
  {
    question: "How do I connect Instagram and Messenger?",
    answer:
      "Open Channels in your dashboard, select the Meta connection option, sign in through Facebook and authorize the Page and eligible Instagram account. Once connected, supported conversations can appear in your inbox.",
  },
  {
    question: "Do I need an Instagram Professional account?",
    answer:
      "Yes, Instagram business messaging requires an eligible Professional account. The exact Page-linking requirements depend on which supported Meta login flow is used.",
  },
  {
    question: "Can my AI reply to comments?",
    answer:
      "It can be configured for eligible public replies and private invitations when the required Meta permissions and Automation Settings are enabled.",
  },
  {
    question: "Is Facebook and Instagram part of my plan?",
    answer:
      "These integrations are described as an add-on. Check your current Billing & Subscription page for availability, price and plan limits.",
  },
  {
    question: "What if I reply from the Instagram or Messenger app myself?",
    answer:
      "The intended handoff flow pauses AI for that conversation when a manual response is detected, provided channel events and handoff synchronization are configured.",
  },
  {
    question: "Can I connect more than one Page?",
    answer:
      "The number of Pages depends on the connection limits and workspace rules supported by your plan. Check your Channels settings for available connections.",
  },
  {
    question: "What happens if the connection breaks?",
    answer:
      "Your dashboard should show the connection status and ask you to reconnect or refresh permissions. Messages cannot be sent through a disconnected integration until access is restored.",
  },
];

export function SocialFAQ() {
  return (
    <section className="im-section im-faq">
      <div className="im-container im-faq-layout">
        <div className="im-faq-intro im-reveal">
          <span className="im-kicker">
            QUESTIONS & ANSWERS
          </span>

          <h2>
            Still <em>curious?</em>
          </h2>

          <p>
            Quick answers about connecting
            Instagram, Messenger and your AI.
          </p>
        </div>

        <div className="im-faq-list">
          {faqs.map((item) => (
            <details
              className="im-faq-item im-reveal"
              key={item.question}
            >
              <summary>
                <span>{item.question}</span>
                <ChevronDown size={19} />
              </summary>

              <div className="im-faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// =======================================
// RELATED PAGES
// =======================================

const related = [
  {
    title: "One inbox",
    description:
      "Every channel in one place, and your team can step in.",
    icon: MessagesSquare,
    to: "/omnichannel-messaging",
    color: "lavender",
  },
  {
    title: "AI customer support",
    description:
      "Answers questions from your own business information.",
    icon: Headset,
    to: "/ai-customer-support",
    color: "yellow",
  },
  {
    title: "Human handoff",
    description:
      "Hands chats to your team when a person is needed.",
    icon: UserRoundCheck,
    to: "/human-handoff",
    color: "coral",
  },
];

export function SocialRelated() {
  return (
    <section className="im-section im-related">
      <div className="im-container">
        <SectionHeading
          label="RELATED FEATURES"
          title="Explore more."
          accent="Do more."
        />

        <div className="im-related-grid">
          {related.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="im-related-card im-reveal"
              >
                <span
                  className={`im-feature-icon im-icon-${item.color}`}
                >
                  <Icon size={23} />
                </span>

                <ArrowUpRight
                  size={20}
                  className="im-related-arrow"
                />

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =======================================
// FINAL CALL TO ACTION
// =======================================

export function SocialCTA() {
  return (
    <section className="im-cta-section">
      <div className="im-container">
        <div className="im-cta-card im-reveal">
          <span
            className="im-cta-blob im-cta-blob-one"
            aria-hidden="true"
          />
          <span
            className="im-cta-blob im-cta-blob-two"
            aria-hidden="true"
          />

          <div className="im-cta-inner">
            <span className="im-cta-label">
              READY TO GET STARTED?
            </span>

            <h2>
              Turn messages into{" "}
              <em>meaningful conversations.</em>
            </h2>

            <p>
              Start with free credit.
              No credit card required to get started.
            </p>

            <div className="im-cta-buttons">
              <Link
                to="/signup"
                className="im-btn im-btn-primary"
              >
                <Sparkles size={17} />
                Start using free
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="im-btn im-btn-light"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
