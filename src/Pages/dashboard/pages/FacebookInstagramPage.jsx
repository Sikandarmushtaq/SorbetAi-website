
import './FacebookInstagramPage.css';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { socialConnectionsApi } from '../../../services/dashboard/social-connections.api.js';

import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';

import {
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

/* =========================================
   BRAND ICONS
========================================= */

function MessengerIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="27"
      height="27"
      aria-label="Facebook Messenger"
      role="img"
    >
      <path
        fill="#0866FF"
        d="M24 3C12.3 3 3 11.8 3 23.1c0 6.1 2.6 11.1 7 14.6V45l7.1-3.9c2.2.7 4.5 1 6.9 1C35.7 42.1 45 33.9 45 22.6 45 11.8 35.7 3 24 3Z"
      />
      <path
        fill="#fff"
        d="m10.5 29.7 11.1-11.8 6.1 5.6 10-5.6-11.1 11.8-6.1-5.6-10 5.6Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      width="27"
      height="27"
      role="img"
      aria-label="Instagram"
    >
      <defs>
        <linearGradient
          id="bellbee-social-instagram"
          x1="0"
          y1="48"
          x2="48"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FEDA75" />
          <stop offset=".4" stopColor="#FA4256" />
          <stop offset=".7" stopColor="#D62976" />
          <stop offset="1" stopColor="#6C43CB" />
        </linearGradient>
      </defs>

      <rect
        x="7"
        y="7"
        width="34"
        height="34"
        rx="10"
        fill="none"
        stroke="url(#bellbee-social-instagram)"
        strokeWidth="4"
      />

      <circle
        cx="24"
        cy="24"
        r="8"
        fill="none"
        stroke="url(#bellbee-social-instagram)"
        strokeWidth="4"
      />

      <circle
        cx="34"
        cy="14"
        r="2.5"
        fill="#D62976"
      />
    </svg>
  );
}

/* =========================================
   API RESPONSE HELPERS
========================================= */

function getConnections(response) {
  const source =
    response?.social ||
    response?.data ||
    response ||
    {};

  const records = Array.isArray(source)
    ? source
    : Array.isArray(source.connections)
      ? source.connections
      : Array.isArray(source.items)
        ? source.items
        : [];

  const findProvider = (provider) =>
    records.find((item) => {
      const type = String(
        item.provider ||
        item.type ||
        item.platform ||
        item.name ||
        ''
      ).toLowerCase();

      return type.includes(provider);
    }) || null;

  const objectConnections =
    source.connections &&
    !Array.isArray(source.connections)
      ? source.connections
      : {};

  return {
    facebook:
      objectConnections.facebook ||
      source.facebook ||
      findProvider('facebook'),
    instagram:
      objectConnections.instagram ||
      source.instagram ||
      findProvider('instagram'),
  };
}

function isConnected(account) {
  return Boolean(
    account?.connected === true ||
    account?.is_connected === true ||
    String(account?.status || '').toLowerCase() === 'connected'
  );
}

function getAddonStatus(response) {
  const value =
    response?.addon_active ??
    response?.is_active ??
    response?.activated ??
    response?.addon?.active ??
    response?.subscription?.active;

  if (typeof value === 'boolean') return value;

  const status = String(
    response?.addon?.status ||
    response?.subscription?.status ||
    ''
  ).toLowerCase();

  if (['active', 'enabled', 'trialing'].includes(status)) {
    return true;
  }

  if (['inactive', 'disabled', 'cancelled'].includes(status)) {
    return false;
  }

  return null;
}

function getAuthorizationUrl(response) {
  return (
    response?.authorization_url ||
    response?.connect_url ||
    response?.login_url ||
    response?.redirect_url ||
    response?.data?.authorization_url ||
    ''
  );
}

function validateRedirect(value) {
  const url = new URL(value, window.location.href);

  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    )
  ) {
    throw new Error(
      'The backend returned an invalid authorization URL.'
    );
  }

  return url.href;
}

/* =========================================
   MAIN COMPONENT
========================================= */

