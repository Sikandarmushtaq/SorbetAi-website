
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function WhatsAppCTA() {
  return (
    <section className="wa-cta-section">
      <div className="wa-container">
        <div className="wa-cta-card wa-reveal">
          <div
            className="wa-cta-blob wa-cta-blob-one"
            aria-hidden="true"
          />

          <div
            className="wa-cta-blob wa-cta-blob-two"
            aria-hidden="true"
          />

          <div className="wa-cta-content">
            <span className="wa-cta-eyebrow">
              READY WHEN YOU ARE
            </span>

            <h2>
              Your next customer is
              <br />
              <em>already messaging.</em>
            </h2>

            <p>
              Start with free credit. No credit
              card required to get started.
            </p>

            <div className="wa-cta-actions">
              <Link
                to="/signup"
                className="wa-btn wa-btn-coral"
              >
                <Sparkles size={17} />
                Start using free
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                className="wa-btn wa-btn-light-outline"
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
