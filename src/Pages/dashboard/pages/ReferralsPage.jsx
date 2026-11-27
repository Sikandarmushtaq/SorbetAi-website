
import './ReferralsPage.css';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Check,
  Copy,

  Info,
  Link2,
  MessageCircle,
  PiggyBank,
  QrCode,
  RefreshCw,
  Ticket,
  Users,
  Sparkles,
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';

import { referralsApi } from '../../../services/dashboard/referrals.api.js';

import {
  Modal,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== ''
  );
}

function readableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString('en-GB')
    : '—';
}

function savingsValue(value, currency) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return '—';

  if (number === 0) return '0';

  if (!currency) {
    return number.toLocaleString('en-GB');
  }

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(number);
  } catch {
    return `${number.toLocaleString('en-GB')} ${currency}`;
  }
}

function getReferralData(response) {
  return (
    response?.referral ||
    response?.data?.referral ||
    response?.data ||
    response ||
    {}
  );
}

function StatCard({ icon: Icon, title, value, accent }) {
  return (
    <article className="rf-stat-card">
      <span className={`rf-stat-icon ${accent}`}>
        <Icon size={19} strokeWidth={1.9} />
      </span>

      <span className="rf-stat-title">
        {title}
      </span>

      <strong>{value}</strong>
    </article>
  );
}

