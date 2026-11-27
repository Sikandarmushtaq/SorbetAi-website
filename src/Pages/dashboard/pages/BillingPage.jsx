
import './BillingPage.css';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';

import { billingApi } from '../../../services/dashboard/billing.api.js';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';

function Icon({ name, size = 18, ...props }) {
  const Component = Lucide[name];

  return Component
    ? <Component size={size} {...props} />
    : <span aria-hidden="true">◆</span>;
}

const addons = [
  {
    id: 'store_integration',
    title: 'Store Integration',
    icon: 'Store',
    price: '£5/mo',
    description:
      'Connect your online store (WooCommerce or a custom integration) so orders and data flow directly into Bellbee.',
  },
  {
    id: 'courier_integrations',
    title: 'Courier Integrations',
    icon: 'Truck',
    price: '£6/mo',
    description:
      'Connect your store to supported courier services for automatic shipment booking on new orders.',
  },
  {
    id: 'website_chat',
    title: 'Website Chat Widget',
    icon: 'MessageCircle',
    price: 'Free',
    description:
      'Embed a WhatsApp-powered live chat widget directly on your business website.',
  },
  {
    id: 'facebook_instagram',
    title: 'Facebook & Instagram',
    icon: 'Users',
    price: 'Free',
    description:
      'Answer Facebook Messenger and Instagram messages and comments with your AI assistant.',
  },
];

const benefits = [
  'Appointment Booking',
  'Order Management',
  'Understands your menus, price lists & documents',
  'Finds answers from your business info instantly',
];

