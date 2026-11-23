
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Globe,
  Headphones,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";

import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookMessenger,
} from "react-icons/fa";

import "./OneInboxPage.css";

// ==========================================
// WHAT IT HELPS WITH
// ==========================================

const helpItems = [
  {
    icon: MessageCircle,
    title: "Messages in many places",
    description:
      "Customers write on WhatsApp, Instagram, Messenger or your website. They all arrive in one inbox.",
  },
  {
    icon: Bot,
    title: "The same answers everywhere",
    description:
      "One AI uses the same business information on every channel.",
  },
  {
    icon: Headphones,
    title: "One place to reply",
    description:
      "Reply or hand over from the Bellbee inbox, whichever channel the customer used.",
  },
];

// ==========================================
// HOW IT WORKS
// ==========================================

const howItWorks = [
  {
    step: "1",
    title: "Connect your channels",
    description:
      "WhatsApp, Facebook and Instagram, and your website chat, from Channels in the app.",
  },
  {
    step: "2",
    title: "One AI answers on all of them",
    description:
      "It uses the same business information on every channel.",
  },
  {
    step: "3",
    title: "Reply or hand over from one place",
    description:
      "See every chat in the Bellbee inbox and take over when you want to.",
  },
];

// ==========================================
// CHANNELS
// ==========================================

const connectItems = [
  {
    icon: FaWhatsapp,
    title: "WhatsApp",
    description:
      "Connected through Meta's official Cloud API.",
  },
  {
    icon: FaInstagram,
    title: "Instagram",
    description:
      "Direct messages, story replies and mentions, answered by your AI.",
  },
  {
    icon: FaFacebookMessenger,
    title: "Facebook Messenger",
    description:
      "Messenger messages and comments on your Page, answered by your AI.",
  },
  {
    icon: Globe,
    title: "Website chat",
    description:
      "A chat window for your website, run by the same AI. Visitors give their name and phone number to start.",
  },
];

// ==========================================
// TEAM FEATURES
// ==========================================

const inboxTeamItems = [
  {
    icon: MessageSquare,
    title: "Every chat in one list",
    description:
      "Filter by channel, and see the full conversation.",
  },
  {
    icon: Tags,
    title: "Customers and labels",
    description:
      "Each customer has one history, and you can label chats.",
  },
  {
    icon: Users,
    title: "Your team can step in",
    description:
      "Take over any chat, then switch the AI back on for that chat when you are done.",
  },
];

// ==========================================
// REQUIREMENTS
// ==========================================

const requirements = [
  "WhatsApp. A WhatsApp Business number. See the WhatsApp page for the steps.",
  'Instagram. A Professional account linked to your Facebook Page, with "Allow access to messages" turned on in the Instagram app.',
  "Facebook Messenger. A Facebook Page you manage.",
  "Website chat. Copy one snippet of code from Website chat in the app and paste it on your website.",
];

const limitations = [
  "It does not change each platform's rules. WhatsApp, Instagram and Messenger follow Meta's policies for business messaging.",
  "It does not send campaigns on Instagram or Messenger. Broadcast campaigns are not available there.",
  "Website chat answers questions only. Orders and bookings are taken on WhatsApp, Instagram and Messenger.",
];

// ==========================================
// FAQ QUESTIONS WITH COMPLETE ANSWERS
// ==========================================

const faqs = [
  {
    question: "Which channels can I connect?",
    answer:
      "WhatsApp, Instagram, Facebook Messenger and a chat widget for your website. Facebook and Instagram are an add-on to your plan.",
  },
  {
    question: "Do I need a separate AI for each channel?",
    answer:
      "No. One AI answers on every channel you connect, using the same business information.",
  },
  {
    question: "Where do I connect Instagram and Messenger?",
    answer:
      "From Channels in the Bellbee app, by signing in with Facebook.",
  },
  {
    question: "Can my team reply from one place?",
    answer:
      "Yes. Every connected channel arrives in the Bellbee inbox, and your team can step in on any chat.",
  },
  {
    question: "Do website visitors need to give their phone number?",
    answer:
      "Yes. Visitors give their name and phone number before they start chatting. An email is optional.",
  },
  {
    question: "Can I send campaigns on Instagram or Messenger?",
    answer:
      "No. Campaigns are WhatsApp broadcasts.",
  },
];

