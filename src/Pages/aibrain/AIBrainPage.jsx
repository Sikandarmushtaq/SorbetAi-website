
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Globe2,
  HelpCircle,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  Users,
  X,
} from "lucide-react";

import "./AIBrainPage.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ==========================================
// SHARED COMPONENTS
// ==========================================

function SectionHeading({
  label,
  title,
  accent,
  description,
}) {
  return (
    <div className="brain-heading brain-reveal">
      <span className="brain-kicker">{label}</span>

      <h2>
        {title} <em>{accent}</em>
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="brain-feature-card brain-reveal">
      <div className="brain-feature-top">
        <span
          className={`brain-icon-box brain-icon-${item.color}`}
        >
          <Icon size={22} />
        </span>

        <span className="brain-card-number">
          {item.number}
        </span>
      </div>

      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </article>
  );
}

// ==========================================
// HERO DASHBOARD PREVIEW
// All data is simulated.
// No backend request or database mutation.
// ==========================================

const initialSuggestions = [
  {
    id: "hours",
    title: "New opening hours found",
    source: "Website import",
    detail: "Friday · 10:00 AM – 8:00 PM",
    status: "pending",
  },
  {
    id: "faq",
    title: "New FAQ suggested",
    source: "Services brochure.pdf",
    detail: "Do you offer weekend appointments?",
    status: "pending",
  },
];

const sampleQuestions = [
  {
    question: "What services do you offer?",
    answer:
      "We offer Express Cleaning, Deep Cleaning and Interior Care. I can explain each service if you'd like.",
  },
  {
    question: "When are you open?",
    answer:
      "Our example business is open Monday to Friday, 10 AM to 6 PM. Saturday is by appointment.",
  },
  {
    question: "Can I speak to someone?",
    answer:
      "Of course! I can help you connect with a member of the team.",
  },
];