function normalise(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function formatMoney(value, currency = 'GBP') {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function getActiveAddons(billing) {
  const source =
    billing?.addons ||
    billing?.active_addons ||
    billing?.subscriptions?.addons ||
    [];

  if (Array.isArray(source)) {
    return source
      .filter((item) => {
        if (typeof item === 'string') return true;

        return ['active', 'enabled', 'trialing'].includes(
          normalise(item?.status || 'active')
        );
      })
      .map((item) => {
        const id = normalise(
          typeof item === 'string'
            ? item
            : item?.addon_id || item?.code || item?.id || item?.name
        );

        return id === 'social_channels' ? 'facebook_instagram' : id;
      });
  }

  return Object.entries(source || {})
    .filter(([, item]) => {
      if (!item || typeof item !== 'object') return false;

      return (
        item.active === true ||
        item.is_active === true ||
        ['active', 'enabled', 'trialing'].includes(
          normalise(item.status)
        )
      );
    })
    .map(([id]) =>
      id === 'social_channels' ? 'facebook_instagram' : id
    );
}

export default function BillingPage() {
  const navigate = useNavigate();

  const {
    isStarted,
    isChecking,
    isStatusKnown,
    openFreePlan,
  } = useFreePlan();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const go = (path) => navigate(path);

  const loadBilling = useCallback(async () => {
    if (!billingApi.isConfigured()) {
      setLoading(false);
      setError('Billing API is not configured.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await billingApi.request();
      setBilling(response?.billing || response || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const subscription =
    billing?.subscription ||
    billing?.plan ||
    {};

  const credit =
    billing?.ai_credits ||
    billing?.credits ||
    {};

  const usage =
    billing?.monthly_usage ||
    billing?.monthly_credit_use ||
    {};

  const currency =
    credit.currency ||
    billing?.currency ||
    'GBP';

  const planName =
    subscription.plan_name ||
    subscription.name ||
    billing?.plan_name ||
    'All in One Plan';

  const subscriptionStatus = normalise(subscription.status);

  const isTrial =
    ['trial', 'trialing', 'free', 'free_active'].includes(
      subscriptionStatus
    ) ||
    billing?.is_free_trial === true;

  const daysRemaining =
    subscription.days_remaining ??
    subscription.renews_in_days ??
    billing?.days_remaining;

  const renewalDate =
    subscription.renews_at ||
    subscription.renewal_date ||
    credit.renews_at ||
    billing?.credit_renews_at;

  const creditLeft =
    credit.remaining ??
    credit.credit_remaining ??
    billing?.credit_remaining;

  const creditUsed =
    credit.used_this_month ??
    credit.spent_this_month ??
    usage.used ??
    usage.amount;

  const creditLimit =
    credit.included_this_month ??
    credit.monthly_included ??
    usage.limit ??
    usage.included;

  const repliesRemaining =
    credit.replies_remaining ??
    credit.estimated_replies_remaining;

  const usagePercentage =
    Number(creditLimit) > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (Number(creditUsed || 0) / Number(creditLimit)) * 100
          )
        )
      : 0;

  const activeAddons = getActiveAddons(billing);

  const getAddonPrice = (addon) => {
    const item =
      billing?.addons && !Array.isArray(billing.addons)
        ? billing.addons[addon.id]
        : null;

    return item?.price_label || item?.display_price || addon.price;
  };

  return (
    <div className="bb2-billing">
      <header className="bb2-page-heading">
        <h1>Billing &amp; Subscription</h1>
        <p>Manage your plan, usage, and billing history.</p>
      </header>

      {error && (
        <div className="bb2-billing-error" role="status">
          {error}
          <button type="button" onClick={loadBilling}>
            Retry
          </button>
        </div>
      )}

      {isChecking || !isStatusKnown ? (
        <div className="bb2-billing-info" role="status">
          {isChecking
            ? 'Checking subscription status…'
            : 'Plan status is unavailable. Connect the free-plan status API to confirm your subscription.'}
        </div>
      ) : isStarted ? (
        <div className="bb2-billing-top">
          <section className="bb2-billing-hero">
            <div className="bb2-billing-hero-head">
              <span className="bb2-billing-crown">
                <Icon name="Crown" size={24} />
              </span>

              <div>
                <small>YOUR PLAN</small>

                <h2>{planName}</h2>

                <p>
                  The complete Bellbee experience, no module
                  restrictions. AI-powered WhatsApp automation
                  across conversations, appointments and orders.
                </p>
              </div>

              <span className="bb2-trial-pill">
                {isTrial ? 'Trial' : 'Active'}
              </span>
            </div>

            <div className="bb2-plan-benefits">
              {benefits.map((benefit) => (
                <span key={benefit}>
                  <Icon name="CheckCircle2" size={15} />
                  {benefit}
                </span>
              ))}
            </div>

            <strong className="bb2-plan-month">
              {isTrial
                ? `Free plan · Month ${
                    subscription.month_number ||
                    billing?.free_plan_month ||
                    1
                  }`
                : planName}
            </strong>

            <p className="bb2-plan-renews">
              Renews ·{' '}
              <b>
                {daysRemaining != null
                  ? `${daysRemaining} days remaining`
                  : renewalDate
                    ? formatDate(renewalDate)
                    : 'Details pending'}
              </b>
            </p>

            <button
              className="bb2-upgrade-button"
              type="button"
              onClick={() => go('/dashboard/billing/plans')}
            >
              Upgrade to Paid
              <Icon name="ArrowRight" size={15} />
            </button>
          </section>

          <section className="bb2-period-card">
            <div className="bb2-period-heading">
              <span>
                <Icon name="CalendarDays" size={19} />
              </span>

              <div>
                <small>THIS PERIOD</small>
                <h3>Current Billing</h3>
              </div>
            </div>

            <h2>
              {isTrial
                ? 'Free'
                : subscription.amount_label ||
                  subscription.price_label ||
                  planName}
            </h2>

            <hr />

            <strong className="bb2-credit-number">
              {loading ? '—' : formatMoney(creditLeft, currency)}
            </strong>

            <p>
              AI credit left
              {repliesRemaining != null
                ? ` · about ${Number(
                    repliesRemaining
                  ).toLocaleString()} replies`
                : ''}
            </p>

            <div className="bb2-usage-line">
              <span>Monthly credit used</span>
              <b>
                {formatMoney(creditUsed, currency)} of{' '}
                {formatMoney(creditLimit, currency)}
              </b>
            </div>

            <div
              className="bb2-progress"
              role="progressbar"
              aria-label="Monthly credit used"
              aria-valuenow={Math.round(usagePercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                style={{
                  width: `${usagePercentage}%`,
                }}
              />
            </div>

            <div className="bb2-period-line">
              <span>
                Monthly credit renews {formatDate(renewalDate)}
              </span>

              <button
                type="button"
                onClick={() => go('/dashboard/billing/plans')}
              >
                Upgrade for more
                <Icon name="ArrowRight" size={13} />
              </button>
            </div>

            <div className="bb2-period-line">
              <span>
                Includes{' '}
                <b>{formatMoney(creditLimit, currency)}</b>{' '}
                of AI credit this month
              </span>

              <button
                type="button"
                onClick={() => go('/dashboard/billing/reports')}
              >
                View detailed usage
                <Icon name="ArrowRight" size={13} />
              </button>
            </div>
          </section>
        </div>
      ) : (
        <section className="bb2-before-plan">
          <span className="bb2-billing-crown">
            <Icon name="Sparkles" size={23} />
          </span>

          <div>
            <small>YOUR PLAN</small>

            <h2>Start your free plan</h2>

            <p>
              Your AI is off until you start your free plan.
              Free, no card needed.
            </p>

            <button
              type="button"
              onClick={() => openFreePlan(loadBilling)}
            >
              Start free plan
              <Icon name="ArrowRight" size={15} />
            </button>
          </div>
        </section>
      )}

      <div className="bb2-section-title">
        <div>
          <span className="bb2-section-icon">
            <Icon name="Puzzle" size={17} />
          </span>

          <div>
            <small>EXTEND YOUR PLAN</small>
            <h2>Add-ons</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => go('/dashboard/billing/addons')}
        >
          View all
          <Icon name="ArrowRight" size={14} />
        </button>
      </div>

      <div className="bb2-addon-grid">
        {addons.map((addon) => {
          const active = activeAddons.includes(addon.id);

          return (
            <article
              className={`bb2-addon ${active ? 'active' : ''}`}
              key={addon.id}
            >
              <span className="bb2-addon-icon">
                <Icon name={addon.icon} size={18} />
              </span>

              <h3>{addon.title}</h3>

              <small>{getAddonPrice(addon)}</small>

              <button
                type="button"
                onClick={() => go('/dashboard/billing/addons')}
              >
                {active ? 'Manage →' : 'Add'}
              </button>

              <p>{addon.description}</p>
            </article>
          );
        })}
      </div>

      <div className="bb2-divider" />

      <div className="bb2-section-title">
        <div>
          <span className="bb2-section-icon">
            <Icon name="Layers" size={17} />
          </span>

          <div>
            <small>COMPARE</small>
            <h2>Plans</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => go('/dashboard/billing/plans')}
        >
          Manage Plans
          <Icon name="ArrowRight" size={14} />
        </button>
      </div>

      <button
        className="bb2-compare-plan"
        type="button"
        onClick={() => go('/dashboard/billing/plans')}
      >
        <b>All in One Plan</b>

        <strong>
          {billing?.plans?.all_in_one?.price_label || 'See plans'}
          <span>
            {' '}
            {billing?.plans?.all_in_one?.billing_period || ''}
          </span>
        </strong>

        <small>
          {billing?.plans?.all_in_one?.tokens_label ||
            'See included tokens and full plan details'}
        </small>
      </button>

      <div className="bb2-divider" />

      <small className="bb2-more-label">MORE</small>

      <div className="bb2-more-row">
        <span>
          <Icon name="BarChart3" size={17} />
        </span>

        <p>AI credit usage and history</p>

        <button
          type="button"
          onClick={() => go('/dashboard/billing/reports')}
        >
          View reports
          <Icon name="ArrowRight" size={14} />
        </button>
      </div>

      <div className="bb2-more-row">
        <span>
          <Icon name="CreditCard" size={17} />
        </span>

        <p>
          Let customers pay you directly through your own gateway
        </p>

        <button
          type="button"
          onClick={() =>
            go('/dashboard/billing/payment-collection')
          }
        >
          Payment collection
          <Icon name="ArrowRight" size={14} />
        </button>
      </div>
    </div>
  );
}