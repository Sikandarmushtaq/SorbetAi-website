import { plansApi } from '../../../services/dashboard/plans.api.js';
import './ChoosePlanPage.css';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Check, CreditCard, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
const allInOneFeatures = [
  'Appointment Booking', 'Order Management', 'Understands your menus, price lists & documents',
  'Finds answers from your business info instantly', 'WhatsApp automation', 'Campaigns and analytics',
  'Unlimited AI Brain documents', 'Unlimited staff profiles',
];

function planList(response) {
  return Array.isArray(response) ? response : response?.plans || response?.items || [];
}

// Displays the Bellbee plan catalogue and delegates plan changes to the billing API.
export default function ChoosePlanPage() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState('');
  const [error, setError] = useState('');
  const { isStarted, openFreePlan } = useFreePlan();
  const { showNotice, Notice } = useNotice();
  const navigate = useNavigate();

  const loadPlans = useCallback(async () => {
    if (!plansApi.isConfigured()) return;
    setLoading(true);
    setError('');
    try {
      const response = await plansApi.request();
      setPlans(planList(response));
      setCurrentPlan(response?.current_plan || response?.subscription?.plan || null);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  // Requests a selected plan from the backend without collecting payment details in the browser.
  const choosePlan = async (plan) => {
    if (plan.is_free || String(plan.price || '').toLowerCase() === 'free') {
      openFreePlan();
      return;
    }
    if (!plansApi.isConfigured()) return showNotice('Plan selection API is not configured yet.');
    setSelecting(plan.id || plan.slug || plan.name);
    try {
      const result = await plansApi.request({ method: 'POST', action: 'select', body: { plan_id: plan.id || plan.slug } });
      const checkoutUrl = result?.checkout_url || result?.payment_url;
      if (checkoutUrl) window.location.assign(checkoutUrl);
      else showNotice(result?.message || 'Your plan selection was received.');
    } catch (requestError) { showNotice(requestError.message); }
    finally { setSelecting(''); }
  };

  return (
    <>
      <PageHeader eyebrow="BILLING / PLANS" title="Choose a plan" description="Find the right Bellbee plan for your business." actions={<button type="button" className="dp-secondary-button" onClick={loadPlans} disabled={loading}><RefreshCw size={14} /> Refresh plans</button>} />
      {Notice}
      {error && <div className="dp-inline-notice dp-api-error" role="status">{error}</div>}
      <Panel className="dp-plan-free-card"><div className="dp-plan-free-top"><span className="dp-section-kicker">START HERE</span><span className="dp-status-pill success">Free · No card needed</span></div><div className="dp-plan-free-content"><div><h2>Start your free plan</h2><p>Activate Bellbee AI and explore the core experience before choosing a paid subscription.</p><ul className="dp-plan-feature-list">{['3M AI tokens in month 1, 2M in month 2, then 1M every month', 'No card required', 'Pause your AI any time', 'No expiry'].map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul></div><button type="button" className="dp-primary-button" onClick={() => isStarted ? navigate('/dashboard/billing') : openFreePlan()}>{isStarted ? 'View current plan' : 'Start free plan'} <ArrowRight size={14} /></button></div></Panel>
      <section className="dp-plan-catalogue-heading"><div><span className="dp-section-kicker">ALL-IN-ONE</span><h2>All in One Plan</h2><p>The complete Bellbee experience, with no module restrictions.</p></div><BadgeCheck size={24} /></section>
      <Panel className="dp-plan-catalogue-card"><div className="dp-plan-catalogue-copy"><span className="dp-status-pill neutral">{currentPlan?.name || (isStarted ? 'Free plan active' : 'Available plan')}</span><h2>All in One Plan</h2><p>The complete Bellbee experience, no module restrictions. AI-powered WhatsApp automation across conversations, appointments, and orders, plus campaigns, analytics, and your full AI Brain with unlimited documents and staff profiles. Built for businesses that want every feature available from day one.</p><div className="dp-plan-catalogue-features">{allInOneFeatures.map((feature) => <span key={feature}><Check size={14} />{feature}</span>)}</div></div><div className="dp-plan-catalogue-action"><Sparkles size={25} /><strong>{currentPlan?.price_label || currentPlan?.price || 'Pricing available at checkout'}</strong><small>Plan price and billing terms are confirmed by the billing API.</small><button type="button" className="dp-primary-button" onClick={() => choosePlan(plans.find((item) => item.slug === 'all-in-one' || item.name === 'All in One Plan') || { id: 'all-in-one', name: 'All in One Plan' })} disabled={Boolean(selecting)}>{selecting ? 'Continuing…' : 'Choose All in One'} <ArrowRight size={14} /></button></div></Panel>
      {loading && <div className="dp-api-empty-state">Loading available plans…</div>}
      {plans.length > 0 && <div className="dp-plan-extra-grid">{plans.filter((plan) => !String(plan.name || '').toLowerCase().includes('all in one')).map((plan) => <Panel className="dp-plan-extra-card" key={plan.id || plan.slug || plan.name}><span className="dp-section-kicker">{plan.interval || 'BELLBEE PLAN'}</span><h3>{plan.name}</h3><strong>{plan.price_label || plan.price || 'Contact for pricing'}</strong><p>{plan.description}</p><button type="button" className="dp-secondary-button" onClick={() => choosePlan(plan)} disabled={Boolean(selecting)}>{selecting === (plan.id || plan.slug || plan.name) ? 'Continuing…' : 'Select plan'} <ArrowRight size={14} /></button></Panel>)}</div>}
      {!plansApi.isConfigured() && <p className="dp-form-note"><CreditCard size={13} /> The plans catalogue and paid checkout are ready for the backend. Configure the plans endpoint to load confirmed prices and options.</p>}
      <div className="dp-plan-security-note"><ShieldCheck size={17} /><span>Payment details are handled by the secure billing provider flow, not stored in this page.</span></div>
    </>
  );
}
