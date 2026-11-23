
import { Link } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import WebsiteChatPreview from "./WebsiteChatPreview";

export default function WebsiteChatHero() {
  return (
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

        <div className="wc-hero-content">
          <span className="wc-eyebrow wc-hero-reveal">
            <Globe2 size={17} />
            WEBSITE CHAT
          </span>

          <h1 className="wc-hero-title wc-hero-reveal">
            Add an <em>AI chat</em> to your website.
          </h1>

          <p className="wc-hero-description wc-hero-reveal">
            Turn website visits into helpful conversations.
            Add a chat window powered by the same AI
            knowledge that answers your WhatsApp customers.
          </p>

          <p className="wc-hero-description wc-hero-reveal">
            Install it with one piece of code, answer
            questions at any hour, collect visitor
            details and let your team take over.
          </p>

          <div className="wc-hero-actions wc-hero-reveal">
            <Link
              to="/signup"
              className="wc-btn wc-btn-coral"
            >
              <Sparkles size={17} />
              Start using free
              <ArrowRight size={17} />
            </Link>

            <a
              href="#wc-how-it-works"
              className="wc-btn wc-btn-outline"
            >
              How it works
            </a>
          </div>

          <div className="wc-hero-highlights wc-hero-reveal">
            <span>
              <CheckCircle2 size={15} />
              One simple embed
            </span>

            <span>
              <CheckCircle2 size={15} />
              Collect leads
            </span>

            <span>
              <ShieldCheck size={15} />
              Control your websites
            </span>
          </div>
        </div>

        <div className="wc-hero-visual wc-hero-reveal">
          <div className="wc-floating-label wc-float-top">
            <span className="wc-live-dot" />
            AI answers visitors
          </div>

          <WebsiteChatPreview />

          <div className="wc-floating-label wc-float-bottom">
            <Sparkles size={16} />
            Your website, your colours
          </div>
        </div>
      </div>
    </section>
  );
}
