import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';

// Summarizes the current plan and routes add-on discovery to its own page.
export default function BillingPage() {
  const navigate = useNavigate();
  const { showNotice, Notice } = useNotice();
  return <>
    <PageHeader eyebrow="SYSTEM" title="Billing & Subscription" description="Manage your plan, usage, payment options and billing history." />
    {Notice}
    <section className="dp-billing-hero"><div className="dp-billing-hero-icon"><Sparkles size={24} /></div><span className="dp-section-kicker">YOUR CURRENT PLAN</span><h2>Free plan not started</h2><p>Your AI is off until you start your free plan. Free, no card needed, and it never expires. You can move to a paid plan any time.</p><button type="button" className="dp-primary-button" onClick={() => showNotice('Starting a plan requires the billing backend and payment integration.')}>Start free plan <ArrowRight size={14} /></button></section>
    <div className="dp-billing-grid"><Panel><span className="dp-section-kicker">THIS PERIOD</span><h2>Current billing</h2><div className="dp-inline-empty"><CreditCard size={20} />Nothing to track yet. Billing and usage will show here once you subscribe to a plan.</div></Panel><Panel><span className="dp-section-kicker">PLAN EXTENSIONS</span><h2>Available add-ons</h2><p className="dp-panel-description">Extend your Bellbee plan with additional business capabilities.</p><button type="button" className="dp-secondary-button" onClick={() => navigate('/dashboard/billing/addons')}>View all add-ons <ArrowRight size={14} /></button></Panel></div>
    <div className="dp-section-heading"><div><span className="dp-section-kicker">COMPARE PLANS</span><h2>All in One Plan</h2></div></div>
    <section className="dp-plan-card"><div><span className="dp-section-kicker">BUSINESS PLAN</span><h2>All in One Plan</h2><p>10,000,000 free tokens/month</p><small>Payment collection and usage reports will be available when billing is connected.</small></div><div className="dp-plan-price"><strong>£49</strong><span>/ month + card fee</span></div></section>
  </>;
}
