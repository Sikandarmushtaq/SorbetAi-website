
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookMessenger,
} from "react-icons/fa";

import SocialInboxPreview from "./SocialInboxPreview";

export default function InstagramMessengerHero() {
  return (
    <section className="im-hero">
      <div
        className="im-blob im-blob-lavender"
        aria-hidden="true"
      />
      <div
        className="im-blob im-blob-yellow"
        aria-hidden="true"
      />

      <div className="im-container im-hero-grid">
        <div className="im-hero-content">
          <div className="im-eyebrow im-hero-reveal">
            <FaInstagram size={17} />
            <FaFacebookMessenger size={17} />
            INSTAGRAM & MESSENGER
          </div>

          <h1 className="im-hero-title im-hero-reveal">
            An AI agent for your{" "}
            <em>Instagram</em> and Messenger chats.
          </h1>

          <p className="im-hero-description im-hero-reveal">
            Connect your Facebook Page and Instagram
            Professional account to one helpful AI
            assistant. Answer messages, manage comments
            and bring conversations together in one
            shared inbox.
          </p>

          <p className="im-hero-description im-hero-reveal">
            Your team can step in whenever a human
            is needed. Instagram and Facebook
            integrations are available as a plan add-on.
          </p>

          <div className="im-hero-buttons im-hero-reveal">
            <Link
              to="/signup"
              className="im-btn im-btn-primary"
            >
              <Sparkles size={17} />
              Start using free
              <ArrowRight size={17} />
            </Link>

            <a
              href="#im-how-it-works"
              className="im-btn im-btn-outline"
            >
              How it works
            </a>
          </div>

          <div className="im-hero-trust im-hero-reveal">
            <span>
              <CheckCircle2 size={15} />
              One shared inbox
            </span>

            <span>
              <CheckCircle2 size={15} />
              Human handoff
            </span>

            <span>
              <CheckCircle2 size={15} />
              Official Meta APIs
            </span>
          </div>
        </div>

        <div className="im-hero-visual im-hero-reveal">
          <span className="im-float im-float-instagram">
            <FaInstagram size={17} />
            Instagram DM
          </span>

          <SocialInboxPreview />

          <span className="im-float im-float-messenger">
            <FaFacebookMessenger size={17} />
            Messenger
          </span>
        </div>
      </div>
    </section>
  );
}
