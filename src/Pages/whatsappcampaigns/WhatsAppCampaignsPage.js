
import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, ArrowUpRight, BarChart3, BellRing,
  Check, CheckCheck, CheckCircle2, ChevronDown, Clock3, FileText,
  Globe2, Image as ImageIcon, LockKeyhole, Megaphone, MessageCircle,
  MousePointer2, PauseCircle, Send, ShieldCheck,
  Sparkles, Target, Users, XCircle,
} from "lucide-react";
import "./WhatsAppCampaignsPage.css";

gsap.registerPlugin(useGSAP);

const messageTypes = [
  { id: "text", name: "Text", Icon: MessageCircle },
  { id: "image", name: "Image", Icon: ImageIcon },
  { id: "document", name: "Document", Icon: FileText },
  { id: "template", name: "Template", Icon: CheckCheck },
];

const exampleCustomers = [
  { id: 1, name: "Sarah Carter", hoursAgo: 3, phone: true },
  { id: 2, name: "James Wilson", hoursAgo: 12, phone: true },
  { id: 3, name: "Emma Davis", hoursAgo: 21, phone: true },
  { id: 4, name: "Olivia Brown", hoursAgo: 54, phone: true },
  { id: 5, name: "Noah Lee", hoursAgo: 108, phone: true },
  { id: 6, name: "Ava Patel", hoursAgo: 5, phone: false },
];

const benefits = [
  [
    Megaphone,
    "Share an offer",
    "Tell selected customers about your latest offer in one campaign.",
  ],
  [
    BellRing,
    "Share hours or news",
    "Announce business updates without writing the same message again.",
  ],
  [
    Target,
    "Reach recent customers",
    "Choose people who have messaged your business in the last few days.",
  ],
];

const steps = [
  [
    "01",
    MessageCircle,
    "Choose a message type",
    "Select text, an image, a document, or a Meta-approved template.",
  ],
  [
    "02",
    MousePointer2,
    "Write and preview",
    "See your message in a WhatsApp-style preview as you edit it.",
  ],
  [
    "03",
    Users,
    "Choose recipients",
    "Select all customers, a recent audience, or individual people.",
  ],
  [
    "04",
    CheckCircle2,
    "Review and save",
    "Save a draft, then send from your campaign page when ready.",
  ],
];

const kinds = [
  [
    MessageCircle,
    "Text",
    "A simple message with up to 4,096 characters.",
  ],
  [
    ImageIcon,
    "Image",
    "Send a public image URL with a caption.",
  ],
  [
    FileText,
    "Document",
    "Send a link to a file such as a PDF.",
  ],
  [
    CheckCheck,
    "Approved template",
    "Use a Meta-approved template to reach people outside the 24-hour reply window.",
  ],
];

const audiences = [
  [
    Users,
    "All customers",
    "Everyone with a phone number, subject to WhatsApp's messaging rules.",
  ],
  [
    Clock3,
    "Recent customers",
    "Choose how many days back to look for customer messages.",
  ],
  [
    Target,
    "Choose customers",
    "Pick individual people from your customer list.",
  ],
  [
    CheckCircle2,
    "Phone numbers only",
    "Customers without a usable phone number are excluded.",
  ],
];

const sending = [
  [
    ShieldCheck,
    "No duplicate sends",
    "A recipient receives the same campaign only once, even after a repeat tap.",
  ],
  [
    BarChart3,
    "See results",
    "Track total recipients, sent messages, failures and individual outcomes.",
  ],
  [
    PauseCircle,
    "Cancel while possible",
    "Cancel a scheduled or running campaign, or delete an unsent draft.",
  ],
  [
    LockKeyhole,
    "Sent means sent",
    "Already-sent WhatsApp messages cannot be recalled.",
  ],
];

const rules = [
  [
    Clock3,
    "The 24-hour rule",
    "Free-form messages are limited to customers within the WhatsApp customer-service window.",
  ],
  [
    CheckCheck,
    "Meta-approved templates",
    "Templates go through Meta review, commonly taking 24–48 hours. Approval timing can vary.",
  ],
  [
    ImageIcon,
    "Rich template content",
    "Templates may contain headers with text or media and up to three buttons.",
  ],
];

