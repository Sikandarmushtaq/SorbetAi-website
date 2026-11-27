
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Compass,
  Home,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import "./NotFoundPage.css";

const destinations = [
  {
    title: "Home",
    subtitle: "Back to the beginning",
    to: "/",
    Icon: Home,
    theme: "coral",
  },
  {
    title: "How It Works",
    subtitle: "See how everything connects",
    to: "/how-it-works",
    Icon: Compass,
    theme: "lavender",
  },
  {
    title: "Blogs",
    subtitle: "Explore our latest guides",
    to: "/blog",
    Icon: BookOpenText,
    theme: "yellow",
  },
  {
    title: "Contact",
    subtitle: "Get help from our team",
    to: "/contact",
    Icon: Mail,
    theme: "green",
  },
];

export default function NotFoundPage() {
  return (
    <main className="bb404-page">
      {/* Background blobs: contained inside page */}

      <div className="bb404-background" aria-hidden="true">
        <span className="bb404-blob bb404-blob-one" />
        <span className="bb404-blob bb404-blob-two" />
        <span className="bb404-blob bb404-blob-three" />
        <span className="bb404-background-dot bb404-dot-one" />
        <span className="bb404-background-dot bb404-dot-two" />
      </div>

      <div className="bb404-container">
        <section className="bb404-hero">
          {/* LEFT CONTENT */}

          <div className="bb404-copy">
            <div className="bb404-eyebrow">
              <Sparkles size={17} />
              <span>LOOKS LIKE WE TOOK A WRONG TURN</span>
            </div>

            <div className="bb404-error-label">
              <span className="bb404-pulse-dot" />
              ERROR 404
            </div>

            <h1>
              Oops, this page
              <span> got a little </span>
              <em>lost.</em>
            </h1>

            <p className="bb404-description">
              Even great conversations sometimes take
              a wrong turn. The page you're looking
              for might have moved, changed its name,
              or no longer exists.
            </p>

            <p className="bb404-help-text">
              No worries. We'll help you find
              your way back.
            </p>

            <div className="bb404-actions">
              <Link
                to="/"
                className="bb404-primary-button"
              >
                <Home size={18} />
                Back to Home
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/how-it-works"
                className="bb404-secondary-button"
              >
                How It Works
                <ArrowUpRight size={18} />
              </Link>
            </div>

            <div className="bb404-support-note">
              <span className="bb404-support-icon">
                <MessageCircle size={18} />
              </span>

              <div>
                <strong>Need a little help?</strong>

                <span>
                  Our team is just one message away.
                </span>
              </div>

              <Link
                to="/contact"
                aria-label="Contact our team"
              >
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>

          {/* RIGHT PREMIUM 404 ILLUSTRATION */}

          <div className="bb404-art" aria-hidden="true">
            <div className="bb404-art-surface">
              <span className="bb404-art-shape bb404-art-shape-one" />
              <span className="bb404-art-shape bb404-art-shape-two" />

              <div className="bb404-art-orbit bb404-art-orbit-one" />
              <div className="bb404-art-orbit bb404-art-orbit-two" />

              <div className="bb404-art-404">
                <span>4</span>

                <span className="bb404-art-zero">
                  <span className="bb404-zero-face">
                    <span className="bb404-face-eyes">
                      <i />
                      <i />
                    </span>

                    <span className="bb404-face-mouth" />
                  </span>
                </span>

                <span>4</span>
              </div>

              <div className="bb404-art-spark bb404-spark-one">
                ✦
              </div>

              <div className="bb404-art-spark bb404-spark-two">
                ✳
              </div>

              <div className="bb404-art-spark bb404-spark-three">
                ✦
              </div>

              <div className="bb404-art-message bb404-message-one">
                <span className="bb404-message-icon">
                  <MessageCircle size={20} />
                </span>

                <span>
                  <strong>Lost connection?</strong>
                  <small>Let's find another way.</small>
                </span>
              </div>

              <div className="bb404-art-message bb404-message-two">
                <span className="bb404-message-check">
                  <Sparkles size={18} />
                </span>

                <span>
                  <strong>You're in good hands</strong>
                  <small>Let's get you back on track.</small>
                </span>
              </div>

              <div className="bb404-art-floor" />
            </div>
          </div>
        </section>

        {/* PREMIUM NAVIGATION SHORTCUTS */}

        <section
          className="bb404-explore"
          aria-label="Helpful pages"
        >
          <div className="bb404-explore-heading">
            <div>
              <span className="bb404-section-label">
                <span />
                FIND YOUR WAY
              </span>

              <h2>
                Somewhere better to <em>explore.</em>
              </h2>
            </div>

            <p>
              Here's where you might want to go next.
            </p>
          </div>

          <div className="bb404-links-grid">
            {destinations.map(
              ({ title, subtitle, to, Icon, theme }) => (
                <Link
                  key={to}
                  to={to}
                  className={`bb404-link-card bb404-link-${theme}`}
                >
                  <span className="bb404-link-icon">
                    <Icon size={23} />
                  </span>

                  <span className="bb404-link-content">
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                  </span>

                  <span className="bb404-link-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </Link>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
