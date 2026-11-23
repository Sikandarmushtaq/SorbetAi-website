
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

import WhatsAppInboxPreview from './WhatsAppInboxPreview';

export default function WhatsAppHero() {
  return (
    <section className="wa-hero" id="wa-top">
      <div
        className="wa-blob wa-blob-lavender"
        aria-hidden="true"
      />
      <div
        className="wa-blob wa-blob-yellow"
        aria-hidden="true"
      />

      <div className="wa-container wa-hero-layout">
        <div className="wa-hero-copy">
          <div className="wa-eyebrow wa-hero-reveal">
            <FaWhatsapp size={17} />
            WHATSAPP AI AGENT
          </div>

          <h1 className="wa-hero-title wa-hero-reveal">
            An AI agent for your{' '}
            <em>WhatsApp</em> Business number.
          </h1>

          <p className="wa-hero-description wa-hero-reveal">
            Connect your WhatsApp Business number through
            Meta's official Cloud API. Answer customer
            questions, take orders, book appointments,
            and hand over to your team when needed.
          </p>

          <div className="wa-hero-actions wa-hero-reveal">
            <Link
              to="/signup"
              className="wa-btn wa-btn-coral"
            >
              <Sparkles size={17} />
              Start using free
              <ArrowRight size={17} />
            </Link>

            <a
              href="#wa-how-it-works"
              className="wa-btn wa-btn-outline"
            >
              See how it works
            </a>
          </div>

          <div className="wa-hero-proof wa-hero-reveal">
            <span>
              <CheckCircle2 size={16} />
              Your business knowledge
            </span>

            <span>
              <CheckCircle2 size={16} />
              Human handoff
            </span>

            <span>
              <ShieldCheck size={16} />
              Official Meta API
            </span>
          </div>
        </div>

        <div className="wa-hero-visual wa-hero-reveal">
          <span className="wa-floating-tag wa-tag-top">
            <FaWhatsapp size={17} />
            WhatsApp connected
          </span>

          <WhatsAppInboxPreview />

          <span className="wa-floating-tag wa-tag-bottom">
            <span className="wa-small-pulse" />
            AI replying instantly
          </span>
        </div>
      </div>
    </section>
  );
}
