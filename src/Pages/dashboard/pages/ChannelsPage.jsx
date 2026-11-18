
import { useState } from 'react';
import {
  Globe,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  PageHeader,
  Panel,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

// Displays channel connection options and frontend-only connection states.
export default function ChannelsPage() {
  const [whatsappModal, setWhatsappModal] = useState(false);
  const { showNotice, Notice } = useNotice();

  return (
    <>
      <PageHeader
        eyebrow="SYSTEM"
        title="Channels"
        description="Connect and manage every way customers reach your business."
      />

      {Notice}

      <div className="dp-channels-overview">
        <span className="dp-section-kicker">LIVE CHANNELS</span>
        <span className="dp-status-pill warning">
          No channels connected
        </span>
      </div>

      <div className="dp-channel-grid">
        <ChannelCard
          icon={MessageCircle}
          color="green"
          title="WhatsApp"
          status="Not connected"
          description="Your AI assistant can reply to customers automatically on WhatsApp."
          action="Connect WhatsApp"
          onAction={() => setWhatsappModal(true)}
        />

        <ChannelCard
          icon={Globe}
          color="coral"
          title="Website Chat"
          status="Not subscribed"
          description="Embed the Bellbee AI assistant on your website to capture leads and answer questions."
          action="Explore add-ons"
          onAction={() =>
            showNotice(
              'Website Chat is available in Billing → Available add-ons.'
            )
          }
        />

        <ChannelCard
          icon={Users}
          color="lavender"
          title="Facebook & Instagram"
          status="Not connected"
          description="Answer Messenger and Instagram messages with the same AI assistant."
          action="Connect channels"
          onAction={() =>
            showNotice(
              'Facebook and Instagram connection requires Meta permissions and backend setup.'
            )
          }
        />
      </div>

      <div className="dp-support-cta">
        <div>
          <h3>Need another channel?</h3>
          <p>Tell us what you would like Bellbee to support next.</p>
        </div>

        <button
          type="button"
          className="dp-primary-button"
          onClick={() =>
            showNotice(
              'Channel requests can be sent from the Support page.'
            )
          }
        >
          Request a new channel
        </button>
      </div>

      {whatsappModal && (
        <div
          className="dp-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setWhatsappModal(false);
            }
          }}
        >
          <section
            className="dp-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Connect WhatsApp"
          >
            <header className="dp-modal-header">
              <div>
                <h2>Connect WhatsApp</h2>
                <p>
                  Choose how you want to connect your business number.
                </p>
              </div>

              <button
                type="button"
                className="dp-modal-close"
                onClick={() => setWhatsappModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </header>

            <div className="dp-modal-body">
              <div className="dp-connection-option recommended">
                <div className="dp-connection-icon">
                  <MessageCircle size={22} />
                </div>

                <div>
                  <strong>
                    Official Meta Cloud API
                    <span className="dp-mini-badge">Recommended</span>
                  </strong>

                  <p>
                    Connect using your Meta account. Supports approved
                    message templates and the official WhatsApp Business
                    Platform.
                  </p>
                </div>
              </div>

              <div className="dp-connection-option">
                <div className="dp-connection-icon">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <strong>Secure connection</strong>
                  <p>
                    Connection credentials should be stored securely by
                    the Bellbee backend. Never share your API keys in chat
                    or public code.
                  </p>
                </div>
              </div>

              <div className="dp-info-card">
                <div className="dp-info-card-icon">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h3>Ready to connect with Meta?</h3>
                  <p>
                    Meta login and number verification will become
                    available when the backend OAuth flow is integrated.
                  </p>
                </div>
              </div>
            </div>

            <footer className="dp-modal-footer">
              <button
                type="button"
                className="dp-secondary-button"
                onClick={() => setWhatsappModal(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="dp-primary-button"
                onClick={() => {
                  setWhatsappModal(false);
                  showNotice(
                    'Meta connection is not active in this frontend-only build.'
                  );
                }}
              >
                Continue with Meta
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

// Renders an individual communication channel card.
function ChannelCard({
  icon: Icon,
  color,
  title,
  status,
  description,
  action,
  onAction,
}) {
  return (
    <Panel className="dp-channel-card">
      <div className={`dp-channel-icon ${color}`}>
        <Icon size={22} />
      </div>

      <div className="dp-channel-status">
        <span className="dp-status-dot" />
        {status}
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <button
        type="button"
        className="dp-secondary-button"
        onClick={onAction}
      >
        {action}
      </button>
    </Panel>
  );
}
