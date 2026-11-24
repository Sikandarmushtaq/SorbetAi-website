
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  CalendarCheck,
  Check,
  CheckCircle2,
//   Clock3,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Zap,
} from "lucide-react";

// ORIGINAL LANDING PAGE COMPONENT
import HowItWorks from "../../components/landing/HowItWorks";

// ORIGINAL WEBSITE FOOTER
import Footer from "../../components/Footer";

import "./HowItWorksPage.css";

gsap.registerPlugin(useGSAP);

const checklistImage =
  "https://bellbee.ai/assets/setup-checklist-DH62OISr.webp";

const overviewHighlights = [
  {
    Icon: Brain,
    title: "Teach your AI",
    description:
      "Add your business details, services, FAQs and policies.",
    color: "lavender",
  },
  {
    Icon: Smartphone,
    title: "Connect a channel",
    description:
      "Bring customer conversations into one connected inbox.",
    color: "yellow",
  },
  {
    Icon: MessageCircle,
    title: "Test and go live",
    description:
      "Try your AI with example questions before customers use it.",
    color: "coral",
  },
];

function HeroConversation() {
  return (
    <div
      className="hw-chat-window"
      aria-label="Example automated customer conversation"
    >
      <div className="hw-chat-header">
        <div className="hw-chat-avatar">
          <Bot size={23} />
        </div>

        <div className="hw-chat-business">
          <strong>Your AI assistant</strong>
          <span>
            <i />
            Example conversation
          </span>
        </div>

        <span className="hw-chat-header-icon">
          <Sparkles size={19} />
        </span>
      </div>

      <div className="hw-chat-body">
        <div className="hw-chat-day">
          A preview of what's possible
        </div>

        <div className="hw-message hw-message-customer">
          Hi! Is the canvas tote bag available?
        </div>

        <div className="hw-message hw-message-ai">
          <span className="hw-message-bot">
            <Bot size={15} />
          </span>

          <div>
            Yes! It's listed in our catalog.
            Would you like to order one?
          </div>
        </div>

        <div className="hw-message hw-message-customer">
          Yes, just one please!
        </div>

        <div className="hw-order-preview">
          <div className="hw-order-top">
            <span className="hw-order-symbol">
              <PackageCheck size={19} />
            </span>

            <div>
              <strong>New order request</strong>
              <small>Example dashboard preview</small>
            </div>

            <span className="hw-order-status">
              <Check size={13} />
              Captured
            </span>
          </div>

          <div className="hw-order-product">
            <span className="hw-product-art">
              <svg
                width="33"
                height="39"
                viewBox="0 0 33 39"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 11H26L29 35H4L7 11Z"
                  fill="#F4C95D"
                  stroke="#10372A"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 13V8C12 2 21 2 21 8V13"
                  stroke="#10372A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M13 23H20"
                  stroke="#10372A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <div className="hw-order-product-info">
              <strong>Canvas tote bag</strong>
              <small>Quantity: 1</small>
            </div>

            <CheckCircle2 size={20} />
          </div>

          <div className="hw-order-bottom">
            <span>Ready for team review</span>
            <span>
              <Check size={14} />
              Saved in dashboard
            </span>
          </div>
        </div>

        <div className="hw-demo-disclaimer">
          Sample conversation only. No real order placed.
        </div>
      </div>

      <div className="hw-chat-input">
        <span>Message your business...</span>
        <span className="hw-chat-send">
          <ArrowUpRight size={17} />
        </span>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <section className="hw-overview" id="hw-overview">
      <div className="hw-container">
        <div className="hw-overview-grid">
          <div className="hw-overview-copy">
            <span className="hw-kicker">
              <span className="hw-kicker-dot" />
              THE OVERVIEW
            </span>

            <h2>
              Designed so anyone can{" "}
              <em>set it up.</em>
            </h2>

            <p className="hw-overview-lead">
              No technical skills needed. Start with
              your business information, connect your
              channels, and test the replies your
              customers will see.
            </p>

            <p className="hw-overview-description">
              Every Bellbee Ai account has a
              getting-started checklist. It guides you
              through the important parts of your
              setup, in plain language, so you know
              what's next and what you've already
              completed.
            </p>

            <div className="hw-overview-points">
              <div>
                <span><Check size={16} /></span>
                <p>
                  <strong>Your own business knowledge</strong>
                  Add services, opening hours, prices
                  and frequently asked questions.
                </p>
              </div>

              <div>
                <span><Check size={16} /></span>
                <p>
                  <strong>Guided channel connection</strong>
                  Connect the messaging channels your
                  customers already use.
                </p>
              </div>

              <div>
                <span><Check size={16} /></span>
                <p>
                  <strong>Test before going live</strong>
                  Review example AI replies and
                  adjust your instructions.
                </p>
              </div>
            </div>

            <a
              href="#how-it-works"
              className="hw-overview-link"
            >
              Explore the setup steps
              <ArrowUpRight size={19} />
            </a>
          </div>

          <div className="hw-overview-visual">
            <div
              className="hw-overview-blob hw-overview-blob-lavender"
              aria-hidden="true"
            />

            <div
              className="hw-overview-blob hw-overview-blob-yellow"
              aria-hidden="true"
            />

            <div className="hw-checklist-card">
              <div className="hw-checklist-card-top">
                <span>
                  <CheckCircle2 size={17} />
                  GETTING STARTED
                </span>

                <span className="hw-checklist-tag">
                  Your checklist
                </span>
              </div>

              <img
                src={checklistImage}
                alt="Bellbee Ai getting-started checklist showing completed and remaining setup tasks"
                loading="lazy"
                decoding="async"
              />

              <div className="hw-checklist-card-bottom">
                <span>
                  <CheckCircle2 size={16} />
                  Follow your progress
                </span>

                <span>
                  <Sparkles size={15} />
                  One step at a time
                </span>
              </div>
            </div>

            <span className="hw-overview-float hw-overview-float-top">
              <Zap size={16} />
              No coding required
            </span>

            <span className="hw-overview-float hw-overview-float-bottom">
              <ShieldCheck size={16} />
              Your team stays in control
            </span>
          </div>
        </div>

        <div className="hw-overview-highlights">
          {overviewHighlights.map(
            ({ Icon, title, description, color }) => (
              <article
                className="hw-overview-highlight"
                key={title}
              >
                <span
                  className={`hw-highlight-icon hw-highlight-${color}`}
                >
                  <Icon size={22} />
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
    </section>
  );
}

function CompactCTA() {
  return (
    <section className="hw-cta-section">
      <div className="hw-container">
        <div className="hw-cta">
          <span
            className="hw-cta-blob"
            aria-hidden="true"
          />

          <div className="hw-cta-content">
            <span className="hw-cta-eyebrow">
              <Sparkles size={16} />
              START WITH FREE CREDIT
            </span>

            <h2>
              Stop losing customers{" "}
              <em>to slow replies.</em>
            </h2>

            <p>
              Start using Bellbee Ai with free
              credit. No credit card required.
              Answer your customers on WhatsApp,
              Instagram and Messenger around
              the clock.
            </p>
          </div>

          <Link to="/signup" className="hw-cta-button">
            Start with free credit
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
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

      gsap.from(".hw-hero-reveal", {
        opacity: 0,
        y: 28,
        duration: 0.85,
        stagger: 0.12,
        ease: "power3.out",
        clearProps: "all",
      });

      gsap.from(".hw-chat-window", {
        opacity: 0,
        y: 35,
        scale: 0.96,
        duration: 1,
        delay: 0.18,
        ease: "power3.out",
        clearProps: "all",
      });

      gsap.to(".hw-hero-blob", {
        rotation: 360,
        duration: 55,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".hw-hero-float", {
        y: -9,
        duration: 3,
        repeat: -1,
        yoyo: true,
        stagger: 0.5,
        ease: "sine.inOut",
      });
    },
    { scope: pageRef }
  );

  return (
    <>
      <main className="hw-page" ref={pageRef}>
        {/* ==============================
            NEW HERO SECTION
        ============================== */}
        <section className="hw-hero">
          <span
            className="hw-hero-blob hw-hero-blob-lavender"
            aria-hidden="true"
          />

          <span
            className="hw-hero-blob hw-hero-blob-yellow"
            aria-hidden="true"
          />

          <div className="hw-container hw-hero-grid">
            <div className="hw-hero-copy">
              <span className="hw-hero-badge hw-hero-reveal">
                <Sparkles size={17} />
                HOW IT WORKS
              </span>

              <h1 className="hw-hero-reveal">
                From your first channel to{" "}
                <em>your first automated sale.</em>
              </h1>

              <p className="hw-hero-description hw-hero-reveal">
                A simple walkthrough of how Bellbee
                Ai fits your business. Set up your
                AI Brain, connect WhatsApp, teach
                your assistant about your products,
                and start handling customer
                conversations.
              </p>

              <div className="hw-hero-actions hw-hero-reveal">
                <a
                  href="#how-it-works"
                  className="hw-button hw-button-primary"
                >
                  See the steps
                  <ArrowRight size={18} />
                </a>

                <Link
                  to="/signup"
                  className="hw-button hw-button-outline"
                >
                  Start with free credit
                </Link>
              </div>

              <div className="hw-hero-trust hw-hero-reveal">
                <span>
                  <CheckCircle2 size={17} />
                  No technical skills needed
                </span>

                <span>
                  <CheckCircle2 size={17} />
                  Built around your business
                </span>

                <span>
                  <CheckCircle2 size={17} />
                  Human handoff available
                </span>
              </div>
            </div>

            <div className="hw-hero-visual">
              <span className="hw-hero-float hw-hero-float-top">
                <Sparkles size={16} />
                Your AI, your business
              </span>

              <HeroConversation />

              <span className="hw-hero-float hw-hero-float-bottom">
                <CalendarCheck size={16} />
                Manage chats in one place
              </span>
            </div>
          </div>
        </section>

        {/* ==============================
            NEW OVERVIEW SECTION
        ============================== */}
        <Overview />

        {/* ==============================
            REUSE EXISTING LANDING COMPONENT
            NO DUPLICATE STEP CONTENT
        ============================== */}
        <div className="hw-existing-component">
          <HowItWorks />
        </div>

        {/* ==============================
            COMPACT FINAL CTA
        ============================== */}
        <CompactCTA />
      </main>

      <Footer />
    </>
  );
}