function BrainPreview() {
  const [activeTab, setActiveTab] = useState("overview");
  const [suggestions, setSuggestions] =
    useState(initialSuggestions);

  const [selectedQuestion, setSelectedQuestion] =
    useState(0);

  const pendingCount = suggestions.filter(
    (item) => item.status === "pending"
  ).length;

  function reviewSuggestion(id, status) {
    setSuggestions((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  }

  return (
    <div className="brain-preview">
      <div className="brain-preview-header">
        <div className="brain-preview-heading">
          <span className="brain-preview-logo">
            <BookOpen size={19} />
          </span>

          <div>
            <strong>Business Knowledge</strong>
            <small>AI Brain workspace</small>
          </div>
        </div>

        <span className="brain-preview-status">
          <span />
          Demo
        </span>
      </div>

      <div
        className="brain-preview-tabs"
        aria-label="Preview workspace sections"
      >
        {[
          ["overview", "Overview"],
          ["review", `Review (${pendingCount})`],
          ["test", "Test AI"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={
              activeTab === value ? "is-active" : ""
            }
            onClick={() => setActiveTab(value)}
            aria-pressed={activeTab === value}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="brain-preview-content">
          <div className="brain-preview-search">
            <Search size={14} />
            Your business knowledge
          </div>

          <div className="brain-preview-stats">
            <div>
              <Package size={16} />
              <strong>8</strong>
              <span>Services</span>
            </div>

            <div>
              <HelpCircle size={16} />
              <strong>24</strong>
              <span>FAQs</span>
            </div>

            <div>
              <FileText size={16} />
              <strong>2</strong>
              <span>Documents</span>
            </div>
          </div>

          <div className="brain-preview-subtitle">
            <strong>Knowledge sources</strong>
            <span>Sample data</span>
          </div>

          <div className="brain-source-row">
            <span className="brain-source-icon pdf">
              <FileText size={17} />
            </span>

            <div>
              <strong>Services brochure.pdf</strong>
              <small>Business documents</small>
            </div>

            <span className="brain-source-badge">
              Ready
            </span>
          </div>

          <div className="brain-source-row">
            <span className="brain-source-icon pdf">
              <FileText size={17} />
            </span>

            <div>
              <strong>Business information.pdf</strong>
              <small>Business documents</small>
            </div>

            <span className="brain-source-badge">
              Ready
            </span>
          </div>

          <div className="brain-source-row">
            <span className="brain-source-icon web">
              <Globe2 size={17} />
            </span>

            <div>
              <strong>your-business.example</strong>
              <small>Website knowledge</small>
            </div>

            <span className="brain-source-badge review">
              Review
            </span>
          </div>

          <button
            type="button"
            className="brain-preview-action"
            onClick={() => setActiveTab("review")}
          >
            <Sparkles size={15} />
            Review suggested knowledge
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {activeTab === "review" && (
        <div className="brain-preview-content">
          <div className="brain-preview-subtitle">
            <strong>Review before using</strong>
            <span>{pendingCount} pending</span>
          </div>

          <p className="brain-preview-intro">
            New knowledge is not approved until
            you choose to keep it.
          </p>

          <div className="brain-review-list">
            {suggestions.map((item) => (
              <article
                className="brain-review-card"
                key={item.id}
              >
                <div className="brain-review-card-head">
                  <span>
                    <Sparkles size={14} />
                    {item.source}
                  </span>

                  <span
                    className={
                      item.status === "kept"
                        ? "brain-review-state kept"
                        : item.status === "removed"
                        ? "brain-review-state removed"
                        : "brain-review-state"
                    }
                  >
                    {item.status === "pending"
                      ? "Pending"
                      : item.status === "kept"
                      ? "Kept"
                      : "Removed"}
                  </span>
                </div>

                <strong>{item.title}</strong>
                <p>{item.detail}</p>

                {item.status === "pending" ? (
                  <div className="brain-review-actions">
                    <button
                      type="button"
                      onClick={() =>
                        reviewSuggestion(item.id, "kept")
                      }
                    >
                      <Check size={14} />
                      Keep
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        reviewSuggestion(item.id, "removed")
                      }
                    >
                      <X size={14} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="brain-review-reset"
                    onClick={() =>
                      reviewSuggestion(item.id, "pending")
                    }
                  >
                    Change decision
                  </button>
                )}
              </article>
            ))}
          </div>

          <p className="brain-preview-disclaimer">
            Preview only. No real knowledge is saved.
          </p>
        </div>
      )}

      {activeTab === "test" && (
        <div className="brain-preview-content">
          <div className="brain-preview-subtitle">
            <strong>Try your AI</strong>
            <span>Example conversation</span>
          </div>

          <div className="brain-test-chat">
            <div className="brain-test-message user">
              {sampleQuestions[selectedQuestion].question}
            </div>

            <div className="brain-test-message assistant">
              <span>
                <Bot size={13} />
                Sample AI response
              </span>

              {sampleQuestions[selectedQuestion].answer}
            </div>
          </div>

          <div className="brain-test-suggestions">
            <small>Choose a sample question</small>

            {sampleQuestions.map((item, index) => (
              <button
                type="button"
                key={item.question}
                className={
                  selectedQuestion === index
                    ? "is-selected"
                    : ""
                }
                onClick={() => setSelectedQuestion(index)}
              >
                {item.question}
              </button>
            ))}
          </div>

          <p className="brain-preview-disclaimer">
            These replies are examples, not a live AI connection.
          </p>
        </div>
      )}

      <div className="brain-preview-footer">
        <ShieldCheck size={15} />
        Your information stays under your control
      </div>
    </div>
  );
}

// ==========================================
// HERO SECTION
// ==========================================

function BrainHero() {
  return (
    <section className="brain-hero">
      <span
        className="brain-blob brain-blob-lavender"
        aria-hidden="true"
      />

      <span
        className="brain-blob brain-blob-yellow"
        aria-hidden="true"
      />

      <div className="brain-container brain-hero-grid">
        <div className="brain-hero-copy">
          <span className="brain-eyebrow brain-hero-reveal">
            <BookOpen size={16} />
            AI BRAIN
          </span>

          <h1 className="brain-hero-reveal">
            Teach your AI{" "}
            <em>everything</em> about
            your business.
          </h1>

          <p className="brain-hero-text brain-hero-reveal">
            Keep your services, products, opening hours,
            team information, offers and FAQs in one
            organized knowledge base.
          </p>

          <p className="brain-hero-text brain-hero-reveal">
            Add information yourself, upload documents
            or import knowledge from your website.
            Review what your AI learns before
            approving it.
          </p>

          <div className="brain-hero-actions brain-hero-reveal">
            <Link
              to="/signup"
              className="brain-btn brain-btn-primary"
            >
              <Sparkles size={17} />
              Start using free
              <ArrowRight size={17} />
            </Link>

            <a
              href="#brain-how"
              className="brain-btn brain-btn-outline"
            >
              See how it works
            </a>
          </div>

          <div className="brain-hero-trust brain-hero-reveal">
            <span>
              <CheckCircle2 size={15} />
              One knowledge base
            </span>

            <span>
              <CheckCircle2 size={15} />
              Review before use
            </span>

            <span>
              <CheckCircle2 size={15} />
              Test your AI
            </span>
          </div>
        </div>

        <div className="brain-hero-visual brain-hero-reveal">
          <span className="brain-float brain-float-top">
            <ShieldCheck size={16} />
            You control what AI knows
          </span>

          <BrainPreview />

          <span className="brain-float brain-float-bottom">
            <Sparkles size={16} />
            Organized business knowledge
          </span>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// WHAT IT HELPS WITH
// ==========================================

const benefits = [
  {
    number: "01",
    icon: Package,
    color: "lavender",
    title: "Services and products",
    description:
      "Add names, prices, durations and service providers. Leave a price empty when customers should ask for a quote.",
  },
  {
    number: "02",
    icon: Clock3,
    color: "yellow",
    title: "Hours and special days",
    description:
      "Set weekly hours, breaks, holidays and shorter opening days.",
  },
  {
    number: "03",
    icon: HelpCircle,
    color: "coral",
    title: "Frequently asked questions",
    description:
      "Give your AI answers to the questions customers ask most, in your own words.",
  },
  {
    number: "04",
    icon: Users,
    color: "green",
    title: "Your team",
    description:
      "Add each person's role, working hours and days off.",
  },
  {
    number: "05",
    icon: Tag,
    color: "lavender",
    title: "Offers and promotions",
    description:
      "Keep offers current and pause promotions whenever necessary.",
  },
  {
    number: "06",
    icon: MapPin,
    color: "yellow",
    title: "Business branches",
    description:
      "Add multiple business locations, addresses and contact numbers.",
  },
];

function BrainBenefits() {
  return (
    <section className="brain-section">
      <div className="brain-container">
        <SectionHeading
          label="WHAT IT HELPS WITH"
          title="Everything your AI needs."
          accent="All in one place."
          description="Keep your business information organized so your AI can give customers useful, consistent answers."
        />

        <div className="brain-benefits-grid">
          {benefits.map((item) => (
            <FeatureCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// HOW IT WORKS
// ==========================================

const steps = [
  {
    number: "01",
    icon: BookOpen,
    title: "Add what you know",
    description:
      "Enter your business details yourself, or ask the AI Assistant to help.",
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload or import",
    description:
      "Add supported documents, photos or information from your website.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Review what was found",
    description:
      "Check extracted information and approve the useful parts.",
  },
  {
    number: "04",
    icon: MessageCircle,
    title: "Try your AI",
    description:
      "Test customer-style questions and improve anything that needs fixing.",
  },
];

function BrainHowItWorks() {
  return (
    <section
      className="brain-section brain-how"
      id="brain-how"
    >
      <div className="brain-container">
        <SectionHeading
          label="HOW IT WORKS"
          title="Teach. Review."
          accent="Improve."
          description="Build your business knowledge in four straightforward steps."
        />

        <div className="brain-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="brain-step-card brain-reveal"
                key={step.number}
              >
                <span className="brain-step-number">
                  {step.number}
                </span>

                <span className="brain-step-icon">
                  <Icon size={23} />
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

// ==========================================
// TEACH IT FROM YOUR MATERIAL
// ==========================================

const sources = [
  {
    icon: FileText,
    title: "Documents",
    description:
      "Upload PDF or image files up to 10 MB each. Scanned pages can be read as text where possible.",
    label: "PDF + IMAGES",
    color: "lavender",
  },
  {
    icon: Globe2,
    title: "Your website",
    description:
      "Verify your website ownership, then import knowledge from up to 50 accessible pages.",
    label: "WEBSITE IMPORT",
    color: "yellow",
  },
  {
    icon: MessageCircle,
    title: "Your own chats",
    description:
      "Upload a WhatsApp chat export and review suggested FAQs before keeping them.",
    label: "CHAT EXPORT",
    color: "coral",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Describe a business change naturally instead of editing every field by hand.",
    label: "ASSISTED SETUP",
    color: "green",
  },
];

function BrainKnowledgeSources() {
  return (
    <section className="brain-section brain-sources">
      <div className="brain-container">
        <SectionHeading
          label="TEACH IT FROM YOUR MATERIAL"
          title="Your knowledge."
          accent="Your way."
          description="Turn useful information from your existing business resources into knowledge your AI can use."
        />

        <div className="brain-source-grid">
          {sources.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="brain-source-card brain-reveal"
                key={item.title}
              >
                <div className="brain-source-top">
                  <span
                    className={`brain-icon-box brain-icon-${item.color}`}
                  >
                    <Icon size={23} />
                  </span>

                  <span>{item.label}</span>
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

// ==========================================
// STAY IN CONTROL
// ==========================================

const controls = [
  {
    icon: BookOpen,
    title: "One screen for everything",
    description:
      "View all knowledge in one place, and edit or delete individual items.",
  },
  {
    icon: CheckCircle2,
    title: "Review before use",
    description:
      "Approve information found in uploaded documents or imported websites.",
  },
  {
    icon: ShieldCheck,
    title: "Suspicious text held back",
    description:
      "Review text that looks like instructions aimed at changing your AI's behavior.",
  },
  {
    icon: HelpCircle,
    title: "Questions it could not answer",
    description:
      "Find unanswered customer questions and turn your answers into FAQs.",
  },
  {
    icon: FileText,
    title: "Control file sharing",
    description:
      "Choose whether your AI may send a document to customers or only read it.",
  },
  {
    icon: MessageCircle,
    title: "Try your AI",
    description:
      "Check how your AI responds to common customer questions before going live.",
  },
];

function BrainControls() {
  return (
    <section className="brain-section brain-controls">
      <div className="brain-container brain-controls-layout">
        <div className="brain-controls-intro brain-reveal">
          <span className="brain-kicker">
            STAY IN CONTROL
          </span>

          <h2>
            You decide what
            <em> your AI knows.</em>
          </h2>

          <p>
            New information should not become an AI
            answer without your review. Keep knowledge
            organized, correct mistakes and manage
            what customers can receive.
          </p>

          <div className="brain-control-illustration">
            <div className="brain-control-illustration-head">
              <span>
                <ShieldCheck size={19} />
                Knowledge review
              </span>

              <span className="brain-review-indicator">
                Approval required
              </span>
            </div>

            <div className="brain-control-example">
              <span className="brain-control-example-icon">
                <FileText size={19} />
              </span>

              <div>
                <strong>New FAQ from document</strong>
                <small>
                  Review the suggested answer
                  before publishing it.
                </small>
              </div>

              <CheckCircle2 size={19} />
            </div>

            <p>
              Every important update stays under
              your control.
            </p>
          </div>
        </div>

        <div className="brain-control-list">
          {controls.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className="brain-control-item brain-reveal"
                key={item.title}
              >
                <span className="brain-control-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="brain-control-icon">
                  <Icon size={20} />
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

// ==========================================
// HOW YOUR AI TALKS
// ==========================================

const personality = [
  {
    icon: Bot,
    title: "Name and tone",
    description:
      "Give your AI a name and choose friendly, professional, formal or casual replies.",
  },
  {
    icon: Globe2,
    title: "Language",
    description:
      "Answer in the customer's language or always respond in English.",
  },
  {
    icon: Settings2,
    title: "Your own rules",
    description:
      "Write up to 4,000 characters of instructions in plain language.",
  },
  {
    icon: ShieldCheck,
    title: "Platform safety rules",
    description:
      "Fixed platform-level rules still apply and cannot be changed in your settings.",
  },
];

function BrainPersonality() {
  return (
    <section className="brain-section brain-personality">
      <div className="brain-container">
        <SectionHeading
          label="HOW YOUR AI TALKS"
          title="Your business voice."
          accent="Every conversation."
          description="Set the name, tone, language and rules that guide your customer-facing AI."
        />

        <div className="brain-personality-grid">
          {personality.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="brain-personality-card brain-reveal"
                key={item.title}
              >
                <span className="brain-personality-icon">
                  <Icon size={22} />
                </span>

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

// ==========================================
// REQUIREMENTS & LIMITATIONS
// ==========================================

const requirements = [
  "An account on the platform to access your AI Brain.",
  "PDF or photo files, up to 10 MB each, for document knowledge.",
  "Website ownership verification through an approved DNS record or site tag before importing pages.",
];

const limitations = [
  "Document uploads support PDFs and photos, not Word, Excel or plain text files.",
  "Website imports exclude login-protected pages and website-hosted PDFs. The limit is 50 pages, or 20 without a sitemap.",
  "WhatsApp conversations are not read automatically. You must upload a chat export.",
  "Your AI answers using the information you maintain, so outdated knowledge should be updated.",
];

function BrainRequirements() {
  return (
    <section className="brain-section brain-requirements">
      <div className="brain-container">
        <SectionHeading
          label="BEFORE YOU GET STARTED"
          title="Simple requirements."
          accent="Clear limits."
        />

        <div className="brain-requirements-grid">
          <article className="brain-requirement-card brain-reveal">
            <div className="brain-requirement-title">
              <span className="brain-icon-box brain-icon-green">
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

          <article className="brain-requirement-card brain-reveal">
            <div className="brain-requirement-title">
              <span className="brain-icon-box brain-icon-yellow">
                <ShieldCheck size={22} />
              </span>

              <h3>What it does not do</h3>
            </div>

            <ul>
              {limitations.map((item) => (
                <li key={item}>
                  <ShieldCheck size={17} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="brain-requirement-note brain-reveal">
          <Users size={19} />
          <span>
            Your team can take over a customer chat
            when a person is requested or the AI
            cannot resolve the question.
          </span>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// FAQ — NATIVE WORKING ACCORDION
// ==========================================

const faqs = [
  {
    question: "What can I teach my AI?",
    answer:
      "You can add services, products, prices, opening hours, special days, staff, locations, offers, FAQs and business instructions.",
  },
  {
    question: "Can I upload documents?",
    answer:
      "Yes. Upload supported PDF and image files up to 10 MB each. The AI can use approved knowledge from these files, and scanned text can be extracted where possible.",
  },
  {
    question: "Can the AI Brain read my website?",
    answer:
      "Yes. After verifying ownership, you can import up to 50 accessible pages, or up to 20 pages if your site has no sitemap. You review the extracted information before keeping it.",
  },
  {
    question: "Can I see everything my AI knows?",
    answer:
      "Yes. Your AI Brain provides one place to review the information you have added, including knowledge items and supported imported sources.",
  },
  {
    question: "What if my AI does not know the answer?",
    answer:
      "Unanswered customer questions can appear in a review list. You can supply an answer and save it as an FAQ for future conversations.",
  },
  {
    question: "Can I stop my AI sharing a file?",
    answer:
      "Yes. Each supported document has a sharing setting. When sharing is disabled, the AI may use its approved knowledge without sending the original file.",
  },
  {
    question: "Do I have to type everything myself?",
    answer:
      "No. You can use the AI Assistant, upload supported documents, import your verified website or upload a WhatsApp chat export to prepare knowledge for review.",
  },
];

function BrainFAQ() {
  return (
    <section className="brain-section brain-faq">
      <div className="brain-container brain-faq-layout">
        <div className="brain-faq-intro brain-reveal">
          <span className="brain-kicker">
            FREQUENTLY ASKED QUESTIONS
          </span>

          <h2>
            Questions?
            <br />
            <em>Clear answers.</em>
          </h2>

          <p>
            Learn how to add, review and manage
            the information your AI uses.
          </p>
        </div>

        <div className="brain-faq-list">
          {faqs.map((item, index) => (
            <details
              className="brain-faq-item brain-reveal"
              key={item.question}
            >
              <summary>
                <span className="brain-faq-question">
                  <span className="brain-faq-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span>{item.question}</span>
                </span>

                <ChevronDown size={19} />
              </summary>

              <div className="brain-faq-answer">
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
// RELATED PAGES
// ==========================================

const relatedPages = [
  {
    title: "AI Assistant",
    description:
      "Set up your AI through conversation, with approval for every change.",
    icon: Sparkles,
    color: "lavender",
    to: "/ai-assistant",
  },
  {
    title: "AI customer support",
    description:
      "Help customers using your business information.",
    icon: MessageCircle,
    color: "yellow",
    to: "/ai-customer-support",
  },
  {
    title: "Appointment booking",
    description:
      "Handle appointments around your opening hours and availability.",
    icon: Clock3,
    color: "coral",
    to: "/appointment-booking",
  },
];

function BrainRelated() {
  return (
    <section className="brain-section brain-related">
      <div className="brain-container">
        <SectionHeading
          label="RELATED FEATURES"
          title="Make your AI"
          accent="even more useful."
        />

        <div className="brain-related-grid">
          {relatedPages.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.to}
                className="brain-related-card brain-reveal"
                key={item.to}
              >
                <div className="brain-related-top">
                  <span
                    className={`brain-icon-box brain-icon-${item.color}`}
                  >
                    <Icon size={22} />
                  </span>

                  <ArrowUpRight size={20} />
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

// ==========================================
// CTA
// ==========================================

function BrainCTA() {
  return (
    <section className="brain-cta-section">
      <div className="brain-container">
        <div className="brain-cta-card brain-reveal">
          <span
            className="brain-cta-blob brain-cta-blob-one"
            aria-hidden="true"
          />

          <span
            className="brain-cta-blob brain-cta-blob-two"
            aria-hidden="true"
          />

          <div className="brain-cta-inner">
            <span className="brain-cta-kicker">
              READY TO GET STARTED?
            </span>

            <h2>
              Build an AI that
              <br />
              <em>knows your business.</em>
            </h2>

            <p>
              Start with free credit.
              No credit card required to get started.
            </p>

            <div className="brain-cta-actions">
              <Link
                to="/signup"
                className="brain-btn brain-btn-primary"
              >
                <Sparkles size={17} />
                Start using free
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="brain-btn brain-btn-light"
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

// ==========================================
// MAIN PAGE + GSAP
// ==========================================

export default function AIBrainPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedMotion) return;

      gsap.fromTo(
        ".brain-hero-reveal",
        {
          opacity: 0,
          y: 34,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
        }
      );

      gsap.utils
        .toArray(".brain-reveal")
        .forEach((element) => {
          gsap.fromTo(
            element,
            {
              opacity: 0,
              y: 28,
            },
            {
              opacity: 1,
              y: 0,
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

      gsap.to(".brain-blob", {
        rotation: 360,
        duration: 48,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".brain-float", {
        y: -9,
        duration: 2.7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.4,
      });
    },
    { scope: pageRef }
  );

  return (
    <main ref={pageRef} className="brain-page">
      <BrainHero />
      <BrainBenefits />
      <BrainHowItWorks />
      <BrainKnowledgeSources />
      <BrainControls />
      <BrainPersonality />
      <BrainRequirements />
      <BrainFAQ />
      <BrainRelated />
      <BrainCTA />
    </main>
  );
}