const faqs = [
  [
    "Can I send to all my customers?",
    "You can choose everyone with a phone number. For customers outside WhatsApp's 24-hour customer-service window, you need an eligible Meta-approved template.",
  ],
  [
    "Can I send to customers who have not written lately?",
    "Yes, with an approved WhatsApp template. Ordinary text or media messages cannot be used outside the customer-service window.",
  ],
  [
    "How do I get a template approved?",
    "Create a template in WhatsApp Templates and submit it for Meta approval. Review often takes about 24–48 hours, but this can vary.",
  ],
  [
    "Can I undo a campaign?",
    "You can cancel a scheduled or in-progress campaign and delete drafts, but messages that have already been sent cannot be recalled.",
  ],
  [
    "Where do I see the results?",
    "Open the campaign in Bellbee to review progress, sent and failed counts, and the outcome for each recipient.",
  ],
];

const related = [
  [
    MessageCircle,
    "WhatsApp AI agent",
    "Answers customers on your WhatsApp Business number.",
    "/whatsapp-ai-agent",
  ],
  [
    Globe2,
    "Channels",
    "Every channel in one place, with your team ready to step in.",
    "/omnichannel-messaging",
  ],
  [
    Sparkles,
    "AI customer support",
    "Answers questions using your own business information.",
    "/ai-customer-support",
  ],
];

