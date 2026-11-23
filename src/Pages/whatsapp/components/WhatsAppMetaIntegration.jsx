
import {
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppMetaIntegration() {
  return (
    <section className="wa-section wa-meta-section">
      <div className="wa-container wa-meta-layout">
        <div className="wa-meta-copy wa-reveal">
          <span className="wa-kicker">
            OFFICIAL META INTEGRATION
          </span>

          <h2>
            Connected the <em>official way.</em>
          </h2>

          <p>
            Connect WhatsApp through Meta's official
            WhatsApp Business Platform, not an
            unofficial WhatsApp Web workaround.
          </p>

          <div className="wa-meta-points">
            <div>
              <ShieldCheck size={21} />
              <span>
                <strong>Official Cloud API</strong>
                <small>
                  A direct integration with Meta's
                  supported business messaging platform.
                </small>
              </span>
            </div>

            <div>
              <BadgeCheck size={21} />
              <span>
                <strong>Business connection</strong>
                <small>
                  Authorize your business and number
                  through Meta's connection flow.
                </small>
              </span>
            </div>

            <div>
              <Smartphone size={21} />
              <span>
                <strong>Existing or new number</strong>
                <small>
                  Eligible businesses may keep their
                  WhatsApp Business app number or
                  connect a separate number.
                </small>
              </span>
            </div>
          </div>
        </div>

        <div className="wa-meta-visual wa-reveal">
          <div
            className="wa-meta-visual-blob"
            aria-hidden="true"
          />

          <div className="wa-meta-connect-card">
            <div className="wa-meta-connect-top">
              <span className="wa-meta-whatsapp-icon">
                <FaWhatsapp size={31} />
              </span>

              <span className="wa-meta-connected-tag">
                <CheckCircle2 size={15} />
                Connected
              </span>
            </div>

            <h3>WhatsApp Business</h3>

            <p>
              Your number, connected to an AI
              assistant and a shared inbox.
            </p>

            <div className="wa-meta-detail">
              <span>Connection method</span>
              <strong>Meta Cloud API</strong>
            </div>

            <div className="wa-meta-detail">
              <span>AI assistant</span>
              <strong className="wa-meta-active">
                Active
              </strong>
            </div>

            <div className="wa-meta-detail">
              <span>Team handoff</span>
              <strong>Available</strong>
            </div>
          </div>

          <span className="wa-meta-side-label">
            <ShieldCheck size={17} />
            Secure connection
          </span>
        </div>
      </div>
    </section>
  );
}
