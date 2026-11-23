
import { Link } from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Globe2,
  Headset,
  Image as ImageIcon,
  KeyRound,
  MessageCircleMore,
  MessageSquareText,
  MousePointerClick,
  Palette,
  Power,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRoundPlus,
  UsersRound,
  XCircle,
} from "lucide-react";

function SectionHeading({ label, title, accent, description }) {
  return (
    <div className="wc-section-heading wc-reveal">
      <span className="wc-kicker">{label}</span>

      <h2>
        {title} <em>{accent}</em>
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function InfoCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="wc-info-card wc-reveal">
      <div className="wc-info-card-top">
        <span className={`wc-icon-box wc-icon-${item.color}`}>
          <Icon size={23} />
        </span>

        {item.number && (
          <span className="wc-card-number">{item.number}</span>
        )}
      </div>

      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </article>
  );
}

// =============================================
// 1. WHAT IT HELPS WITH
// =============================================

const benefits = [
  {
    number: "01",
    icon: MessageCircleMore,
    color: "lavender",
    title: "Questions from visitors",
    description:
      "Your AI answers customer questions using your own business information, even outside opening hours.",
  },
  {
    number: "02",
    icon: UserRoundPlus,
    color: "coral",
    title: "Visitors you can follow up",
    description:
      "Collect a visitor's name and phone number before the conversation, with optional email.",
  },
  {
    number: "03",
    icon: Headset,
    color: "yellow",
    title: "A person when it matters",
    description:
      "Take over any website chat from your shared inbox. Visitors can see when a person joins.",
  },
];