function Heading({
  label,
  title,
  accent,
  description,
  center = false,
}) {
  return (
    <div
      className={`wc-heading ${
        center ? "wc-heading-center" : ""
      }`}
    >
      <span className="wc-kicker">{label}</span>

      <h2>
        {title} {accent && <em>{accent}</em>}
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function Card({ item, index = 0 }) {
  const [Icon, title, description] = item;

  return (
    <article className="wc-card">
      <span
        className={`wc-icon wc-icon-${
          ["lavender", "yellow", "coral", "green"][index % 4]
        }`}
      >
        <Icon size={22} strokeWidth={1.9} />
      </span>

      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

/* =========================================
   ORIGINAL INTERACTIVE CAMPAIGN BUILDER
========================================= */

function CampaignBuilder() {
  const [kind, setKind] = useState("text");

  const [body, setBody] = useState(
    "Hi! We've updated our opening hours this week. Reply to this message if you'd like more details."
  );

  const [mediaUrl, setMediaUrl] = useState(
    "https://example.com/offer.jpg"
  );

  const [audience, setAudience] = useState("recent");
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState([1, 3, 4]);
  const [phase, setPhase] = useState("editing");

  const recipients = useMemo(
    () =>
      exampleCustomers.filter((customer) => {
        if (!customer.phone) return false;

        if (
          audience === "recent" &&
          customer.hoursAgo > days * 24
        ) {
          return false;
        }

        if (
          audience === "choose" &&
          !selected.includes(customer.id)
        ) {
          return false;
        }

        return true;
      }),
    [audience, days, selected]
  );

  const eligible = recipients.filter(
    (customer) =>
      kind === "template" || customer.hoursAgo <= 24
  );

  const restricted = recipients.length - eligible.length;

  const simulatedFailed =
    eligible.length > 2 ? 1 : 0;

  const simulatedSent =
    eligible.length - simulatedFailed;

  const validMessage =
    kind === "template" || body.trim().length > 0;

  const mediaRequired =
    kind === "image" || kind === "document";

  const isValid =
    eligible.length > 0 &&
    validMessage &&
    (!mediaRequired ||
      /^https:\/\//i.test(mediaUrl.trim()));

  const sampleMessage =
    kind === "template"
      ? "Hello! Here's an update from our business. Thanks for staying in touch."
      : body.trim() ||
        "Your message preview will appear here.";

  function switchType(next) {
    setKind(next);
    setPhase("editing");

    if (next === "document") {
      setMediaUrl("https://example.com/update.pdf");
    }

    if (next === "image") {
      setMediaUrl("https://example.com/offer.jpg");
    }
  }

  function chooseCustomer(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );

    setPhase("editing");
  }

  function saveDraft() {
    if (isValid) setPhase("draft");
  }

  return (
    <div
      className="wc-builder"
      aria-label="Interactive WhatsApp campaign demonstration"
    >
      <div className="wc-builder-header">
        <div className="wc-builder-brand">
          <span>
            <Megaphone size={19} />
          </span>

          <div>
            <strong>Campaign creator</strong>
            <small>Bellbee WhatsApp preview</small>
          </div>
        </div>

        <span className="wc-demo-tag">
          <i /> DEMO
        </span>
      </div>

      <div className="wc-builder-inner">
        <div className="wc-builder-step">
          <strong>01 · Message type</strong>
          <span>Choose a format</span>
        </div>

        <div
          className="wc-type-picker"
          role="group"
          aria-label="Select message type"
        >
          {messageTypes.map(({ id, name, Icon }) => (
            <button
              key={id}
              type="button"
              className={kind === id ? "active" : ""}
              aria-pressed={kind === id}
              onClick={() => switchType(id)}
            >
              <Icon size={15} />
              {name}
            </button>
          ))}
        </div>

        {kind === "template" ? (
          <div className="wc-template-note">
            <CheckCheck size={17} />
            <span>
              Approved template example. Templates can
              reach customers outside the 24-hour window.
            </span>
          </div>
        ) : (
          <label className="wc-field">
            Message{" "}
            {kind === "image"
              ? "caption"
              : kind === "document"
              ? "text"
              : "body"}

            <textarea
              rows={3}
              maxLength={4096}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setPhase("editing");
              }}
              placeholder="Write your campaign..."
            />

            <small>{body.length}/4096 characters</small>
          </label>
        )}

        {mediaRequired && (
          <label className="wc-field">
            Public {kind === "image" ? "image" : "document"} link

            <input
              value={mediaUrl}
              onChange={(event) => {
                setMediaUrl(event.target.value);
                setPhase("editing");
              }}
              placeholder="https://example.com/file"
            />
          </label>
        )}

        <div className="wc-whatsapp-preview">
          <div className="wc-whatsapp-top">
            <MessageCircle size={16} />

            <strong>WhatsApp preview</strong>
            <span>Customer view</span>
          </div>

          <div className="wc-whatsapp-chat">
            <div className="wc-message-bubble">
              {kind === "image" && (
                <div className="wc-media-placeholder">
                  <ImageIcon size={22} />
                  <span>Image attachment preview</span>
                </div>
              )}

              {kind === "document" && (
                <div className="wc-media-placeholder">
                  <FileText size={22} />
                  <span>Document attachment</span>
                </div>
              )}

              {kind === "template" && (
                <span className="wc-template-label">
                  <CheckCheck size={13} />
                  Approved template
                </span>
              )}

              <p>{sampleMessage}</p>

              <small>
                10:42 <CheckCheck size={12} />
              </small>
            </div>
          </div>
        </div>

        <div className="wc-builder-step wc-audience-title">
          <strong>02 · Recipients</strong>
          <span>Target your customers</span>
        </div>

        <div
          className="wc-audience-pills"
          role="group"
          aria-label="Select recipient group"
        >
          {[
            ["all", "All"],
            ["recent", "Recent"],
            ["choose", "Choose"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={audience === id ? "active" : ""}
              aria-pressed={audience === id}
              onClick={() => {
                setAudience(id);
                setPhase("editing");
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {audience === "recent" && (
          <label className="wc-days-select">
            Messaged within

            <select
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setPhase("editing");
              }}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
            </select>
          </label>
        )}

        {audience === "choose" && (
          <div className="wc-customer-picks">
            {exampleCustomers.map((customer) => (
              <label
                key={customer.id}
                className={!customer.phone ? "unavailable" : ""}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(customer.id)}
                  disabled={!customer.phone}
                  onChange={() => chooseCustomer(customer.id)}
                />

                {customer.name}

                {!customer.phone && <small>no phone</small>}
              </label>
            ))}
          </div>
        )}

        <div className="wc-recipient-summary">
          <Users size={16} />

          <strong>{eligible.length} eligible</strong>

          <span>
            {restricted > 0
              ? `${restricted} outside the 24-hour window`
              : "Ready for this message type"}
          </span>
        </div>

        {phase === "editing" ? (
          <button
            className="wc-build-action"
            type="button"
            onClick={saveDraft}
            disabled={!isValid}
          >
            <Check size={16} />
            Save sample draft
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="wc-draft-actions">
            <div className="wc-saved-status" role="status">
              <CheckCircle2 size={16} />

              {phase === "draft"
                ? "Sample draft saved"
                : phase === "sent"
                ? "Demo send completed"
                : "Demo cancelled"}
            </div>

            {phase === "draft" && (
              <div className="wc-draft-buttons">
                <button
                  type="button"
                  onClick={() => setPhase("sent")}
                >
                  <Send size={15} />
                  Simulate send
                </button>

                <button
                  type="button"
                  onClick={() => setPhase("cancelled")}
                >
                  Cancel
                </button>
              </div>
            )}

            {phase === "sent" && (
              <p className="wc-demo-results">
                <CheckCheck size={15} />
                Sent: {simulatedSent} · Not delivered:{" "}
                {simulatedFailed} · No duplicate sends in
                this example.
              </p>
            )}

            <button
              type="button"
              className="wc-restart"
              onClick={() => setPhase("editing")}
            >
              Edit sample campaign
            </button>
          </div>
        )}
      </div>

      <footer className="wc-builder-footer">
        <ShieldCheck size={15} />
        Frontend demo only — no messages are sent
      </footer>
    </div>
  );
}

/* =========================================
   FAQ ACCORDION
========================================= */

function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div className="wc-faq-list">
      {faqs.map(([question, answer], index) => (
        <article
          className={`wc-faq-item ${
            open === index ? "open" : ""
          }`}
          key={question}
        >
          <button
            type="button"
            aria-expanded={open === index}
            aria-controls={`wc-faq-${index}`}
            onClick={() =>
              setOpen(open === index ? -1 : index)
            }
          >
            <span>{question}</span>
            <ChevronDown size={19} />
          </button>

          <div
            id={`wc-faq-${index}`}
            hidden={open !== index}
          >
            <p>{answer}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/* =========================================
   MAIN PAGE + GSAP
========================================= */

export default function WhatsAppCampaignsPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      gsap.to(".wc-blob", {
        rotation: 360,
        duration: 54,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".wc-blob", {
        x: 18,
        y: -15,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.9,
      });

      gsap.to(".wc-float", {
        y: -9,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="wc-page" ref={pageRef}>
      {/* HERO */}
      <section className="wc-hero">
        <span
          className="wc-blob wc-blob-lavender"
          aria-hidden="true"
        />

        <span
          className="wc-blob wc-blob-yellow"
          aria-hidden="true"
        />

        <div className="wc-container wc-hero-grid">
          <div className="wc-hero-copy">
            <span className="wc-hero-pill">
              <Megaphone size={16} />
              WHATSAPP CAMPAIGNS
            </span>

            <h1>
              One message.{" "}
              <em>The customers you choose.</em>
            </h1>

            <p>
              Share offers, opening hours or news with
              your WhatsApp customers. Write the message,
              choose who receives it, save a draft and
              send when you're ready.
            </p>

            <div className="wc-hero-actions">
              <Link
                to="/signup"
                className="wc-btn wc-btn-coral"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <a
                href="#wc-how"
                className="wc-btn wc-btn-outline"
              >
                See how it works
              </a>
            </div>

            <div className="wc-hero-trust">
              <span>
                <CheckCircle2 size={16} />
                WhatsApp Business
              </span>

              <span>
                <CheckCircle2 size={16} />
                Preview before sending
              </span>
            </div>
          </div>

          <div className="wc-hero-visual">
            <span className="wc-float wc-float-top">
              <Sparkles size={16} />
              Your message, your audience
            </span>

            <CampaignBuilder />

            <span className="wc-float wc-float-bottom">
              <Check size={16} />
              Review before you send
            </span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="wc-section">
        <div className="wc-container">
          <Heading
            label="WHAT IT HELPS WITH"
            title="Keep customers informed."
            accent="Without repeating yourself."
            description="Tell the right people what's new with one campaign."
          />

          <div className="wc-grid wc-grid-three">
            {benefits.map((item, i) => (
              <Card key={item[1]} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="wc-how"
        className="wc-section wc-section-light"
      >
        <div className="wc-container">
          <Heading
            label="HOW IT WORKS"
            title="From idea to draft."
            accent="In four steps."
            description="A guided flow helps you build, preview and review your WhatsApp message."
          />

          <div className="wc-grid wc-grid-four">
            {steps.map(
              ([number, Icon, title, description], i) => (
                <article
                  className="wc-card wc-step"
                  key={number}
                >
                  <span className="wc-step-number">
                    {number}
                  </span>

                  <span
                    className={`wc-icon wc-icon-${
                      [
                        "lavender",
                        "yellow",
                        "coral",
                        "green",
                      ][i]
                    }`}
                  >
                    <Icon size={23} />
                  </span>

                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* MESSAGE TYPES */}
      <section className="wc-section">
        <div className="wc-container">
          <Heading
            label="FOUR KINDS OF MESSAGE"
            title="Choose a format."
            accent="Make it yours."
            description="From a quick note to an approved WhatsApp template, use the format that fits your campaign."
          />

          <div className="wc-grid wc-grid-four">
            {kinds.map((item, i) => (
              <Card key={item[1]} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="wc-section wc-section-light">
        <div className="wc-container wc-split">
          <div>
            <Heading
              label="WHO GETS IT"
              title="Choose your people."
              accent="Not the whole world."
              description="You choose your audience, and Bellbee filters out customers who cannot receive the message."
            />

            <div className="wc-feature-list">
              {audiences.map(
                ([Icon, title, description], i) => (
                  <article
                    className="wc-feature-row"
                    key={title}
                  >
                    <span
                      className={`wc-icon wc-icon-${
                        [
                          "lavender",
                          "yellow",
                          "coral",
                          "green",
                        ][i]
                      }`}
                    >
                      <Icon size={20} />
                    </span>

                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>

          <div className="wc-audience-illustration">
            <div className="wc-illustration-head">
              <div>
                <strong>Campaign audience</strong>
                <small>
                  Illustrative customer selection
                </small>
              </div>

              <span>
                <Target size={17} />
                Targeted
              </span>
            </div>

            <div className="wc-illustration-stat">
              <Users size={21} />

              <div>
                <strong>Recent customers</strong>
                <small>
                  Last 7 days with a phone number
                </small>
              </div>

              <span>5</span>
            </div>

            <div className="wc-audience-person">
              <span>SC</span>
              <div>
                <strong>Sarah Carter</strong>
                <small>Messaged 3 hours ago</small>
              </div>
              <CheckCircle2 size={18} />
            </div>

            <div className="wc-audience-person">
              <span>JW</span>
              <div>
                <strong>James Wilson</strong>
                <small>Messaged 12 hours ago</small>
              </div>
              <CheckCircle2 size={18} />
            </div>

            <div className="wc-audience-person muted">
              <span>OB</span>
              <div>
                <strong>Olivia Brown</strong>
                <small>
                  Outside free-form message window
                </small>
              </div>
              <Clock3 size={18} />
            </div>

            <p className="wc-illustration-note">
              <ShieldCheck size={16} />
              Use an approved template to reach customers
              outside 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* SENDING AND RESULTS */}
      <section className="wc-section">
        <div className="wc-container">
          <Heading
            label="SENDING AND RESULTS"
            title="See what happened."
            accent="Stay in control."
            description="Track delivery outcomes and cancel a campaign while cancellation is still possible."
          />

          <div className="wc-grid wc-grid-four">
            {sending.map((item, i) => (
              <Card key={item[1]} item={item} index={i} />
            ))}
          </div>

          <div className="wc-progress-demo">
            <div>
              <strong>Example campaign progress</strong>
              <span>Not actual delivery data</span>
            </div>

            <div className="wc-progress-track">
              <span />
            </div>

            <div className="wc-progress-stats">
              <span>
                <CheckCheck size={16} />
                Sent 82
              </span>

              <span>
                <XCircle size={16} />
                Not delivered 8
              </span>

              <span>
                <Users size={16} />
                90 total
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES AND META RULES */}
      <section className="wc-section wc-section-light">
        <div className="wc-container">
          <Heading
            label="TEMPLATES & META RULES"
            title="Message with confidence."
            accent="Follow WhatsApp's rules."
            description="Understand when an approved template is required and what templates can include."
          />

          <div className="wc-grid wc-grid-three">
            {rules.map((item, i) => (
              <Card key={item[1]} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="wc-section">
        <div className="wc-container">
          <Heading
            label="BEFORE YOU START"
            title="Simple requirements."
            accent="Clear limits."
          />

          <div className="wc-grid wc-grid-two">
            <article className="wc-info-card">
              <h3>
                <CheckCircle2 size={21} />
                What you need
              </h3>

              <ul>
                <li>A connected WhatsApp Business number.</li>
                <li>
                  A Meta-approved template for customers
                  outside the 24-hour reply window.
                </li>
                <li>
                  A computer to create campaigns and
                  templates; the phone app points you
                  to the web.
                </li>
              </ul>
            </article>

            <article className="wc-info-card wc-info-yellow">
              <h3>
                <ShieldCheck size={21} />
                What it does not do
              </h3>

              <ul>
                <li>
                  It cannot send campaigns on Instagram,
                  Messenger or website chat.
                </li>
                <li>
                  Every recipient gets the same message,
                  not individually customized text.
                </li>
                <li>
                  Once a message has been sent, it cannot
                  be recalled.
                </li>
              </ul>
            </article>
          </div>

          <p className="wc-center-note">
            <Users size={17} />
            Your team can take over any chat from the
            Bellbee inbox.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="wc-section wc-section-light">
        <div className="wc-container wc-faq-container">
          <Heading
            label="FREQUENTLY ASKED QUESTIONS"
            title="Questions about"
            accent="WhatsApp campaigns?"
            center
          />

          <FAQ />
        </div>
      </section>

      {/* RELATED PAGES */}
      <section className="wc-section">
        <div className="wc-container">
          <Heading
            label="EXPLORE MORE"
            title="More ways to connect."
            accent="With customers."
          />

          <div className="wc-grid wc-grid-three">
            {related.map(
              ([Icon, title, description, to], index) => (
                <Link
                  to={to}
                  className="wc-card wc-related"
                  key={to}
                >
                  <span
                    className={`wc-icon wc-icon-${
                      [
                        "lavender",
                        "yellow",
                        "coral",
                      ][index]
                    }`}
                  >
                    <Icon size={23} />
                  </span>

                  <ArrowUpRight
                    className="wc-related-arrow"
                    size={20}
                  />

                  <h3>{title}</h3>
                  <p>{description}</p>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* COMPACT CTA */}
      <section className="wc-cta-section">
        <div className="wc-container">
          <div className="wc-cta">
            <span
              className="wc-blob wc-cta-lavender"
              aria-hidden="true"
            />

            <span
              className="wc-blob wc-cta-yellow"
              aria-hidden="true"
            />

            <div className="wc-cta-content">
              <span className="wc-cta-kicker">
                <Sparkles size={15} />
                REACH THE PEOPLE WHO MATTER
              </span>

              <h2>
                One message.{" "}
                <em>More conversations.</em>
              </h2>

              <p>
                Keep customers up to date with WhatsApp
                campaigns built around your business.
              </p>

              <Link
                className="wc-btn wc-btn-coral"
                to="/signup"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <small>
                No credit card required to start.
              </small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
