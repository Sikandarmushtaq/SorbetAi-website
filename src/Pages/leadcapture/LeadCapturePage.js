
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, ArrowUpRight, BellRing, BookOpen, Bot, Camera,
  Check, CheckCircle2, ChevronDown, ClipboardList,
  FileQuestion, Globe2, Headphones, ImagePlus, LayoutDashboard,
  MessageCircle, MessageSquareText, Phone, RotateCcw, ShieldCheck,
  Sparkles, Users, Zap,
} from "lucide-react";
import "./LeadCapturePage.css";

gsap.registerPlugin(useGSAP);

const enquiryTypes = [
  {
    value: "Quote request",
    prompt: "What would you like a quote for?",
  },
  {
    value: "Callback request",
    prompt: "What should our team call you about?",
  },
  {
    value: "Photo estimate",
    prompt: "Tell us what the photo should help us estimate.",
  },
];

const stages = ["New", "In progress", "Contacted", "Won", "Lost"];

const benefits = [
  [
    ClipboardList,
    "Define your enquiry types",
    "Set up to 20 request types, each with up to 15 details to collect.",
  ],
  [
    MessageCircle,
    "AI asks what's missing",
    "The AI collects only the missing details, across as many messages as needed.",
  ],
  [
    Camera,
    "Photos count as details",
    "A customer photo can be one of the pieces of information collected.",
  ],
  [
    BellRing,
    "Know when a lead is ready",
    "A New lead alert arrives once all required details are collected.",
  ],
  [
    LayoutDashboard,
    "Follow up on one board",
    "Use New, In progress, Contacted, Won and Lost, with private notes.",
  ],
];

const process = [
  [
    "01",
    ClipboardList,
    "Choose what to collect",
    "Define a quote, callback or another type of request and its required details.",
  ],
  [
    "02",
    Bot,
    "AI collects the details",
    "It asks follow-up questions and uses the phone number available from the chat.",
  ],
  [
    "03",
    BellRing,
    "Your team gets the lead",
    "After the required details are in, your team receives a New lead alert.",
  ],
  [
    "04",
    CheckCircle2,
    "Follow up your way",
    "Move the lead through its stages and keep a private note for your team.",
  ],
];

const controlItems = [
  [
    BookOpen,
    "See what your AI knows",
    "Review, edit and delete saved knowledge from the What AI Knows screen.",
  ],
  [
    FileQuestion,
    "Answer once",
    "Turn unanswered customer questions into saved FAQs.",
  ],
  [
    Headphones,
    "Human handoff",
    "Your team can take over when a customer asks for a person or AI cannot resolve a question.",
  ],
  [
    LayoutDashboard,
    "Analytics",
    "View chats, AI replies and results inside Bellbee.",
  ],
];

const questions = [
  [
    "What is lead capture in Bellbee?",
    "For enquiries that are not orders or bookings, such as quotes or callbacks, Bellbee AI gathers the details your team needs to follow up.",
  ],
  [
    "How many request types can I create?",
    "You can define up to 20 kinds of enquiry, with up to 15 details for each type.",
  ],
  [
    "Will the AI ask the same question twice?",
    "It is designed to ask only for the details still missing, even when the conversation takes several messages.",
  ],
  [
    "Can a customer send a photo?",
    "Yes. A photo can count as a collected detail when it is relevant to your enquiry type.",
  ],
  [
    "When does my team get a lead alert?",
    "You receive a New lead alert after all required details have been collected. Your AI also explains the next steps to the customer using your wording.",
  ],
  [
    "How can I organize leads?",
    "Use the follow-up board to move leads between New, In progress, Contacted, Won and Lost, and add a private note.",
  ],
  [
    "What if my AI cannot answer?",
    "The AI can hand the conversation to your team, or you can step into any chat from the Bellbee inbox.",
  ],
];

