
import './WhatsAppConnectionPage.css';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleHelp,
  // ExternalLink,
  Info,
  // Link2,
  LoaderCircle,
  LockKeyhole,
  // MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';

import { whatsappConnectionApi } from '../../../services/dashboard/whatsapp-connection.api.js';

import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';

import {
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

function getConnection(response) {
  return (
    response?.connection ||
    response?.whatsapp ||
    response?.data?.connection ||
    response?.data?.whatsapp ||
    response?.data ||
    response ||
    {}
  );
}

function extractQrImage(response) {
  const result = response?.qr || response?.data || response || {};

  const candidate =
    result.qr_code_url ||
    result.qr_url ||
    result.qr_code ||
    result.image_url ||
    result.image ||
    '';

  if (typeof candidate !== 'string') return '';

  if (/^data:image\/(png|jpeg|webp);base64,/i.test(candidate)) {
    return candidate;
  }

  if (/^https:\/\//i.test(candidate)) {
    return candidate;
  }

  // Development-only support for localhost QR images.
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(candidate)) {
    return candidate;
  }

  return '';
}

function ConnectionInfo({ connection }) {
  const details = [
    {
      label: 'Business name',
      value: connection?.verified_name ||
        connection?.business_name,
    },
    {
      label: 'Phone number',
      value: connection?.display_phone_number ||
        connection?.phone_number,
    },
    {
      label: 'Phone number ID',
      value: connection?.phone_number_id,
    },
    {
      label: 'WhatsApp Business account',
      value: connection?.waba_id,
    },
    {
      label: 'Connection method',
      value: connection?.connection_type ||
        connection?.provider,
    },
    {
      label: 'Status',
      value: connection?.status || 'Connected',
    },
  ];

  return (
    <section className="wac-connected-panel">
      <div className="wac-connected-heading">
        <span className="wac-connected-icon">
          <CheckCircle2 size={24} />
        </span>

        <div>
          <h2>Your WhatsApp is connected</h2>
          <p>
            The connected account information below
            comes from your Bellbee backend.
          </p>
        </div>

        <span className="wac-connected-badge">
          Connected
        </span>
      </div>

      <div className="wac-connected-grid">
        {details.map((detail) => (
          <div key={detail.label}>
            <small>{detail.label}</small>
            <strong>{detail.value || '—'}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WhatsAppConnectionPage() {
  const navigate = useNavigate();

  const {
    isStarted,
    isChecking,
    openFreePlan,
  } = useFreePlan();

  const { showNotice, Notice } = useNotice();

  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectingMode, setConnectingMode] = useState('');

  const [qrBusy, setQrBusy] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [qrStatus, setQrStatus] = useState('');

  const [activeHelp, setActiveHelp] = useState('');
  const [error, setError] = useState('');

  const configured = whatsappConnectionApi.isConfigured();

  const connected = Boolean(
    connection?.connected === true ||
    connection?.is_connected === true ||
    String(connection?.status || '').toLowerCase() === 'connected'
  );

  const loadConnection = useCallback(async (silent = false) => {
    if (!configured) {
      if (!silent) {
        setError(
          'WhatsApp connection API is not configured.'
        );
        setLoading(false);
      }
      return;
    }

    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const response = await whatsappConnectionApi.request();

      const result = getConnection(response);

      setConnection(result);

      const isConnected = Boolean(
        result?.connected === true ||
        result?.is_connected === true ||
        String(result?.status || '').toLowerCase() === 'connected'
      );

      if (isConnected) {
        setQrImage('');
        setQrStatus('');
      }
    } catch (requestError) {
      if (!silent) {
        setError(
          requestError?.message ||
          'Unable to check your WhatsApp connection.'
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // When a QR pairing session is displayed, periodically
  // check the actual backend connection status.
  useEffect(() => {
    if (!qrImage || connected || !configured) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      loadConnection(true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [qrImage, connected, configured, loadConnection]);

  const withFreePlan = (callback) => {
    if (isChecking) return;

    if (!isStarted) {
      openFreePlan(callback);
      return;
    }

    callback();
  };

  // Both Meta buttons use the existing "connect" action.
  // The backend must support number_type to distinguish
  // existing Business app / new-number onboarding.
  const performMetaConnection = async (mode) => {
    if (!configured) {
      showNotice(
        'Configure REACT_APP_API_WHATSAPP_CONNECTION_PATH first.'
      );
      return;
    }

    if (connectingMode) return;

    setConnectingMode(mode);

    try {
      const response = await whatsappConnectionApi.request({
        method: 'POST',
        action: 'connect',
        body: {
          number_type:
            mode === 'existing'
              ? 'existing_business_app'
              : 'new_number',
        },
      });

      const redirect =
        response?.authorization_url ||
        response?.connect_url ||
        response?.login_url ||
        response?.redirect_url;

      if (redirect) {
        const url = new URL(redirect, window.location.href);

        const secure =
          url.protocol === 'https:' ||
          (
            url.protocol === 'http:' &&
            ['localhost', '127.0.0.1'].includes(url.hostname)
          );

        if (!secure) {
          throw new Error(
            'The backend returned an invalid Meta authorization URL.'
          );
        }

        window.location.assign(url.href);
        return;
      }

      showNotice(
        response?.message ||
        'Connection request submitted. Complete the Meta authorization process.'
      );

      await loadConnection();
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to start the Meta connection.'
      );
    } finally {
      setConnectingMode('');
    }
  };

  const startMeta = (mode) => {
    withFreePlan(() => performMetaConnection(mode));
  };

  // QR image is only displayed if returned by
  // the real WhatsApp connection backend.
  const performQrGeneration = async () => {
    if (!configured) {
      showNotice(
        'WhatsApp connection API is not configured.'
      );
      return;
    }

    if (qrBusy) return;

    setQrBusy(true);
    setQrImage('');
    setQrStatus('');

    try {
      const response = await whatsappConnectionApi.request({
        method: 'POST',
        action: 'qr',
        body: {},
      });

      const image = extractQrImage(response);

      if (!image) {
        throw new Error(
          'The backend did not return a valid QR image. Check whether the QR pairing service is enabled.'
        );
      }

      setQrImage(image);

      setQrStatus(
        response?.message ||
        'Scan this QR code using WhatsApp Linked Devices.'
      );

      showNotice('QR code generated.');
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to generate WhatsApp QR code.'
      );
    } finally {
      setQrBusy(false);
    }
  };

  const generateQr = () => {
    withFreePlan(performQrGeneration);
  };

  const toggleHelp = (name) => {
    setActiveHelp((current) =>
      current === name ? '' : name
    );
  };

  return (
    <div className="wac-page">
      {Notice}

      {/* BACK TO CHANNELS */}
      <button
        type="button"
        className="wac-back-button"
        onClick={() => navigate('/dashboard/channels')}
      >
        <ArrowLeft size={15} />
        Back to Channels
      </button>

      {/* PAGE HEADER */}
      <header className="wac-page-header">
        <h1>Connect WhatsApp</h1>

        <p>
          Configure your official business API
          or link a personal account.
        </p>

        <button
          type="button"
          className="wac-refresh-status"
          onClick={() => loadConnection()}
          disabled={loading || !configured}
        >
          <RefreshCw size={14} />
          Refresh status
        </button>
      </header>

      {/* API ERROR */}
      {error && (
        <div className="wac-error" role="status">
          {error}
        </div>
      )}

      {loading && (
        <div className="wac-loading" role="status">
          <LoaderCircle size={16} className="wac-spin" />
          Checking WhatsApp connection…
        </div>
      )}

      {/* ALREADY CONNECTED */}
      {connected ? (
        <ConnectionInfo connection={connection} />
      ) : (
        <>
          <h2 className="wac-section-title">
            Choose a connection method
          </h2>

          <div className="wac-method-grid">
            {/* =================================
                LEFT — META CLOUD API
            ================================= */}
            <section className="wac-meta-card">
              <div className="wac-meta-top">
                <div className="wac-badges">
                  <span className="wac-recommended">
                    Recommended
                  </span>

                  <span className="wac-official">
                    Official Meta API
                  </span>
                </div>

                <h2>Meta Cloud API</h2>

                <div className="wac-meta-intro-grid">
                  <div>
                    <p className="wac-meta-description">
                      Sign in with Facebook and your AI
                      can start replying on WhatsApp
                      after setup is completed.
                    </p>

                    <div className="wac-benefits">
                      <div>
                        <Check size={17} />
                        <span>
                          Official Meta API, rather than
                          an unofficial linked-device
                          automation workaround.
                        </span>
                      </div>

                      <div>
                        <Check size={17} />
                        <span>
                          Send reminders, receipts
                          and broadcasts with
                          approved templates.
                        </span>
                      </div>

                      <div>
                        <Check size={17} />
                        <span>
                          No manual API key entry
                          in the dashboard.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STATIC CONVERSATION PREVIEW */}
                  <div className="wac-chat-demo">
                    <div className="wac-demo-customer">
                      Are you open today?
                    </div>

                    <div className="wac-demo-answer">
                      Yes! We're open till 9pm 😊
                    </div>

                    <small>
                      <BadgeCheck size={11} />
                      Replied by your AI
                    </small>
                  </div>
                </div>
              </div>

              <div className="wac-meta-divider" />

              <div className="wac-meta-actions">
                <div className="wac-facebook-logo">
                  f
                </div>

                <h3>Connect with Meta</h3>

                <p>
                  Already use the WhatsApp Business app?
                  Eligible accounts can connect using
                  Meta's supported setup.
                </p>

                {/* EXISTING NUMBER */}
                <button
                  type="button"
                  className="wac-primary-button"
                  onClick={() => startMeta('existing')}
                  disabled={
                    Boolean(connectingMode) ||
                    isChecking
                  }
                >
                  <Smartphone size={17} />

                  {connectingMode === 'existing'
                    ? 'Connecting…'
                    : 'Use my WhatsApp Business app number'}
                </button>

                {/* NEW NUMBER */}
                <button
                  type="button"
                  className="wac-secondary-button"
                  onClick={() => startMeta('new')}
                  disabled={
                    Boolean(connectingMode) ||
                    isChecking
                  }
                >
                  {connectingMode === 'new'
                    ? 'Connecting…'
                    : 'Connect a new number'}
                </button>

                <small>
                  Both options use Meta authorization.
                  Existing Business app coexistence
                  depends on Meta eligibility
                  and backend support.
                </small>
              </div>
            </section>

            {/* =================================
                RIGHT — BELLBEE QR
            ================================= */}
            <section className="wac-qr-card">
              <div className="wac-qr-heading">
                <QrCode size={20} />
                <h3>Bellbee QR</h3>
              </div>

              <p className="wac-qr-description">
                Scan a QR code to link instantly.
                No Meta approval is required for
                linked-device pairing, but it
                carries account and reliability risks
                under heavy automated use.
              </p>

              <div className="wac-qr-steps">
                Open WhatsApp
                <span>→</span>
                Linked Devices
                <span>→</span>
                Link a Device
                <span>→</span>
                Scan QR
              </div>

              <div className="wac-help-links">
                <button
                  type="button"
                  onClick={() => toggleHelp('device')}
                  aria-expanded={activeHelp === 'device'}
                >
                  What is a Linked Device?
                  <CircleHelp size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleHelp('why')}
                  aria-expanded={activeHelp === 'why'}
                >
                  Why connect WhatsApp?
                  <CircleHelp size={14} />
                </button>
              </div>

              {activeHelp && (
                <div className="wac-help-content">
                  <button
                    type="button"
                    onClick={() => setActiveHelp('')}
                    aria-label="Close information"
                  >
                    <X size={14} />
                  </button>

                  {activeHelp === 'device' ? (
                    <p>
                      A linked device is another authorized
                      session attached to your WhatsApp
                      account. QR pairing connects
                      the backend session, if supported
                      by your provider.
                    </p>
                  ) : (
                    <p>
                      Connecting WhatsApp lets your
                      assistant respond to messages.
                      Available features depend on
                      your provider, API permissions,
                      and connection method.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                className="wac-generate-button"
                onClick={generateQr}
                disabled={qrBusy || isChecking}
              >
                {qrBusy ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="wac-spin"
                    />
                    Generating…
                  </>
                ) : qrImage ? (
                  <>
                    <RefreshCw size={15} />
                    Generate New QR Code
                  </>
                ) : (
                  'Generate QR Code'
                )}
              </button>

              {/* REAL BACKEND QR IMAGE */}
              {qrImage && (
                <div className="wac-qr-result">
                  <img
                    src={qrImage}
                    alt="WhatsApp device pairing QR code"
                  />

                  <p>{qrStatus}</p>

                  <button
                    type="button"
                    onClick={() => loadConnection()}
                    disabled={loading}
                  >
                    <RefreshCw size={14} />
                    Check connection
                  </button>
                </div>
              )}

              {!configured && (
                <p className="wac-config-note">
                  Connect the WhatsApp API
                  to enable QR pairing.
                </p>
              )}
            </section>
          </div>
        </>
      )}

      {/* SECURITY MESSAGE */}
      <div className="wac-security-note">
        <LockKeyhole size={16} />

        <span>
          API credentials and pairing sessions must be
          protected by your backend. Never expose
          access tokens or provider secrets in frontend code.
        </span>

        <button
          type="button"
          onClick={() => toggleHelp('security')}
          aria-label="Connection security information"
        >
          <Info size={15} />
        </button>
      </div>

      {activeHelp === 'security' && (
        <div className="wac-security-detail">
          Meta authorization, token storage, webhook
          verification, QR session management, and
          encryption must be implemented securely
          on the server.
        </div>
      )}

      {!isStarted && !isChecking && (
        <p className="wac-plan-note">
          <ShieldCheck size={14} />
          Starting a connection will ask you to
          activate your free plan first.
        </p>
      )}
    </div>
  );
}