// ==========================================
// RELATED PAGES
// ==========================================

const relatedLinks = [
  {
    title: "WhatsApp AI agent",
    description:
      "Answers customers on your WhatsApp Business number.",
    to: "/whatsapp-ai-agent",
  },
  {
    title: "Instagram and Messenger",
    description:
      "Instagram and Messenger chats answered by the same AI.",
    to: "/instagram-ai-automation",
  },
  {
    title: "Website chat",
    description:
      "A chat window for your website, run by the same AI.",
    to: "/website-chat",
  },
];

// ==========================================
// REUSABLE FAQ ACCORDION
// Native details/summary:
// Works on click, keyboard and mobile.
// ==========================================

function OneInboxFAQ() {
  return (
    <section className="oneinbox-section oneinbox-section-soft">
      <div className="oneinbox-container">

        <div className="oneinbox-section-heading">
          <span className="oneinbox-kicker">
            COMMON QUESTIONS
          </span>

          <h2>
            Questions? We've got answers.
          </h2>

          <p>
            Everything you need to know about
            connecting your channels to one inbox.
          </p>
        </div>

        <div className="oneinbox-faq-list">
          {faqs.map((item, index) => (
            <details
              className="oneinbox-faq-item"
              key={item.question}
              open={undefined}
            >
              <summary className="oneinbox-faq-question">
                <span className="oneinbox-faq-question-text">
                  <span className="oneinbox-faq-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span>{item.question}</span>
                </span>

                <span className="oneinbox-faq-arrow">
                  <ChevronDown size={19} />
                </span>
              </summary>

              <div className="oneinbox-faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>

      </div>
    </section>
  );
}

// ==========================================
// MAIN ONE INBOX PAGE
// ==========================================

export default function OneInboxPage() {
  return (
    <main className="oneinbox-page">

      {/* ====================================
          1. HERO
          ==================================== */}

      <section className="oneinbox-hero">

        <div
          className="oneinbox-blob oneinbox-blob-lavender"
          aria-hidden="true"
        />

        <div
          className="oneinbox-blob oneinbox-blob-yellow"
          aria-hidden="true"
        />

        <div className="oneinbox-container oneinbox-hero-grid">

          <div className="oneinbox-hero-copy">
            <span className="oneinbox-kicker">
              CHANNELS
            </span>

            <h1>
              WhatsApp, Instagram, Messenger
              and website chat in one inbox
            </h1>

            <p>
              Bellbee Ai puts your WhatsApp, Instagram,
              Facebook Messenger and website chat
              conversations in one inbox. The same AI
              agent answers on each channel, and your
              team can step in on any chat.
            </p>

            <div className="oneinbox-hero-actions">
              <Link
                to="/signup"
                className="oneinbox-btn oneinbox-btn-primary"
              >
                Start with free credit
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/contact"
                className="oneinbox-btn oneinbox-btn-secondary"
              >
                Talk to sales
              </Link>
            </div>

            <div className="oneinbox-inline-note">
              <CheckCircle2 size={16} />
              <span>Every channel in one inbox.</span>
            </div>
          </div>

          <div className="oneinbox-hero-visual">

            <div className="oneinbox-floating-tag oneinbox-tag-whatsapp">
              WhatsApp
            </div>

            <div className="oneinbox-floating-tag oneinbox-tag-instagram">
              Instagram
            </div>

            <div className="oneinbox-floating-tag oneinbox-tag-messenger">
              Messenger
            </div>

            <div className="oneinbox-floating-tag oneinbox-tag-website">
              Website chat
            </div>

            <div className="oneinbox-hero-card">
              <img
                src="https://bellbee.ai/assets/inbox-overview-CokmlLYA.webp"
                alt="Illustration showing WhatsApp, Instagram, Messenger and website conversations in a shared inbox"
                loading="eager"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ====================================
          2. WHAT IT HELPS WITH
          ==================================== */}

      <section className="oneinbox-section">
        <div className="oneinbox-container">

          <div className="oneinbox-section-heading">
            <span className="oneinbox-kicker">
              WHAT IT HELPS WITH
            </span>

            <h2>
              Every customer conversation
              in one place
            </h2>
          </div>

          <div className="oneinbox-card-grid oneinbox-card-grid-3">
            {helpItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="oneinbox-info-card"
                  key={item.title}
                >
                  <div className="oneinbox-info-icon">
                    <Icon size={21} />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================
          3. HOW IT WORKS
          ==================================== */}

      <section className="oneinbox-section oneinbox-section-soft">
        <div className="oneinbox-container">

          <div className="oneinbox-section-heading">
            <span className="oneinbox-kicker">
              HOW IT WORKS
            </span>

            <h2>Three simple steps</h2>
          </div>

          <div className="oneinbox-steps-grid">
            {howItWorks.map((item) => (
              <article
                className="oneinbox-step-card"
                key={item.step}
              >
                <div className="oneinbox-step-badge">
                  {item.step}
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ====================================
          4. CONNECTED CHANNELS
          ==================================== */}

      <section className="oneinbox-section">
        <div className="oneinbox-container">

          <div className="oneinbox-section-heading">
            <span className="oneinbox-kicker">
              CHANNELS YOU CAN CONNECT
            </span>

            <h2>
              All your supported channels,
              together
            </h2>

            <p>
              Facebook and Instagram are an add-on.
              Add it from the add-ons page in the app,
              then connect your Page.
            </p>
          </div>

          <div className="oneinbox-card-grid oneinbox-card-grid-2">
            {connectItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="oneinbox-channel-card"
                  key={item.title}
                >
                  <div className="oneinbox-channel-icon">
                    <Icon size={24} />
                  </div>

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

      {/* ====================================
          5. ONE INBOX FOR TEAM
          ==================================== */}

      <section className="oneinbox-section oneinbox-section-soft">
        <div className="oneinbox-container">

          <div className="oneinbox-section-heading">
            <span className="oneinbox-kicker">
              ONE INBOX FOR YOUR WHOLE TEAM
            </span>

            <h2>
              Work together without switching apps
            </h2>
          </div>

          <div className="oneinbox-card-grid oneinbox-card-grid-3">
            {inboxTeamItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="oneinbox-info-card"
                  key={item.title}
                >
                  <div className="oneinbox-info-icon oneinbox-info-icon-yellow">
                    <Icon size={21} />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      {/* ====================================
          6. REQUIREMENTS & LIMITATIONS
          ==================================== */}

      <section className="oneinbox-section">
        <div className="oneinbox-container">

          <div className="oneinbox-two-col">

            <article className="oneinbox-list-card">
              <span className="oneinbox-kicker">
                WHAT YOU NEED
              </span>

              <h2>Before you go live</h2>

              <ul>
                {requirements.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="oneinbox-list-card oneinbox-list-card-muted">
              <span className="oneinbox-kicker">
                WHAT IT DOES NOT DO
              </span>

              <h2>Important to know</h2>

              <ul>
                {limitations.map((item) => (
                  <li key={item}>
                    <ShieldCheck size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

          </div>

          <div className="oneinbox-note-box">
            <strong>Your team stays in charge: </strong>
            Take over any chat from the inbox.
          </div>

        </div>
      </section>

      {/* ====================================
          7. WORKING FAQ ACCORDION
          ==================================== */}

      <OneInboxFAQ />

      {/* ====================================
          8. RELATED PAGES
          ==================================== */}

      <section className="oneinbox-section">
        <div className="oneinbox-container">

          <div className="oneinbox-section-heading">
            <span className="oneinbox-kicker">
              RELATED
            </span>

            <h2>Explore more</h2>
          </div>

          <div className="oneinbox-card-grid oneinbox-card-grid-3">
            {relatedLinks.map((item) => (
              <Link
                className="oneinbox-related-card"
                to={item.to}
                key={item.title}
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <span>
                  Open page
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ====================================
          9. START FREE CTA
          ==================================== */}

      <section className="oneinbox-cta">
        <div className="oneinbox-container">

          <div className="oneinbox-cta-card">

            <div>
              <span className="oneinbox-kicker">
                START WITH FREE CREDIT
              </span>

              <h2>
                No credit card required to start.
              </h2>
            </div>

            <div className="oneinbox-cta-actions">
              <Link
                to="/signup"
                className="oneinbox-btn oneinbox-btn-primary"
              >
                Start free
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/pricing"
                className="oneinbox-btn oneinbox-btn-secondary"
              >
                View pricing
              </Link>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
