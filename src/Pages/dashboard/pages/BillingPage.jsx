import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Check, CreditCard, Globe, Package, RefreshCw,
  Sparkles, Truck, Users, Wallet,
} from 'lucide-react';
import { EmptyState, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const activePlanFeatures = [
  'Appointment Booking', 'Order Management',
  'Understands your menus, price lists & documents',
  'Finds answers from your business info instantly',
];

function amount(value, currency = 'GBP') {
  if (value === null || value === undefined || value === '') return '—';
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(value)); }
  catch { return `${currency} ${value}`; }
}

function dateLabel(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
}

// Loads the current subscription and switches the upper billing section after free-plan activation.
export default function BillingPage() {
  const navigate = useNavigate();
  const { isStarted, isChecking, openFreePlan } = useFreePlan();
  const { Notice } = useNotice();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadBilling = useCallback(async () => {
    if (!isResourceConfigured('billing')) {
      setBilling(null);
      setLoadError('Billing API is not configured yet. Connect the billing endpoint to show live subscription and credit details.');
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const response = await resourceRequest('billing');
      setBilling(response?.billing || response);
    } catch (error) { setLoadError(error.message); setBilling(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBilling(); }, [loadBilling]);

  // Opens the shared activation modal and refreshes the billing data after activation succeeds.
  const startFreePlan = () => openFreePlan(loadBilling);

  const subscription = billing?.subscription || billing?.plan || {};
  const credit = billing?.ai_credits || billing?.credits || {};
  const monthly = billing?.monthly_credit_use || billing?.monthly_usage || {};
  const currency = credit.currency || billing?.currency || 'GBP';
  const planName = subscription.plan_name || subscription.name || billing?.plan_name || 'All in One Plan';
  const daysRemaining = subscription.days_remaining ?? subscription.renews_in_days ?? billing?.days_remaining;
  const renewalDate = subscription.renews_at || subscription.renewal_date || credit.renews_at || billing?.credit_renews_at;
  const remainingReplies = credit.replies_remaining ?? credit.estimated_replies_remaining;
  const includedCredit = credit.included_this_month ?? credit.monthly_included ?? monthly.limit ?? monthly.included;
  const usedCredit = credit.used_this_month ?? credit.spent_this_month ?? monthly.used ?? monthly.amount;

  const addons = [
    { title: 'Store Integration', price: billing?.addons?.store_integration?.price || '£5 / month', description: 'Connect WooCommerce or a custom store so orders and product data flow into Bellbee.', icon: Package, route: '/dashboard/billing/addons' },
    { title: 'Courier Integrations', price: billing?.addons?.courier_integrations?.price || '£6 / month', description: 'Connect supported couriers for shipment booking and delivery updates.', icon: Truck, route: '/dashboard/billing/addons' },
    { title: 'Website Chat Widget', price: billing?.addons?.website_chat?.price || 'Free', description: 'Embed a Bellbee-powered chat widget directly on your business website.', icon: Globe, route: '/dashboard/website-chat' },
    { title: 'Facebook & Instagram', price: billing?.addons?.social_channels?.price || 'Free', description: 'Answer Facebook Messenger and Instagram messages with your AI assistant.', icon: Users, route: '/dashboard/facebook-instagram' },
  ];

  return (
    <>
      <PageHeader title="Billing & Subscription" description="Manage your plan, usage, and billing history." actions={<button type="button" className="dp-secondary-button" onClick={loadBilling} disabled={loading}><RefreshCw size={14} /> Refresh</button>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}

      {isChecking ? <div className="dp-api-empty-state">Checking your plan status…</div> : isStarted ? <div className="dp-active-billing-grid">
        <Panel className="dp-active-plan-panel">
          <div className="dp-active-plan-top"><span className="dp-section-kicker">YOUR PLAN</span><span className="dp-status-pill success">TRIAL</span></div>
          <h2>{planName}</h2>
          <p className="dp-active-plan-description">The complete Bellbee experience, no module restrictions. AI-powered WhatsApp automation across conversations, appointments, and orders, plus campaigns, analytics, and your full AI Brain with unlimited documents and staff profiles. Built for businesses that want every feature available from day one.</p>
          <div className="dp-active-plan-features">{activePlanFeatures.map((feature) => <span key={feature}><Check size={14} />{feature}</span>)}</div>
          <div className="dp-active-plan-footer"><strong>Free plan · Month {subscription.month_number || billing?.free_plan_month || 1}</strong><span>Renews · <b>{daysRemaining !== undefined ? `${daysRemaining} days remaining` : renewalDate ? dateLabel(renewalDate) : 'Renewal details pending'}</b></span></div>
          <button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/billing/plans')}>Upgrade to Paid <ArrowRight size={14} /></button>
        </Panel>

        <Panel className="dp-current-billing-panel">
          <span className="dp-section-kicker">THIS PERIOD</span><h2>Current Billing</h2>
          <strong className="dp-current-billing-status">Free</strong>
          <div className="dp-current-credit-value">{loading ? '—' : amount(credit.remaining ?? credit.credit_remaining ?? billing?.credit_remaining, currency)}</div>
          <p>AI credit left{remainingReplies != null ? ` · about ${Number(remainingReplies).toLocaleString()} replies` : ''}</p>
          <div className="dp-credit-usage-heading"><strong>Monthly credit use</strong><b>{amount(usedCredit, currency)} of {amount(includedCredit, currency)}</b></div>
          <div className="dp-credit-track"><span style={{ width: `${Math.max(0, Math.min(100, Number(includedCredit) ? Number(usedCredit || 0) / Number(includedCredit) * 100 : 0))}%` }} /></div>
          <p className="dp-current-renewal">Monthly credit renews {dateLabel(renewalDate)}</p>
          <p className="dp-current-included">Includes <strong>{amount(includedCredit, currency)}</strong> of AI credit this month</p>
          <button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/billing/reports')}>View detailed usage <ArrowRight size={14} /></button>
        </Panel>
      </div> : <Panel className="dp-free-plan-start-card">
        <div className="dp-billing-hero-icon"><Sparkles size={22} /></div><span className="dp-section-kicker">YOUR PLAN</span><h2>Start your free plan</h2><p>Your AI needs it to reply. It takes one click. Free, no card needed, and it never expires.</p><button type="button" className="dp-primary-button" onClick={startFreePlan}>Start free plan <ArrowRight size={14} /></button>
        <div className="dp-free-plan-credit-empty"><EmptyState icon={CalendarDays} title="Nothing to track yet" description="Your AI credit usage and billing activity will appear here after your free plan is active." /></div>
      </Panel>}

      <div className="dp-section-heading dp-billing-section-heading"><div><span className="dp-section-kicker">ADD-ONS</span><h2>Extend your Bellbee plan</h2></div><button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/billing/addons')}>View all add-ons <ArrowRight size={14} /></button></div>
      <div className="dp-addon-grid dp-addon-grid-four dp-billing-addon-grid">{addons.map(({ title, price, description, icon: Icon, route }) => <Panel className="dp-addon-card" key={title}><span className="dp-addon-icon"><Icon size={21} /></span><h3>{title}</h3><strong>{price}</strong><p>{description}</p><button type="button" className="dp-secondary-button" onClick={() => navigate(route)}>Manage <ArrowRight size={14} /></button></Panel>)}</div>

      <div className="dp-section-heading dp-billing-section-heading"><div><span className="dp-section-kicker">PLANS</span><h2>All in One Plan</h2></div><button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/billing/plans')}>Choose a plan <ArrowRight size={14} /></button></div>
      <Panel className="dp-plan-card dp-plan-detail-card"><div><span className="dp-section-kicker">THE COMPLETE BELLBEE EXPERIENCE</span><h2>All in One Plan</h2><p>Every module in one subscription, with AI-powered customer conversations, appointments, orders, campaigns, analytics and your full AI Brain.</p><ul className="dp-plan-feature-list">{['Appointment Booking', 'Order Management', 'WhatsApp automation', 'Campaigns and analytics', 'Unlimited AI Brain documents', 'Unlimited staff profiles'].map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul></div><div className="dp-plan-price"><strong>{billing?.plans?.all_in_one?.price_label || billing?.plans?.all_in_one?.price || 'All features'}</strong><span>Plan details and billing terms are confirmed at checkout.</span><button type="button" className="dp-primary-button" onClick={() => navigate('/dashboard/billing/plans')}>View plan <ArrowRight size={14} /></button></div></Panel>

      <div className="dp-section-heading dp-billing-section-heading"><div><span className="dp-section-kicker">MORE</span><h2>Billing tools</h2></div></div>
      <div className="dp-billing-links-grid dp-billing-more-grid">
        <Panel><div className="dp-panel-heading"><div><span className="dp-section-kicker">PAYMENT HISTORY</span><h2>Billing reports</h2></div><Wallet size={20} /></div><p className="dp-panel-description">Review AI credit usage, daily activity and billing history.</p><button type="button" className="dp-secondary-button" onClick={() => navigate('/dashboard/billing/reports')}>View reports <ArrowRight size={14} /></button></Panel>
        <Panel><div className="dp-panel-heading"><div><span className="dp-section-kicker">PAYMENT COLLECTION</span><h2>Customer payments</h2></div><CreditCard size={20} /></div><p className="dp-panel-description">Connect and manage payment providers for customer collections.</p><button type="button" className="dp-secondary-button" onClick={() => navigate('/dashboard/billing/payment-collection')}>Payment collection <ArrowRight size={14} /></button></Panel>
      </div>
      {!isResourceConfigured('billing') && <p className="dp-form-note">Billing is ready for API integration. Configure REACT_APP_API_BILLING_PATH to load real subscription, renewal and credit information.</p>}
    </>
  );
}