export function WebsiteChatBenefits() {
  return (
    <section className="wc-section wc-benefits">
      <div className="wc-container">
        <SectionHeading
          label="WHAT IT HELPS WITH"
          title="Every visitor deserves"
          accent="an answer."
          description="Make your website helpful, capture enquiries and give customers a simple way to reach your team."
        />

        <div className="wc-benefits-grid">
          {benefits.map((item) => (
            <InfoCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================
// 2. HOW IT WORKS
// =============================================

const steps = [
  {
    number: "01",
    icon: Globe2,
    title: "Add your website address",
    description:
      "List the websites where you want the chat to appear. Only approved sites can load your widget.",
  },
  {
    number: "02",
    icon: Code2,
    title: "Paste one piece of code",
    description:
      "Copy your installation snippet. Follow the instructions for WordPress, Shopify, Wix, Squarespace or a custom website.",
  },
  {
    number: "03",
    icon: Power,
    title: "Turn it on",
    description:
      "Enable website chat and visitors see a floating chat bubble at the bottom right of your website.",
  },
];

export function WebsiteChatHowItWorks() {
  return (
    <section
      className="wc-section wc-how-section"
      id="wc-how-it-works"
    >
      <div className="wc-container">
        <SectionHeading
          label="HOW IT WORKS"
          title="One simple setup."
          accent="Endless conversations."
          description="No complicated installation process. Add your site, copy the code and enable the widget."
        />

        <div className="wc-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="wc-step-card wc-reveal"
                key={step.number}
              >
                <div className="wc-step-header">
                  <span>{step.number}</span>

                  <div className="wc-step-icon">
                    <Icon size={24} />
                  </div>
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>

        <div className="wc-install-note wc-reveal">
          <Code2 size={20} />

          <span>
            One embed snippet, installed once in your
            website's shared layout.
          </span>

          <span className="wc-install-note-tag">
            No plugin required for custom sites
          </span>
        </div>
      </div>
    </section>
  );
}

// =============================================
// 3. WHAT YOUR VISITORS SEE
// =============================================

const visitorFeatures = [
  {
    icon: UserRoundPlus,
    color: "lavender",
    title: "A chat bubble and short form",
    description:
      "Visitors enter their name and phone number, with an optional email, before starting.",
  },
  {
    icon: MousePointerClick,
    color: "coral",
    title: "Greeting and quick replies",
    description:
      "Welcome visitors with your own greeting and up to five tappable quick replies.",
  },
  {
    icon: ImageIcon,
    color: "yellow",
    title: "Photos and PDFs",
    description:
      "Visitors can send JPG, PNG or WebP images and PDFs up to 5 MB per file.",
  },
  {
    icon: Clock3,
    color: "green",
    title: "Open or closed",
    description:
      "The widget can show your business availability and whether the AI can answer right away.",
  },
  {
    icon: Star,
    color: "lavender",
    title: "A rating at the end",
    description:
      "Visitors can finish a chat, leave a rating from one to five stars and add a comment.",
  },
];

export function WebsiteChatVisitorExperience() {
  return (
    <section className="wc-section wc-visitor-section">
      <div className="wc-container">
        <SectionHeading
          label="THE VISITOR EXPERIENCE"
          title="A little chat window."
          accent="A better first impression."
          description="Your visitors get a welcoming, simple experience without leaving the page they are viewing."
        />

        <div className="wc-feature-grid">
          {visitorFeatures.map((item) => (
            <InfoCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================
// 4. WHAT YOU CONTROL
// =============================================

const controls = [
  {
    icon: Globe2,
    title: "Where it appears",
    description:
      "Add up to 10 approved website addresses, including their subdomains.",
  },
  {
    icon: MessageSquareText,
    title: "Greeting and quick replies",
    description:
      "Set your greeting, reply-time message and up to five quick-reply suggestions.",
  },
  {
    icon: Palette,
    title: "Your brand colour",
    description:
      "Choose your widget colour. Text contrast adjusts for readability.",
  },
  {
    icon: SlidersHorizontal,
    title: "Live preview",
    description:
      "Review your changes before enabling the widget on your site.",
  },
  {
    icon: Power,
    title: "On and off",
    description:
      "Disable the widget when you don't want it displayed on your website.",
  },
];

export function WebsiteChatControls() {
  return (
    <section className="wc-section wc-controls-section">
      <div className="wc-container wc-controls-layout">
        <div className="wc-controls-intro wc-reveal">
          <span className="wc-kicker">YOU'RE IN CONTROL</span>

          <h2>
            Your website.
            <br />
            <em>Your rules.</em>
          </h2>

          <p>
            Make the widget feel like part of your
            website. Change its colour, greeting,
            allowed domains and availability.
          </p>

          <div className="wc-settings-showcase">
            <div className="wc-settings-top">
              <span className="wc-settings-heading">
                <Palette size={17} />
                Widget appearance
              </span>

              <span className="wc-settings-state">
                <span />
                Enabled
              </span>
            </div>

            <div className="wc-settings-row">
              <span>Widget colour</span>

              <div className="wc-settings-swatches">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>

            <div className="wc-settings-row">
              <span>Chat position</span>
              <strong>Bottom right</strong>
            </div>

            <div className="wc-settings-row">
              <span>Quick replies</span>
              <strong>5 maximum</strong>
            </div>

            <div className="wc-settings-row">
              <span>Approved websites</span>
              <strong>Up to 10</strong>
            </div>

            <span className="wc-settings-caption">
              Illustrative settings preview
            </span>
          </div>
        </div>

        <div className="wc-controls-list">
          {controls.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className="wc-control-item wc-reveal"
                key={item.title}
              >
                <span className="wc-control-number">
                  0{index + 1}
                </span>

                <span className="wc-control-icon">
                  <Icon size={21} />
                </span>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =============================================
// 5. YOUR TEAM AND RESULTS
// =============================================

const results = [
  {
    icon: UsersRound,
    color: "lavender",
    title: "Human takeover",
    description:
      "Chats appear in your shared inbox. Your team can join a conversation when needed.",
  },
  {
    icon: BarChart3,
    color: "yellow",
    title: "Website chat analytics",
    description:
      "Track conversations, visitor messages, average ratings and daily activity.",
  },
  {
    icon: KeyRound,
    color: "coral",
    title: "Rotate your widget key",
    description:
      "Generate a new installation key. Your previous embed stops working until you update its code.",
  },
];

export function WebsiteChatTeamResults() {
  return (
    <section className="wc-section wc-results-section">
      <div className="wc-container">
        <SectionHeading
          label="YOUR TEAM & RESULTS"
          title="Stay in control."
          accent="See the impact."
          description="Support website visitors from the same inbox and understand how your chat is performing."
        />

        <div className="wc-results-layout">
          <div className="wc-results-list">
            {results.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="wc-result-item wc-reveal"
                >
                  <span
                    className={`wc-icon-box wc-icon-${item.color}`}
                  >
                    <Icon size={21} />
                  </span>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="wc-analytics-card wc-reveal">
            <div className="wc-analytics-header">
              <div>
                <span>WEBSITE CHAT INSIGHTS</span>
                <h3>Conversation overview</h3>
              </div>

              <BarChart3 size={21} />
            </div>

            <div className="wc-analytics-metrics">
              <div>
                <span>Conversations</span>
                <strong>128</strong>
              </div>

              <div>
                <span>Avg. rating</span>
                <strong>
                  4.8 <Star size={16} />
                </strong>
              </div>

              <div>
                <span>Messages</span>
                <strong>642</strong>
              </div>
            </div>

            <div className="wc-chart">
              {[41, 66, 52, 83, 62, 96, 73].map(
                (height, index) => (
                  <div className="wc-chart-bar-group" key={index}>
                    <span
                      className="wc-chart-bar"
                      style={{ height: `${height}%` }}
                    />
                    <small>
                      {["M", "T", "W", "T", "F", "S", "S"][index]}
                    </small>
                  </div>
                )
              )}
            </div>

            <span className="wc-analytics-disclaimer">
              Sample analytics data for illustration only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================
// 6. REQUIREMENTS & LIMITATIONS
// =============================================

const requirements = [
  "A plan that includes website chat. You can configure the widget before subscribing.",
  "A website where you can install a JavaScript snippet.",
  "The domain names where the chat is allowed to appear.",
];

const limitations = [
  "Website chat answers questions only. Orders and bookings are directed to WhatsApp.",
  "The widget interface uses English, although the AI can respond in supported visitor languages.",
  "The widget remains at the bottom right and cannot be selectively hidden on individual pages.",
  "Visitors must provide a name and phone number before starting a real chat.",
];

export function WebsiteChatRequirements() {
  return (
    <section className="wc-section wc-requirements-section">
      <div className="wc-container">
        <SectionHeading
          label="BEFORE YOU INSTALL"
          title="Simple to set up."
          accent="Clear about limits."
        />

        <div className="wc-requirements-grid">
          <article className="wc-requirements-card wc-reveal">
            <div className="wc-requirements-heading">
              <span className="wc-icon-box wc-icon-green">
                <CheckCircle2 size={22} />
              </span>
              <h3>What you need</h3>
            </div>

            <ul>
              {requirements.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="wc-requirements-card wc-reveal">
            <div className="wc-requirements-heading">
              <span className="wc-icon-box wc-icon-yellow">
                <ShieldCheck size={22} />
              </span>
              <h3>What it does not do</h3>
            </div>

            <ul>
              {limitations.map((item) => (
                <li key={item}>
                  <XCircle size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="wc-requirements-note wc-reveal">
          <Headset size={20} />
          Your team can take over any active website
          conversation from the shared inbox.
        </div>
      </div>
    </section>
  );
}

// =============================================
// 7. QUESTIONS
// =============================================

const faqs = [
  {
    question: "How do I add the chat to my website?",
    answer:
      "Open Website Chat in your dashboard, add your allowed domain, copy the embed snippet and paste it into your website's shared layout. Enable the widget when your plan supports it.",
  },
  {
    question: "Can it take orders or bookings?",
    answer:
      "Website chat is designed for answering questions and capturing visitor details. For orders and bookings, it directs customers to your WhatsApp channel.",
  },
  {
    question: "Do visitors need to give their phone number?",
    answer:
      "Yes. Before a real conversation starts, visitors enter their name and phone number. Email is optional.",
  },
  {
    question: "Can I limit which sites show the chat?",
    answer:
      "Yes. You can configure up to 10 allowed website addresses. The widget runs only on approved domains and their supported subdomains.",
  },
  {
    question: "Can I change how it looks?",
    answer:
      "You can customise the widget's brand colour, greeting, reply-time text and up to five quick replies. The widget stays at the bottom right.",
  },
  {
    question: "Can I turn it off?",
    answer:
      "Yes. Disable website chat in your dashboard to stop the widget from appearing on your site.",
  },
  {
    question: "Can I see how it is doing?",
    answer:
      "Website chat analytics show conversation counts, incoming messages, average visitor ratings and a daily activity chart.",
  },
];

export function WebsiteChatFAQ() {
  return (
    <section className="wc-section wc-faq-section">
      <div className="wc-container wc-faq-layout">
        <div className="wc-faq-intro wc-reveal">
          <span className="wc-kicker">
            FREQUENTLY ASKED QUESTIONS
          </span>

          <h2>
            Got <em>questions?</em>
          </h2>

          <p>
            Everything you need to know before adding
            an AI chat window to your website.
          </p>
        </div>

        <div className="wc-faq-list">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="wc-faq-item wc-reveal"
            >
              <summary>
                {item.question}
                <ChevronDown size={19} />
              </summary>

              <div className="wc-faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================
// 8. RELATED PAGES
// =============================================

const relatedPages = [
  {
    title: "AI customer support",
    description:
      "Answers customer questions from your own business information.",
    icon: MessageCircleMore,
    color: "lavender",
    to: "/ai-customer-support",
  },
  {
    title: "One inbox",
    description:
      "Manage every channel in one place and let your team take over.",
    icon: UsersRound,
    color: "yellow",
    to: "/omnichannel-messaging",
  },
  {
    title: "Human handoff",
    description:
      "Bring a team member into the conversation when needed.",
    icon: Headset,
    color: "coral",
    to: "/human-handoff",
  },
];

export function WebsiteChatRelated() {
  return (
    <section className="wc-section wc-related-section">
      <div className="wc-container">
        <SectionHeading
          label="RELATED FEATURES"
          title="One chat window."
          accent="More possibilities."
        />

        <div className="wc-related-grid">
          {relatedPages.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.to}
                key={item.to}
                className="wc-related-card wc-reveal"
              >
                <span
                  className={`wc-icon-box wc-icon-${item.color}`}
                >
                  <Icon size={22} />
                </span>

                <ArrowUpRight
                  size={20}
                  className="wc-related-arrow"
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

// =============================================
// 9. FINAL CTA
// =============================================

export function WebsiteChatCTA() {
  return (
    <section className="wc-cta-section">
      <div className="wc-container">
        <div className="wc-cta-card wc-reveal">
          <span
            className="wc-cta-blob wc-cta-blob-one"
            aria-hidden="true"
          />

          <span
            className="wc-cta-blob wc-cta-blob-two"
            aria-hidden="true"
          />

          <div className="wc-cta-content">
            <span className="wc-cta-kicker">
              READY TO START?
            </span>

            <h2>
              Your website can
              <br />
              <em>start a conversation.</em>
            </h2>

            <p>
              Start with free credit.
              No credit card required to get started.
            </p>

            <div className="wc-cta-actions">
              <Link
                to="/signup"
                className="wc-btn wc-btn-coral"
              >
                <Sparkles size={17} />
                Start using free
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="wc-btn wc-btn-light"
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
