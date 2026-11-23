
import {
  CheckCircle2,
  Info,
  XCircle,
} from 'lucide-react';

const requirements = [
  'A WhatsApp Business number that your customers can message.',
  'A Facebook account with the required Meta business permissions.',
  'An eligible WhatsApp Business setup for the selected connection method.',
];

const limitations = [
  "It does not bypass Meta's WhatsApp Business policies.",
  'Campaign messages must follow opt-in and approved template requirements.',
  'Keeping the same number in the WhatsApp Business app depends on Meta eligibility and setup rules.',
];

export default function WhatsAppRequirements() {
  return (
    <section className="wa-section wa-requirements-section">
      <div className="wa-container">
        <div className="wa-section-heading wa-reveal">
          <span className="wa-kicker">
            BEFORE YOU CONNECT
          </span>

          <h2>
            Good to <em>know.</em>
          </h2>
        </div>

        <div className="wa-requirements-grid">
          <article className="wa-requirements-card wa-reveal">
            <div className="wa-requirements-heading">
              <span className="wa-requirements-icon wa-requirements-positive">
                <CheckCircle2 size={23} />
              </span>

              <h3>What you need</h3>
            </div>

            <ul>
              {requirements.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="wa-requirements-card wa-reveal">
            <div className="wa-requirements-heading">
              <span className="wa-requirements-icon wa-requirements-neutral">
                <Info size={23} />
              </span>

              <h3>What it does not do</h3>
            </div>

            <ul>
              {limitations.map((item) => (
                <li key={item}>
                  <XCircle size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="wa-requirements-note wa-reveal">
          <CheckCircle2 size={20} />
          <span>
            A person can always take over an eligible
            conversation from the shared inbox.
          </span>
        </div>
      </div>
    </section>
  );
}
