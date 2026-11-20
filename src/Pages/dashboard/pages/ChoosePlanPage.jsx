
import './ChoosePlanPage.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Gift,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';

import { plansApi } from '../../../services/dashboard/plans.api.js';

import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';

import {
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

/* =========================================
   PLAN FEATURES
========================================= */

const allInOneFeatures = [
  'Appointment Booking',
  'Order Management',
  'Understands your menus, price lists & documents',
  'Finds answers from your business info instantly',
  'Collects any custom info from customers',
  'Unlimited Brain Documents',
  'Unlimited Staff Profiles',
];

/* =========================================
   RESPONSE HELPERS
========================================= */

function getPlans(response) {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.plans,
    response?.items,
    response?.results,
    response?.catalogue,
  ];

  return candidates.find(Array.isArray) || [];
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function findAllInOne(plans) {
  return plans.find((plan) => {
    const name = normalizeName(plan?.name);
    const slug = normalizeName(plan?.slug);

    return (
      name.includes('allinone') ||
      slug.includes('allinone')
    );
  }) || null;
}

function getPriceLabel(plan) {
  const label =
    plan?.price_label ||
    plan?.display_price ||
    plan?.formatted_price;

  if (typeof label === 'string' && label.trim()) {
    return label.trim();
  }

  // Screenshot reference price.
  // Checkout must confirm the actual amount.
  return '£49';
}

function getCheckoutUrl(response) {
  return (
    response?.checkout_url ||
    response?.payment_url ||
    response?.authorization_url ||
    response?.data?.checkout_url ||
    ''
  );
}

function validateCheckoutUrl(value) {
  const url = new URL(value, window.location.href);

  const allowed =
    url.protocol === 'https:' ||
    (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    );

  if (!allowed) {
    throw new Error(
      'The backend returned an invalid checkout URL.'
    );
  }

  return url.href;
}

/* =========================================
   MAIN COMPONENT
========================================= */

export default function ChoosePlanPage() {
  const navigate = useNavigate();

  const {
    isStarted,
    isChecking,
    openFreePlan,
  } = useFreePlan();

  const {
    showNotice,
    Notice,
  } = useNotice();

  const [plans, setPlans] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [savedPromo, setSavedPromo] = useState('');

  const [, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const configured = plansApi.isConfigured();

  /* =========================================
     LOAD PLAN CATALOGUE
  ========================================= */

  const loadPlans = useCallback(async () => {
    if (!plansApi.isConfigured()) return;

    setLoading(true);
    setLoadError('');

    try {
      const response = await plansApi.request();

      setPlans(getPlans(response));
    } catch (error) {
      setLoadError(
        error?.message ||
        'Unable to load available plans.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const allInOnePlan = useMemo(
    () => findAllInOne(plans),
    [plans]
  );

  const priceLabel = getPriceLabel(allInOnePlan);

  /* =========================================
     PROMO CODE
  ========================================= */

  const handlePromoCode = (event) => {
    event.preventDefault();

    const value = promoCode.trim().toUpperCase();

    if (!value) {
      showNotice('Enter a promo code first.');
      return;
    }

    // Save the code for the backend checkout request.
    // Do not claim a discount until the server validates it.
    setSavedPromo(value);

    showNotice(
      'Promo code saved for checkout. Its validity and discount will be confirmed by the billing provider.'
    );
  };

  /* =========================================
     FREE PLAN / PAID PLAN
  ========================================= */

  const handleStartPlan = async () => {
    if (isChecking || selecting) return;

    // Existing free-plan activation popup.
    if (!isStarted) {
      openFreePlan();
      return;
    }

    // Once free plan is active, upgrade through
    // the existing backend plan-selection API.
    if (!configured) {
      showNotice(
        'Plan checkout API is not configured yet.'
      );
      return;
    }

    const planId =
      allInOnePlan?.id ||
      allInOnePlan?.plan_id ||
      allInOnePlan?.slug;

    if (!planId) {
      showNotice(
        'The billing API has not returned an All in One plan ID yet. Please refresh the plan catalogue.'
      );
      return;
    }

    setSelecting(true);

    try {
      const body = {
        plan_id: planId,
      };

      if (savedPromo) {
        body.promo_code = savedPromo;
      }

      const result = await plansApi.request({
        method: 'POST',
        action: 'select',
        body,
      });

      const checkoutUrl = getCheckoutUrl(result);

      if (checkoutUrl) {
        window.location.assign(
          validateCheckoutUrl(checkoutUrl)
        );
        return;
      }

      showNotice(
        result?.message ||
        'Your plan request was received. Please check billing for the next step.'
      );
    } catch (error) {
      showNotice(
        error?.message ||
        'Unable to continue to checkout.'
      );
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="cp-page">
      {Notice}

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="cp-page-header">
        <h1>Choose a Plan</h1>

        <button
          type="button"
          className="cp-back-button"
          onClick={() => navigate('/dashboard/billing')}
        >
          <ArrowLeft size={14} />
          Back to Billing
        </button>
      </header>

      {/* =====================================
          EARLY-BIRD OFFER
      ===================================== */}

      <section className="cp-early-bird">
        <div className="cp-gift-icon">
          <Gift size={21} />
        </div>

        <div className="cp-early-bird-content">
          <h2>Unlock your early-bird price</h2>

          <p>
            49% off Bellbee AI, locked for 2 years.
            It unlocks the moment Bellbee AI replies
            to your first real customer.
          </p>

          <button
            type="button"
            className="cp-setup-link"
            onClick={() => navigate('/dashboard')}
          >
            See your setup steps
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* =====================================
          PROMO CODE
      ===================================== */}

      <form
        className="cp-promo-card"
        onSubmit={handlePromoCode}
      >
        <label htmlFor="cp-promo-input">
          Have a promo code?
        </label>

        <div className="cp-promo-row">
          <input
            id="cp-promo-input"
            type="text"
            value={promoCode}
            placeholder="PROMO CODE"
            maxLength={60}
            autoComplete="off"
            onChange={(event) => {
              setPromoCode(
                event.target.value.toUpperCase()
              );

              setSavedPromo('');
            }}
          />

          <button
            type="submit"
            className="cp-apply-button"
            disabled={!promoCode.trim()}
          >
            Apply
          </button>
        </div>

        {savedPromo && (
          <p className="cp-promo-feedback">
            <Check size={13} />
            Code {savedPromo} added to your checkout
            request. Discount subject to validation.
          </p>
        )}
      </form>

      {/* =====================================
          API ERROR
      ===================================== */}

      {loadError && (
        <div
          className="cp-error"
          role="status"
        >
          {loadError}
        </div>
      )}

      {/* =====================================
          ALL IN ONE PLAN CARD
      ===================================== */}

      <section className="cp-plans-section">
        <article className="cp-plan-card">
          <h2>All in One Plan</h2>

          <p className="cp-plan-description">
            The complete Bellbee experience, no module
            restrictions. AI-powered WhatsApp automation
            across conversations, appointments, and
            orders, plus campaigns, analytics, and your
            full AI Brain with unlimited documents and
            staff profiles. Built for businesses that
            want every feature available from day one.
          </p>

          {/* PRICE */}

          <div className="cp-price-block">
            <div className="cp-price-line">
              <strong>{priceLabel}</strong>

              <span>/month + card fee</span>
            </div>

            <p className="cp-price-note">
              The card fee is added at checkout,
              where you see the total before you pay.
            </p>
          </div>

          {/* TOKENS */}

          <p className="cp-token-text">
            {allInOnePlan?.tokens_label ||
              '10,000,000 free tokens/month'}
          </p>

          {/* FEATURES */}

          <div className="cp-feature-list">
            {allInOneFeatures.map((feature) => (
              <div
                className="cp-feature"
                key={feature}
              >
                <Check size={17} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* MAIN CTA */}

          <button
            type="button"
            className="cp-start-button"
            onClick={handleStartPlan}
            disabled={
              selecting ||
              isChecking
            }
          >
            {selecting ? (
              <>
                <LoaderCircle
                  size={16}
                  className="cp-spin"
                />
                Continuing…
              </>
            ) : isChecking ? (
              'Checking plan…'
            ) : isStarted ? (
              <>
                Upgrade to Paid
                <ArrowRight size={15} />
              </>
            ) : (
              'Start Free Trial'
            )}
          </button>

          {isStarted && (
            <div className="cp-active-plan-note">
              <Check size={14} />
              Your free plan is active.
            </div>
          )}
        </article>
      </section>

      {/* =====================================
          SECURITY / BACKEND NOTES
      ===================================== */}

      {!configured && (
        <p className="cp-api-note">
          <CreditCard size={15} />
          Paid checkout will become available when
          REACT_APP_API_PLANS_PATH is configured.
          Free-plan activation uses your existing
          FreePlanContext.
        </p>
      )}

      <p className="cp-security-note">
        <ShieldCheck size={15} />
        Actual pricing, promotional eligibility,
        discounts and payment details are confirmed
        by your billing backend at checkout.
      </p>
    </div>
  );
}