export default function ReferralsPage() {
  const { showNotice, Notice } = useNotice();

  const linkInputRef = useRef(null);

  const [referral, setReferral] = useState(null);
  const [friendCode, setFriendCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [copying, setCopying] = useState(false);

  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [error, setError] = useState('');

  const configured = referralsApi.isConfigured();

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!configured) {
      setReferral(null);
      setError(
        'Referrals API is not configured. Add its backend endpoint to your environment settings.'
      );
      setLoading(false);
      return;
    }

    try {
      const response = await referralsApi.request();

      setReferral(getReferralData(response));
    } catch (requestError) {
      setReferral(null);
      setError(
        requestError?.message ||
        'Unable to load your referral information.'
      );
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const referralCode = String(
    firstValue(
      referral?.code,
      referral?.referral_code,
      referral?.invite_code
    ) || ''
  );

  // The referral URL must be supplied by the backend.
  // Do not invent an unverified signup route.
  const referralLink = String(
    firstValue(
      referral?.referral_link,
      referral?.link,
      referral?.referral_url,
      referral?.invite_url
    ) || ''
  );

  const validLink = (() => {
    try {
      const parsed = new URL(referralLink);

      return (
        parsed.protocol === 'https:' ||
        parsed.protocol === 'http:'
      );
    } catch {
      return false;
    }
  })();

  const stats =
    referral?.stats ||
    referral?.statistics ||
    referral?.summary ||
    {};

  const invited = firstValue(
    stats.businesses_invited,
    stats.businesses_brought,
    stats.invited_count,
    stats.total_referrals,
    referral?.businesses_invited,
    referral?.invited_count
  );

  const subscribed = firstValue(
    stats.subscribed_count,
    stats.subscribed,
    stats.total_subscribed,
    referral?.subscribed_count,
    referral?.subscribed
  );

  const saved = firstValue(
    stats.total_savings,
    stats.you_saved,
    stats.saved,
    referral?.total_savings,
    referral?.you_saved
  );

  const currency = firstValue(
    stats.currency,
    referral?.currency
  );

  const inviteBenefit =
    referral?.invitee_benefit ||
    referral?.invitee_discount_text ||
    referral?.reward_description ||
    'Share Bellbee with other businesses.';

  const infoMessage =
    referral?.banner_message ||
    referral?.notice ||
    (validLink
      ? 'Referral rewards are starting soon. Your link already works, so friends who sign up with it are counted.'
      : 'Your referral programme information will appear when your personal link is available.');

  const copyReferral = async () => {
    const value = validLink
      ? referralLink
      : referralCode;

    if (!value || copying) return;

    setCopying(true);

    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      showNotice(
        validLink
          ? 'Referral link copied.'
          : 'Referral code copied.'
      );

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();

      showNotice(
        'Automatic copying is unavailable. Please select and copy the link manually.'
      );
    } finally {
      setCopying(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!validLink) {
      showNotice(
        'Your referral link is not available yet.'
      );
      return;
    }

    const message =
      `Join me on Bellbee AI!\n\n` +
      `Use my referral link to sign up:\n` +
      referralLink;

    const shareUrl =
      `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(
      shareUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const applyFriendCode = async (event) => {
    event.preventDefault();

    const code = friendCode.trim().toUpperCase();

    if (!code || applying) return;

    if (!configured) {
      showNotice(
        'Referrals API is not configured yet.'
      );
      return;
    }

    setApplying(true);

    try {
      await referralsApi.request({
        method: 'POST',
        action: 'apply',
        body: {
          referral_code: code,
        },
      });

      setFriendCode('');

      showNotice(
        'Referral code submitted successfully.'
      );

      await loadReferrals();
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to apply this referral code.'
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rf-page">
      {/* PAGE TITLE */}
      <header className="rf-page-header">
        <h1>Referrals</h1>

        <p>
          Share your link with other businesses.
        </p>
      </header>

      {Notice}

      {/* API ERROR */}
      {error && (
        <div
          className="rf-error"
          role="status"
        >
          <span>{error}</span>

          {configured && (
            <button
              type="button"
              onClick={loadReferrals}
              disabled={loading}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      )}

      {/* REFERRAL INFORMATION BANNER */}
      <section
        className="rf-info-banner"
        role="note"
      >
        <Info size={18} strokeWidth={2} />

        <span>
          {infoMessage}
        </span>
      </section>

      {/* INVITE / FRIEND CODE */}
      <div className="rf-main-grid">
        {/* LEFT CARD */}
        <section className="rf-card rf-invite-card">
          <div className="rf-card-heading">
            <span className="rf-feature-icon">
              <Link2 size={19} />
            </span>

            <div>
              <h2>Invite friends</h2>

              <p>{inviteBenefit}</p>
            </div>
          </div>

          <button
            type="button"
            className="rf-whatsapp-button"
            onClick={shareOnWhatsApp}
            disabled={!validLink || loading}
          >
            <MessageCircle size={17} />
            Share on WhatsApp
          </button>

          <div className="rf-referral-link-row">
            <input
              ref={linkInputRef}
              type="text"
              value={
                loading
                  ? 'Loading your referral link…'
                  : referralLink ||
                    referralCode ||
                    'Referral link not available'
              }
              readOnly
              aria-label="Your referral link"
            />

            <button
              type="button"
              className="rf-copy-button"
              onClick={copyReferral}
              disabled={
                loading ||
                (!validLink && !referralCode)
              }
            >
              {copied ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}

              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              className="rf-qr-button"
              title="Show referral QR code"
              aria-label="Show referral QR code"
              onClick={() => setQrOpen(true)}
              disabled={!validLink || loading}
            >
              <QrCode size={18} />
            </button>
          </div>

          <div className="rf-your-code">
            <span>Your code:</span>

            <strong>
              {loading
                ? '…'
                : referralCode || 'Not available'}
            </strong>
          </div>
        </section>

        {/* RIGHT CARD */}
        <section className="rf-card rf-friend-card">
          <div className="rf-card-heading">
            <span className="rf-feature-icon neutral">
              <Ticket size={18} />
            </span>

            <div>
              <h2>Did a friend invite you?</h2>

              <p>
                Add their code within 72 hours of
                signing up.
              </p>
            </div>
          </div>

          <form
            className="rf-friend-form"
            onSubmit={applyFriendCode}
          >
            <input
              type="text"
              value={friendCode}
              maxLength={60}
              placeholder="FRIEND'S CODE"
              aria-label="Friend's referral code"
              onChange={(event) =>
                setFriendCode(
                  event.target.value.toUpperCase()
                )
              }
              disabled={applying}
              required
            />

            <button
              type="submit"
              className="rf-add-button"
              disabled={
                applying ||
                loading ||
                !friendCode.trim() ||
                !configured
              }
            >
              {applying ? 'Adding…' : 'Add'}
            </button>
          </form>
        </section>
      </div>

      {/* STATISTICS */}
      <section
        className="rf-stats"
        aria-label="Referral statistics"
      >
        <StatCard
          icon={Users}
          title="BUSINESSES YOU BROUGHT"
          value={
            loading
              ? '—'
              : readableNumber(invited)
          }
          accent="people"
        />

        <StatCard
          icon={Sparkles}
          title="SUBSCRIBED"
          value={
            loading
              ? '—'
              : readableNumber(subscribed)
          }
          accent="subscribed"
        />

        <StatCard
          icon={PiggyBank}
          title="YOU SAVED"
          value={
            loading
              ? '—'
              : savingsValue(saved, currency)
          }
          accent="savings"
        />
      </section>

      {/* QR CODE POPUP */}
      {qrOpen && validLink && (
        <Modal
          title="Your referral QR code"
          description="Let someone scan this code to open your referral link."
          onClose={() => setQrOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="rf-modal-secondary"
                onClick={() => setQrOpen(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="rf-modal-primary"
                onClick={copyReferral}
              >
                <Copy size={15} />
                Copy link
              </button>
            </>
          }
        >
          <div className="rf-qr-modal-content">
            <div className="rf-qr-image">
              <QRCodeSVG
                value={referralLink}
                size={208}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#10372A"
                marginSize={2}
              />
            </div>

            {referralCode && (
              <p className="rf-qr-code-text">
                Referral code:
                <strong>{referralCode}</strong>
              </p>
            )}

            <p className="rf-qr-url">
              {referralLink}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}