const related = [
  [
    Sparkles,
    "AI Assistant",
    "Set up your AI by talking to it and approving changes.",
    "/ai-assistant",
  ],
  [
    Globe2,
    "Channels",
    "Bring customer conversations together in one inbox.",
    "/omnichannel-messaging",
  ],
  [
    MessageCircle,
    "Orders in chat",
    "Take catalog orders directly inside connected chats.",
    "/orders-in-chat",
  ],
];

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  centered = false,
}) {
  return (
    <div
      className={`lc-heading ${
        centered ? "lc-heading-centered" : ""
      }`}
    >
      <span className="lc-kicker">{eyebrow}</span>

      <h2>
        {title} {accent && <em>{accent}</em>}
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureCard({ item, index = 0 }) {
  const [Icon, title, description] = item;

  const colors = [
    "lavender",
    "yellow",
    "coral",
    "green",
    "lavender",
  ];

  return (
    <article className="lc-card">
      <span
        className={`lc-icon lc-icon-${
          colors[index % colors.length]
        }`}
      >
        <Icon size={23} />
      </span>

      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function LeadCaptureDemo({
  lead,
  setLead,
  stage,
  setStage,
}) {
  const [type, setType] = useState(
    enquiryTypes[0].value
  );
  const [customer, setCustomer] = useState("");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState(false);
  const [error, setError] = useState("");

  const currentType =
    enquiryTypes.find((item) => item.value === type) ||
    enquiryTypes[0];

  const missing = [
    !customer.trim() && "customer name",
    !details.trim() && "request details",
  ].filter(Boolean);

  function submit(event) {
    event.preventDefault();

    if (missing.length) {
      setError(
        `Please add ${missing.join(" and ")}.`
      );
      return;
    }

    setLead({
      type,
      customer: customer.trim(),
      details: details.trim(),
      photo,
      phone: "From connected chat (demo)",
    });

    setStage("New");
    setError("");
  }

  function reset() {
    setLead(null);
    setStage("New");
    setCustomer("");
    setDetails("");
    setPhoto(false);
    setError("");
  }

  return (
    <div className="lc-demo">
      <header className="lc-demo-header">
        <div className="lc-demo-brand">
          <span>
            <Bot size={19} />
          </span>

          <div>
            <strong>Bellbee AI</strong>
            <small>Lead capture preview</small>
          </div>
        </div>

        <span className="lc-demo-pill">
          <i /> DEMO
        </span>
      </header>

      <div className="lc-demo-chat">
        <div className="lc-chat-customer">
          Hi, can someone give me a quote?
        </div>

        <div className="lc-chat-ai">
          <span>
            <Sparkles size={13} />
            Bellbee AI
          </span>

          Of course! I'll collect a few details
          so our team can follow up with you.
        </div>
      </div>

      {lead ? (
        <div
          className="lc-demo-complete"
          role="status"
        >
          <span className="lc-complete-icon">
            <CheckCircle2 size={23} />
          </span>

          <h3>New lead captured!</h3>

          <p>
            All required demo details are
            collected. Your team can follow up.
          </p>

          <div className="lc-complete-row">
            <BellRing size={16} />
            <strong>New lead</strong>
            <span>{stage}</span>
          </div>

          <button
            type="button"
            className="lc-demo-submit"
            onClick={reset}
          >
            <RotateCcw size={16} />
            Try another enquiry
          </button>
        </div>
      ) : (
        <form
          className="lc-demo-form"
          onSubmit={submit}
          noValidate
        >
          <div className="lc-demo-form-heading">
            <strong>Collect enquiry details</strong>
            <small>
              {missing.length
                ? `${missing.length} required fields remaining`
                : "Ready to create a demo lead"}
            </small>
          </div>

          <label>
            Enquiry type

            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setError("");
              }}
            >
              {enquiryTypes.map((item) => (
                <option key={item.value}>
                  {item.value}
                </option>
              ))}
            </select>
          </label>

          <label>
            Customer name
            <span className="lc-required">
              Required
            </span>

            <input
              value={customer}
              onChange={(event) => {
                setCustomer(event.target.value);
                setError("");
              }}
              placeholder="Enter a sample name"
              maxLength={60}
            />
          </label>

          <label>
            {currentType.prompt}

            <span className="lc-required">
              Required
            </span>

            <textarea
              value={details}
              onChange={(event) => {
                setDetails(event.target.value);
                setError("");
              }}
              placeholder="Describe the enquiry..."
              rows={2}
              maxLength={300}
            />
          </label>

          <div className="lc-demo-phone">
            <Phone size={16} />

            <div>
              <strong>Phone number</strong>
              <small>
                Already available from the chat
                in a real enquiry
              </small>
            </div>

            <Check size={17} />
          </div>

          <button
            type="button"
            className={`lc-photo-button ${
              photo ? "selected" : ""
            }`}
            onClick={() =>
              setPhoto((value) => !value)
            }
            aria-pressed={photo}
          >
            {photo ? (
              <CheckCircle2 size={17} />
            ) : (
              <ImagePlus size={17} />
            )}

            {photo
              ? "Example photo added"
              : "Add example photo detail"}

            <span>Demo</span>
          </button>

          {error && (
            <p className="lc-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="lc-demo-submit"
          >
            Complete sample lead
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      <footer className="lc-demo-footer">
        <ShieldCheck size={15} />
        Interactive demo — no real lead or
        notification is created
      </footer>
    </div>
  );
}

function LeadBoard({
  lead,
  stage,
  setStage,
}) {
  const [note, setNote] = useState("");

  return (
    <div className="lc-board">
      <header className="lc-board-header">
        <div>
          <span className="lc-board-logo">
            <ClipboardList size={20} />
          </span>

          <div>
            <strong>Leads</strong>
            <small>Example follow-up board</small>
          </div>
        </div>

        <span className="lc-board-demo">
          DEMO
        </span>
      </header>

      <div
        className="lc-board-stages"
        role="group"
        aria-label="Lead pipeline stages"
      >
        {stages.map((name) => (
          <button
            key={name}
            type="button"
            className={
              stage === name && lead
                ? "active"
                : ""
            }
            aria-pressed={
              stage === name && Boolean(lead)
            }
            onClick={() =>
              lead && setStage(name)
            }
            disabled={!lead}
          >
            <span>{name}</span>

            <strong>
              {lead && stage === name ? 1 : 0}
            </strong>
          </button>
        ))}
      </div>

      <div className="lc-board-body">
        {lead ? (
          <article className="lc-lead-ticket">
            <div className="lc-ticket-top">
              <span>
                <MessageCircle size={15} />
                {lead.type}
              </span>

              <strong>{stage}</strong>
            </div>

            <h3>{lead.customer}</h3>
            <p>{lead.details}</p>

            <div className="lc-ticket-detail">
              <CheckCircle2 size={15} />
              Customer name collected
            </div>

            <div className="lc-ticket-detail">
              <CheckCircle2 size={15} />
              Phone number from chat
            </div>

            {lead.photo && (
              <div className="lc-ticket-detail">
                <Camera size={15} />
                Example photo detail attached
              </div>
            )}

            <label className="lc-note-label">
              Private team note

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                rows={2}
                placeholder="Add a sample follow-up note..."
                maxLength={250}
              />
            </label>

            <div className="lc-ticket-actions">
              <span>
                <CheckCircle2 size={15} />
                Ready for follow-up
              </span>

              <small>
                Saved only in this preview
              </small>
            </div>
          </article>
        ) : (
          <div className="lc-board-empty">
            <span>
              <ClipboardList size={31} />
            </span>

            <h3>
              Your new lead will appear here
            </h3>

            <p>
              Complete the enquiry form in the
              hero to preview a lead moving
              through this board.
            </p>
          </div>
        )}
      </div>

      <footer>
        Move your sample lead through New,
        In progress, Contacted, Won or Lost.
      </footer>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div className="lc-faq-list">
      {questions.map(
        ([question, answer], index) => (
          <article
            className={`lc-faq-item ${
              open === index ? "open" : ""
            }`}
            key={question}
          >
            <button
              type="button"
              aria-expanded={open === index}
              aria-controls={`lc-faq-${index}`}
              onClick={() =>
                setOpen(
                  open === index ? -1 : index
                )
              }
            >
              <span>{question}</span>
              <ChevronDown size={20} />
            </button>

            <div
              id={`lc-faq-${index}`}
              hidden={open !== index}
            >
              <p>{answer}</p>
            </div>
          </article>
        )
      )}
    </div>
  );
}

export default function LeadCapturePage() {
  const pageRef = useRef(null);

  const [lead, setLead] = useState(null);
  const [stage, setStage] = useState("New");

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

      gsap.to(".lc-blob", {
        rotation: 360,
        duration: 52,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".lc-blob", {
        x: 16,
        y: -14,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.8,
      });

      gsap.to(".lc-float", {
        y: -9,
        duration: 2.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="lc-page" ref={pageRef}>
      {/* HERO */}
      <section className="lc-hero">
        <span
          className="lc-blob lc-blob-lavender"
          aria-hidden="true"
        />

        <span
          className="lc-blob lc-blob-yellow"
          aria-hidden="true"
        />

        <div className="lc-container lc-hero-grid">
          <div className="lc-hero-copy">
            <span className="lc-hero-label">
              <MessageSquareText size={16} />
              LEAD CAPTURE
            </span>

            <h1>
              Turn customer questions into{" "}
              <em>leads you can follow up.</em>
            </h1>

            <p>
              For quotes, callbacks and other
              enquiries that aren't orders or
              bookings, Bellbee AI gathers the
              details your team needs and lets
              you know when a lead is ready.
            </p>

            <div className="lc-hero-actions">
              <Link
                to="/signup"
                className="lc-btn lc-btn-coral"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <a
                href="#lc-how"
                className="lc-btn lc-btn-outline"
              >
                See how it works
              </a>
            </div>

            <div className="lc-trust">
              <span>
                <CheckCircle2 size={16} />
                Custom enquiry types
              </span>

              <span>
                <CheckCircle2 size={16} />
                Clear team follow-up
              </span>
            </div>
          </div>

          <div className="lc-hero-visual">
            <span className="lc-float lc-float-top">
              <Sparkles size={16} />
              AI collects missing details
            </span>

            <LeadCaptureDemo
              lead={lead}
              setLead={setLead}
              stage={stage}
              setStage={setStage}
            />

            <span className="lc-float lc-float-bottom">
              <BellRing size={16} />
              New lead, ready to follow up
            </span>
          </div>
        </div>
      </section>

      {/* ENQUIRIES */}
      <section className="lc-section">
        <div className="lc-container">
          <SectionHeading
            eyebrow="ENQUIRIES THAT NEED FOLLOW-UP"
            title="The right details."
            accent="Ready for your team."
            description="Define exactly what you want your AI to collect before your team follows up."
          />

          <div className="lc-grid lc-grid-benefits">
            {benefits.map((item, index) => (
              <FeatureCard
                key={item[1]}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="lc-section lc-section-light"
        id="lc-how"
      >
        <div className="lc-container">
          <SectionHeading
            eyebrow="HOW IT WORKS"
            title="From first question."
            accent="To a useful lead."
            description="Your AI can gather the information while your team gets on with their day."
          />

          <div className="lc-grid lc-grid-four">
            {process.map(
              (
                [number, Icon, title, description],
                index
              ) => (
                <article
                  className="lc-card lc-step"
                  key={number}
                >
                  <span className="lc-step-number">
                    {number}
                  </span>

                  <span
                    className={`lc-icon lc-icon-${
                      [
                        "lavender",
                        "yellow",
                        "coral",
                        "green",
                      ][index]
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

      {/* LEADS BOARD */}
      <section className="lc-section">
        <div className="lc-container lc-two-column">
          <div>
            <SectionHeading
              eyebrow="ONE BOARD TO FOLLOW UP"
              title="See every lead."
              accent="Know what happens next."
              description="Keep enquiries organized from New all the way to Won or Lost. Each lead can have a private note for your team."
            />

            <div className="lc-board-points">
              <div>
                <span className="lc-icon lc-icon-lavender">
                  <ClipboardList size={20} />
                </span>

                <div>
                  <h3>Five clear stages</h3>
                  <p>
                    New, In progress, Contacted,
                    Won and Lost.
                  </p>
                </div>
              </div>

              <div>
                <span className="lc-icon lc-icon-yellow">
                  <BellRing size={20} />
                </span>

                <div>
                  <h3>New lead alert</h3>
                  <p>
                    Your team is told when the
                    required details are complete.
                  </p>
                </div>
              </div>

              <div>
                <span className="lc-icon lc-icon-coral">
                  <MessageSquareText size={20} />
                </span>

                <div>
                  <h3>Next steps in your words</h3>
                  <p>
                    Your AI tells the customer what
                    happens after the enquiry is
                    recorded.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <LeadBoard
            lead={lead}
            stage={stage}
            setStage={setStage}
          />
        </div>
      </section>

      {/* STAY IN CONTROL */}
      <section className="lc-section lc-section-light">
        <div className="lc-container">
          <SectionHeading
            eyebrow="STAY IN CONTROL"
            title="Your AI helps."
            accent="You decide."
            description="Manage knowledge, answer missed questions and step in whenever a person is needed."
          />

          <div className="lc-grid lc-grid-four">
            {controlItems.map((item, index) => (
              <FeatureCard
                item={item}
                index={index}
                key={item[1]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="lc-section">
        <div className="lc-container">
          <SectionHeading
            eyebrow="BEFORE YOU START"
            title="Simple requirements."
            accent="Clear limits."
          />

          <div className="lc-grid lc-grid-two">
            <article className="lc-info-card">
              <h3>
                <CheckCircle2 size={22} />
                What you need
              </h3>

              <ul>
                <li>
                  A Bellbee account on the web or Android.
                </li>
                <li>
                  One connected channel: WhatsApp,
                  Instagram, Messenger or website chat.
                </li>
                <li>
                  Your business information, added by
                  you or with the AI Assistant.
                </li>
              </ul>
            </article>

            <article className="lc-info-card lc-info-card-yellow">
              <h3>
                <ShieldCheck size={22} />
                What it does not do
              </h3>

              <ul>
                <li>
                  AI does not answer beyond the
                  business information you've provided.
                </li>
                <li>
                  Keep information current so
                  customer replies stay useful.
                </li>
                <li>
                  AI does not replace your team.
                  You can take over any chat.
                </li>
              </ul>
            </article>
          </div>

          <p className="lc-note">
            <Users size={17} />
            When a customer asks for a person or
            the AI cannot help, your team can
            take over.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="lc-section lc-section-light">
        <div className="lc-container lc-faq-container">
          <SectionHeading
            eyebrow="FREQUENTLY ASKED QUESTIONS"
            title="Questions about."
            accent="Lead capture?"
            centered
          />

          <FAQ />
        </div>
      </section>

      {/* RELATED */}
      <section className="lc-section">
        <div className="lc-container">
          <SectionHeading
            eyebrow="EXPLORE MORE"
            title="More ways Bellbee."
            accent="Helps your team."
          />

          <div className="lc-grid lc-grid-three">
            {related.map(
              (
                [Icon, title, description, to],
                index
              ) => (
                <Link
                  to={to}
                  className="lc-card lc-related"
                  key={to}
                >
                  <span
                    className={`lc-icon lc-icon-${
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
                    className="lc-related-arrow"
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
      <section className="lc-cta-section">
        <div className="lc-container">
          <div className="lc-cta">
            <span
              className="lc-blob lc-cta-blob-lavender"
              aria-hidden="true"
            />

            <span
              className="lc-blob lc-cta-blob-yellow"
              aria-hidden="true"
            />

            <div className="lc-cta-content">
              <span className="lc-cta-kicker">
                <Zap size={15} />
                NEVER MISS A CUSTOMER ENQUIRY
              </span>

              <h2>
                More useful leads.{" "}
                <em>Less back and forth.</em>
              </h2>

              <p>
                Let your AI collect the details
                so your team can focus on
                following up.
              </p>

              <Link
                to="/signup"
                className="lc-btn lc-btn-coral"
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