export default function FacebookInstagramPage() {
  const navigate = useNavigate();

  const {
    isStarted,
    isChecking,
    openFreePlan,
  } = useFreePlan();

  const { showNotice, Notice } = useNotice();

  const [connections, setConnections] = useState({
    facebook: null,
    instagram: null,
  });

  const [addonActive, setAddonActive] = useState(null);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const configured = socialConnectionsApi.isConfigured();

  /* =========================================
     LOAD REAL CONNECTION INFORMATION
  ========================================= */

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!configured) {
      setError(
        'Facebook & Instagram API is not configured. Set REACT_APP_API_SOCIAL_CONNECTIONS_PATH.'
      );
      setLoading(false);
      return;
    }

    try {
      const response = await socialConnectionsApi.request();

      setConnections(getConnections(response));

      const addonStatus = getAddonStatus(response);

      setAddonActive(addonStatus);
    } catch (requestError) {
      setError(
        requestError?.message ||
        'Unable to load Facebook and Instagram connection status.'
      );
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const facebookConnected = isConnected(connections.facebook);
  const instagramConnected = isConnected(connections.instagram);

  /* =========================================
     ACTIVATE FREE SOCIAL ADD-ON IF NEEDED
  ========================================= */

  const ensureAddonActive = async () => {
    // Unknown state is handled by the backend on connect.
    // Do not assume that the add-on is inactive.
    if (addonActive !== false) return true;

    const result = await socialConnectionsApi.request({
      method: 'POST',
      action: 'activate',
      body: {},
    });

    const confirmed =
      result?.activated === true ||
      result?.addon_active === true ||
      result?.status === 'active' ||
      result?.addon?.status === 'active';

    if (!confirmed) {
      showNotice(
        result?.message ||
        'The backend has not yet confirmed social add-on activation.'
      );

      return false;
    }

    setAddonActive(true);

    return true;
  };

  /* =========================================
     FACEBOOK / INSTAGRAM META OAUTH
  ========================================= */

  const performFacebookConnection = async () => {
    if (connecting) return;

    if (!configured) {
      showNotice(
        'Please configure the Facebook & Instagram API first.'
      );
      return;
    }

    setConnecting(true);

    try {
      const active = await ensureAddonActive();

      if (!active) return;

      // A single Facebook authorization flow can request
      // permissions for Facebook Pages and linked Instagram
      // professional accounts.
      const response = await socialConnectionsApi.request({
        method: 'POST',
        id: 'facebook',
        action: 'connect',
        body: {},
      });

      const redirect = getAuthorizationUrl(response);

      if (redirect) {
        window.location.assign(validateRedirect(redirect));
        return;
      }

      showNotice(
        response?.message ||
        'Connection request received. Complete authorization with Facebook.'
      );

      await loadConnections();
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to start Facebook connection.'
      );
    } finally {
      setConnecting(false);
    }
  };

  /* =========================================
     FREE PLAN GATE
  ========================================= */

  const handleContinueFacebook = () => {
    if (isChecking || connecting) return;

    if (!isStarted) {
      // Uses the existing shared FreePlanContext popup.
      // No duplicate free-plan modal is created here.
      openFreePlan(performFacebookConnection);
      return;
    }

    performFacebookConnection();
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="fi-page">
      {Notice}

      {/* BACK NAVIGATION */}
      <button
        type="button"
        className="fi-back-button"
        onClick={() => navigate('/dashboard/channels')}
      >
        <ArrowLeft size={15} />
        Back to Channels
      </button>

      {/* PAGE HEADER */}
      <header className="fi-header">
        <h1>Facebook & Instagram</h1>

        <p>
          Answer Messenger and Instagram messages and
          comments with the same AI assistant,
          in the same inbox.
        </p>
      </header>

      {/* ERRORS */}
      {error && (
        <div className="fi-error" role="status">
          <span>{error}</span>

          {configured && (
            <button
              type="button"
              onClick={loadConnections}
              disabled={loading}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      )}

      {/* CONNECTION CARD */}
      <section className="fi-main-card">
        {/* BRAND LOGOS */}
        <div className="fi-brand-icons">
          <span className="fi-facebook-icon">
            <MessengerIcon />
          </span>

          <span className="fi-instagram-icon">
            <InstagramIcon />
          </span>
        </div>

        {/* TITLE */}
        <h2>Connect your Facebook Page</h2>

        {/* BENEFITS */}
        <div className="fi-benefits">
          <div className="fi-benefit">
            <Check size={17} />

            <span>
              Messenger and Instagram messages arrive
              in Chats, next to WhatsApp.
            </span>
          </div>

          <div className="fi-benefit">
            <Check size={17} />

            <span>
              Your AI assistant replies, takes orders
              and books appointments.
            </span>
          </div>

          <div className="fi-benefit">
            <Check size={17} />

            <span>
              Comments on your posts show up too,
              with optional AI replies.
            </span>
          </div>
        </div>

        {/* FACEBOOK PAGE INFORMATION */}
        <div className="fi-information-box">
          If you manage other businesses on Bellbee
          with this Facebook profile, keep their Pages
          ticked too when Facebook asks which Pages
          to share. A Page you untick stops receiving
          messages in Bellbee.
        </div>

        {/* INSTAGRAM INFORMATION */}
        <div className="fi-information-box">
          To use Instagram, it must be a Professional
          account linked to your Facebook Page, with
          "Allow access to messages" turned on in the
          Instagram app (Settings, Messages and story
          replies, Connected tools).
        </div>

        {/* REAL CONNECTION STATUS */}
        {(facebookConnected || instagramConnected) && (
          <div className="fi-connected-summary">
            <div className="fi-connected-heading">
              <CheckCircle2 size={18} />
              <strong>Connected accounts</strong>
            </div>

            <div className="fi-connected-items">
              {facebookConnected && (
                <div className="fi-connected-item">
                  <span className="fi-connected-dot" />

                  <div>
                    <strong>
                      {connections.facebook?.page_name ||
                        connections.facebook?.account_name ||
                        'Facebook Page'}
                    </strong>

                    <small>Facebook connected</small>
                  </div>
                </div>
              )}

              {instagramConnected && (
                <div className="fi-connected-item">
                  <span className="fi-connected-dot" />

                  <div>
                    <strong>
                      {connections.instagram?.username ||
                        connections.instagram?.account_name ||
                        'Instagram'}
                    </strong>

                    <small>Instagram connected</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="fi-actions">
          <button
            type="button"
            className="fi-connect-button"
            onClick={handleContinueFacebook}
            disabled={
              connecting ||
              isChecking ||
              loading ||
              !configured
            }
          >
            {connecting ? (
              <>
                <LoaderCircle
                  size={16}
                  className="fi-spin"
                />
                Connecting…
              </>
            ) : isChecking ? (
              'Checking plan…'
            ) : facebookConnected ? (
              <>
                <ExternalLink size={15} />
                Manage with Facebook
              </>
            ) : (
              'Continue with Facebook'
            )}
          </button>

          {(facebookConnected || instagramConnected) && (
            <button
              type="button"
              className="fi-refresh-button"
              onClick={loadConnections}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh status
            </button>
          )}
        </div>

        {/* FOOTNOTE */}
        <p className="fi-security-note">
          <ShieldCheck size={14} />

          Meta authorization is handled securely
          through your connected backend.
        </p>
      </section>
    </div>
  );
}
