
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Package,
  Paperclip,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

import "./AIAssistantPage.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ========================================
// SHARED HEADING
// ========================================

function SectionHeading({
  kicker,
  title,
  accent,
  description,
}) {
  return (
    <div className="aa-section-heading aa-reveal">
      <span className="aa-kicker">{kicker}</span>
      <h2>
        {title} <em>{accent}</em>
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}

// ========================================
// HERO — ORIGINAL CUSTOM WORKSPACE
// NO EXTERNAL IMAGE OR LOGO
// ========================================

function AssistantHeroPreview() {
  return (
    <div className="aa-hero-image-frame">
      <div className="aa-image-topbar">
        <div className="aa-window-dots">
          <span />
          <span />
          <span />
        </div>

        <div>
          <Bot size={15} />
          Assistant workspace
        </div>

        <span className="aa-image-status">
          Live preview
        </span>
      </div>

      {/* Conversation */}

      <div className="aa-demo-conversation">
        <span className="aa-demo-message">
          Please update our Friday opening hours
          to 8 PM and add express cleaning.
        </span>

        <div className="aa-demo-ai-reply">
          <Sparkles size={18} />
          <span>
            I've prepared two updates for you.
            Review the cards below before applying.
          </span>
        </div>
      </div>

      {/* Preview cards */}

      <div className="aa-change-list">
        <div className="aa-change-card aa-change-applied">
          <div className="aa-change-card-top">
            <span className="aa-change-type">
              <Package size={15} />
              Services
            </span>

            <span className="aa-change-status is-applied">
              <Check size={12} />
              Applied
            </span>
          </div>

          <h4>Add express cleaning</h4>
          <p>A new service has been prepared.</p>

          <div className="aa-change-value">
            <CheckCircle2 size={16} />
            Express Cleaning · 45 minutes
          </div>
        </div>

        <div className="aa-change-card aa-change-pending">
          <div className="aa-change-card-top">
            <span className="aa-change-type">
              <Clock3 size={15} />
              Business hours
            </span>

            <span className="aa-change-status is-pending">
              <Clock3 size={12} />
              Needs approval
            </span>
          </div>

          <h4>Update Friday hours</h4>
          <p>Current: 10:00 AM – 6:00 PM</p>

          <div className="aa-change-value">
            <CheckCircle2 size={16} />
            New: 10:00 AM – 8:00 PM
          </div>

          <div className="aa-change-card-bottom">
            <span>Waiting for confirmation</span>

            <span
              className="aa-change-apply"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 13px",
                borderRadius: 40,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Check size={14} />
              Apply
            </span>
          </div>
        </div>
      </div>

      <div className="aa-image-caption">
        <span>
          <ShieldCheck size={16} />
          Review before saving
        </span>

        <span>
          <Paperclip size={16} />
          PDF · Image · Voice
        </span>
      </div>
    </div>
  );
}

function AssistantHero() {
  return (
    <section className="aa-hero">
      <div
        className="aa-blob aa-blob-lavender"
        aria-hidden="true"
      />

      <div
        className="aa-blob aa-blob-yellow"
        aria-hidden="true"
      />

      <div className="aa-container aa-hero-grid">
        <div className="aa-hero-copy">
          <span className="aa-eyebrow aa-hero-reveal">
            <Sparkles size={16} />
            AI ASSISTANT
          </span>

          <h1 className="aa-hero-reveal">
            An assistant that{" "}
            <em>sets up your business AI</em>{" "}
            with you.
          </h1>

          <p className="aa-hero-text aa-hero-reveal">
            Manage your business AI through simple
            conversations. Tell the Assistant about
            your products, services, hours and
            business information.
          </p>

          <p className="aa-hero-text aa-hero-reveal">
            Your Assistant prepares reviewable
            change cards. Nothing is saved until
            you press <strong>Apply</strong>.
            You can also share a PDF, photo
            or voice note.
          </p>

          <div className="aa-hero-actions aa-hero-reveal">
            <Link
              to="/signup"
              className="aa-btn aa-btn-primary"
            >
              <Sparkles size={17} />
              Start using free
              <ArrowRight size={17} />
            </Link>

            <a
              href="#aa-how-it-works"
              className="aa-btn aa-btn-outline"
            >
              See how it works
            </a>
          </div>

          <div className="aa-hero-highlights aa-hero-reveal">
            <span>
              <CheckCircle2 size={16} />
              Review before applying
            </span>

            <span>
              <CheckCircle2 size={16} />
              Undo changes
            </span>

            <span>
              <CheckCircle2 size={16} />
              PDF, photo and voice
            </span>
          </div>
        </div>

        <div className="aa-hero-visual aa-hero-reveal">
          <span className="aa-floating aa-floating-top">
            <ShieldCheck size={16} />
            Your approval matters
          </span>

          <AssistantHeroPreview />

          <span className="aa-floating aa-floating-bottom">
            <Sparkles size={16} />
            AI-powered business setup
          </span>
        </div>
      </div>
    </section>
  );
}

// ========================================
// BENEFITS
// ========================================

const benefits = [
  {
    number: "01",
    icon: Package,
    color: "lavender",
    title: "Services and products",
    text:
      "Add or update your products, services, prices and offerings.",
  },
  {
    number: "02",
    icon: Clock3,
    color: "yellow",
    title: "Opening hours and locations",
    text:
      "Update business hours, addresses and locations through conversation.",
  },
  {
    number: "03",
    icon: MessageCircle,
    color: "coral",
    title: "Answers to common questions",
    text:
      "Turn frequently asked customer questions into helpful FAQs.",
  },
  {
    number: "04",
    icon: Tag,
    color: "green",
    title: "Promotions",
    text:
      "Start, update or pause promotions after reviewing each change.",
  },
  {
    number: "05",
    icon: Settings2,
    color: "lavender",
    title: "Business details and AI settings",
    text:
      "Update your business information and how your AI responds.",
  },
];

function AssistantBenefits() {
  return (
    <section className="aa-section aa-benefits">
      <div className="aa-container">
        <SectionHeading
          kicker="WHAT IT HELPS WITH"
          title="Your business changes."
          accent="Your AI keeps up."
          description="Manage the information your customer-facing AI uses, without complicated settings."
        />

        <div className="aa-benefits-grid">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="aa-benefit-card aa-reveal"
                key={item.title}
              >
                <div className="aa-card-head">
                  <span
                    className={`aa-icon-box aa-icon-${item.color}`}
                  >
                    <Icon size={23} />
                  </span>

                  <span className="aa-card-number">
                    {item.number}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========================================
// HOW IT WORKS
// ========================================

const steps = [
  {
    number: "01",
    icon: MessageCircle,
    color: "lavender",
    title: "Tell it about your business",
    text:
      "Type a message or share a document, image or voice note.",
  },
  {
    number: "02",
    icon: FileText,
    color: "yellow",
    title: "Review the change card",
    text:
      "Every proposed update appears in a card so you can check it first.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    color: "coral",
    title: "Apply, or undo later",
    text:
      "Approve the proposed change or undo an applied update.",
  },
];

function AssistantHowItWorks() {
  return (
    <section
      className="aa-section aa-how"
      id="aa-how-it-works"
    >
      <div className="aa-container">
        <SectionHeading
          kicker="HOW IT WORKS"
          title="Just tell it."
          accent="Review. Apply."
          description="Your conversation becomes a structured update, but you always have the final say."
        />

        <div className="aa-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="aa-step-card aa-reveal"
                key={step.number}
              >
                <span className="aa-step-number">
                  {step.number}
                </span>

                <span
                  className={`aa-icon-box aa-icon-${step.color}`}
                >
                  <Icon size={24} />
                </span>

                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========================================
// INTERACTIVE APPLY / UNDO DEMO
// LOCAL REACT STATE ONLY
// ========================================

const initialCards = [
  {
    id: "service",
    type: "Services",
    icon: Package,
    title: "Add a new service",
    detail: "Express Cleaning",
    change: "45-minute service added",
    status: "applied",
  },
  {
    id: "faq",
    type: "Knowledge",
    icon: MessageCircle,
    title: "Update a common answer",
    detail: "Do you offer Saturday appointments?",
    change: "Saturday bookings are available.",
    status: "applied",
  },
  {
    id: "hours",
    type: "Opening hours",
    icon: Clock3,
    title: "Update Friday opening hours",
    detail: "Current: 10:00 AM – 6:00 PM",
    change: "New: 10:00 AM – 8:00 PM",
    status: "pending",
  },
];

function AssistantChangeCard({
  card,
  onToggle,
}) {
  const Icon = card.icon;
  const applied = card.status === "applied";

  return (
    <article
      className={`aa-change-card ${
        applied
          ? "aa-change-applied"
          : "aa-change-pending"
      }`}
    >
      <div className="aa-change-card-top">
        <span className="aa-change-type">
          <Icon size={15} />
          {card.type}
        </span>

        <span
          className={`aa-change-status ${
            applied ? "is-applied" : "is-pending"
          }`}
        >
          {applied ? (
            <Check size={12} />
          ) : (
            <Clock3 size={12} />
          )}

          {applied ? "Applied" : "Needs approval"}
        </span>
      </div>

      <h4>{card.title}</h4>
      <p>{card.detail}</p>

      <div className="aa-change-value">
        <CheckCircle2 size={16} />
        <span>{card.change}</span>
      </div>

      <div className="aa-change-card-bottom">
        <span>
          {applied
            ? "Change applied in this demo"
            : "Not saved yet"}
        </span>

        <button
          type="button"
          className={
            applied
              ? "aa-change-undo"
              : "aa-change-apply"
          }
          onClick={() => onToggle(card.id)}
        >
          {applied ? (
            <>
              <RotateCcw size={14} />
              Undo
            </>
          ) : (
            <>
              <Check size={14} />
              Apply
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function AssistantChangeDemo() {
  const [cards, setCards] = useState(initialCards);

  const appliedCount = cards.filter(
    (card) => card.status === "applied"
  ).length;

  function toggleCard(id) {
    setCards((previous) =>
      previous.map((card) =>
        card.id === id
          ? {
              ...card,
              status:
                card.status === "applied"
                  ? "pending"
                  : "applied",
            }
          : card
      )
    );
  }

  return (
    <section className="aa-section aa-demo-section">
      <div className="aa-container">
        <div className="aa-demo-layout">
          <div className="aa-demo-copy aa-reveal">
            <span className="aa-kicker">
              CHANGE CARDS
            </span>

            <h2>
              You decide what
              <em> gets saved.</em>
            </h2>

            <p>
              The Assistant prepares your business
              updates and waits for your approval.
            </p>

            <p>
              Try applying and undoing the sample
              cards to explore how it works.
            </p>

            <div className="aa-attachment-box">
              <h3>
                <Paperclip size={18} />
                Explain it your way
              </h3>

              <div className="aa-attachment-options">
                <span>
                  <FileText size={18} />
                  PDF
                </span>

                <span>
                  <ImageIcon size={18} />
                  Photo
                </span>

                <span>
                  <Mic size={18} />
                  Voice note
                </span>
              </div>

              <small>
                Attachment support is part of the
                actual Assistant. This public
                preview does not upload files.
              </small>
            </div>
          </div>

          <div className="aa-demo-workspace aa-reveal">
            <div className="aa-demo-workspace-header">
              <div className="aa-demo-workspace-title">
                <span className="aa-demo-bot-icon">
                  <Bot size={20} />
                </span>

                <div>
                  <strong>AI Assistant</strong>
                  <small>Example business updates</small>
                </div>
              </div>

              <span className="aa-demo-count">
                {appliedCount} applied
              </span>
            </div>

            <div className="aa-demo-conversation">
              <span className="aa-demo-message">
                We are now open until 8 PM on
                Fridays. Please update our hours.
              </span>

              <div className="aa-demo-ai-reply">
                <Sparkles size={17} />

                <span>
                  I've prepared your change card.
                  Review and apply it when ready.
                </span>
              </div>
            </div>

            <div className="aa-change-list">
              {cards.map((card) => (
                <AssistantChangeCard
                  key={card.id}
                  card={card}
                  onToggle={toggleCard}
                />
              ))}
            </div>

            <div
              className="aa-demo-workspace-footer"
              aria-live="polite"
            >
              <ShieldCheck size={17} />
              <span>
                Demo only — no database changes
                or API requests are made.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ========================================
// REQUIREMENTS
// ========================================

const requirements = [
  "An account on the platform. The Assistant is available in the web and Android apps.",
  "No customer channel connection is required to start preparing your business information.",
];

const limitations = [
  "The business owner's Assistant does not directly chat with customers. Your customer-facing AI handles those conversations.",
  "The Assistant does not change your subscription plan, connected channels or billing.",
];

function AssistantRequirements() {
  return (
    <section className="aa-section aa-requirements">
      <div className="aa-container">
        <SectionHeading
          kicker="GOOD TO KNOW"
          title="Easy to start."
          accent="Always in your control."
        />

        <div className="aa-requirements-grid">
          <article className="aa-requirement-card aa-reveal">
            <div className="aa-requirement-heading">
              <span className="aa-icon-box aa-icon-green">
                <CheckCircle2 size={23} />
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

          <article className="aa-requirement-card aa-reveal">
            <div className="aa-requirement-heading">
              <span className="aa-icon-box aa-icon-yellow">
                <ShieldCheck size={23} />
              </span>

              <h3>What it does not do</h3>
            </div>

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

        <div className="aa-requirements-note aa-reveal">
          <ShieldCheck size={20} />

          <p>
            Nothing is saved until you apply
            a proposed change. You remain in
            control of your business information.
          </p>
        </div>
      </div>
    </section>
  );
}

// ========================================
// FAQs — WORKING ACCORDIONS
// ========================================

const faqs = [
  {
    question:
      "Does the Assistant change anything without asking?",
    answer:
      "No. It prepares change cards for review. Nothing is saved until you approve and apply the update.",
  },
  {
    question: "Can I undo a change?",
    answer:
      "Yes. Supported applied changes can be undone through the Assistant.",
  },
  {
    question: "What can I attach?",
    answer:
      "You can attach a PDF, a photo or a voice note to explain a change.",
  },
  {
    question:
      "Is the Assistant the AI that answers my customers?",
    answer:
      "No. This Assistant helps manage your business knowledge and settings. Your customer-facing AI answers customers using the information you've applied.",
  },
  {
    question: "Where do I find it?",
    answer:
      "You can access the AI Assistant in your business dashboard after signing in.",
  },
];

function AssistantFAQ() {
  return (
    <section className="aa-section aa-faq-section">
      <div className="aa-container aa-faq-layout">
        <div className="aa-faq-intro aa-reveal">
          <span className="aa-kicker">
            QUESTIONS
          </span>

          <h2>
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>

          <p>
            Learn how to manage and approve
            business AI updates.
          </p>
        </div>

        <div className="aa-faq-list">
          {faqs.map((item, index) => (
            <details
              key={item.question}
              className="aa-faq-item aa-reveal"
            >
              <summary>
                <span className="aa-faq-question">
                  <span className="aa-faq-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {item.question}
                </span>

                <ChevronDown size={19} />
              </summary>

              <div className="aa-faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================
// RELATED PAGES
// ========================================

const relatedPages = [
  {
    title: "AI customer support",
    description:
      "Answers questions using your business information.",
    icon: MessageCircle,
    color: "lavender",
    to: "/ai-customer-support",
  },
  {
    title: "One inbox",
    description:
      "Manage connected channels in one place.",
    icon: Bot,
    color: "yellow",
    to: "/omnichannel-messaging",
  },
  {
    title: "Pricing",
    description:
      "Explore subscription options and start free.",
    icon: Tag,
    color: "coral",
    to: "/pricing",
  },
];

function AssistantRelated() {
  return (
    <section className="aa-section aa-related-section">
      <div className="aa-container">
        <SectionHeading
          kicker="EXPLORE MORE"
          title="Your AI can do"
          accent="even more."
        />

        <div className="aa-related-grid">
          {relatedPages.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="aa-related-card aa-reveal"
              >
                <div className="aa-related-card-top">
                  <span
                    className={`aa-icon-box aa-icon-${item.color}`}
                  >
                    <Icon size={23} />
                  </span>

                  <ArrowUpRight size={21} />
                </div>

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

// ========================================
// FINAL CTA
// ========================================

function AssistantCTA() {
  return (
    <section className="aa-cta-section">
      <div className="aa-container">
        <div className="aa-cta-card aa-reveal">
          <div
            className="aa-cta-blob aa-cta-blob-one"
            aria-hidden="true"
          />

          <div
            className="aa-cta-blob aa-cta-blob-two"
            aria-hidden="true"
          />

          <div className="aa-cta-inner">
            <span className="aa-cta-kicker">
              GET STARTED
            </span>

            <h2>
              Your business AI
              <br />
              starts with <em>you.</em>
            </h2>

            <p>
              Start with free credit.
              No credit card required to begin.
            </p>

            <div className="aa-cta-actions">
              <Link
                to="/signup"
                className="aa-btn aa-btn-primary"
              >
                <Sparkles size={17} />
                Start using free
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="aa-btn aa-btn-light"
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

// ========================================
// MAIN PAGE + GSAP
// ========================================

export default function AIAssistantPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) return;

      gsap.fromTo(
        ".aa-hero-reveal",
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
        }
      );

      gsap.utils.toArray(".aa-reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 92%",
              once: true,
            },
          }
        );
      });

      gsap.to(".aa-blob", {
        rotation: 360,
        duration: 48,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".aa-floating", {
        y: -9,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.4,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="aa-page" ref={pageRef}>
      <AssistantHero />
      <AssistantBenefits />
      <AssistantHowItWorks />
      <AssistantChangeDemo />
      <AssistantRequirements />
      <AssistantFAQ />
      <AssistantRelated />
      <AssistantCTA />
    </main>
  );
}
