import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, CalendarDays, Check, Clock3, CreditCard, MessageCircle, Package, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { PageHeader, Panel, StatCard, StatGrid } from '../../../components/dashboard/common/DashboardUI';

const setupSteps = [
  { id: 'brain', title: 'Set up your AI Brain', description: 'Tell the AI what your business offers and how it should help customers.', time: '~4 min', route: '/dashboard/brain' },
  { id: 'profile', title: 'Complete your profile', description: 'Add your business details and contact information.', time: 'Done', complete: true, route: '/dashboard/profile' },
  { id: 'hours', title: 'Set your opening hours', description: 'Choose when your business is available for customers.', time: '1 min', route: '/dashboard/brain' },
  { id: 'test', title: 'Test your AI assistant', description: 'Try a customer question and review the expected response.', time: '1 min', route: '/dashboard/brain' },
  { id: 'whatsapp', title: 'Connect your WhatsApp', description: 'Connect your business number to start receiving chats.', time: '2 min', route: '/dashboard/channels' },
];

// Shows onboarding progress, business hours, early access offer, and zero-state activity metrics.
export default function DashboardHome() {
  const [completed, setCompleted] = useState(['profile']);
  const navigate = useNavigate();
  const progress = Math.round((completed.length / setupSteps.length) * 100);

  return (
    <>
      <PageHeader eyebrow="YOUR BUSINESS OVERVIEW" title="Welcome to Bellbee." description="Let's get your AI ready. Complete these steps to get started." />
      <Panel className="dp-onboarding-card">
        <div className="dp-onboarding-top"><div><span className="dp-section-kicker">GET STARTED</span><h2>Your setup checklist</h2><p>{completed.length} of 5 steps complete</p></div><div className="dp-progress-circle"><strong>{progress}%</strong></div></div>
        <div className="dp-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="dp-setup-list">
          {setupSteps.map((step, index) => {
            const done = completed.includes(step.id) || step.complete;
            return <div className={`dp-setup-step ${done ? 'completed' : ''}`} key={step.id}>
              <span className="dp-step-number">{done ? <Check size={16} /> : `0${index + 1}`}</span>
              <div className="dp-step-content"><strong>{step.title}</strong><p>{step.description}</p></div>
              <span className="dp-step-time">{done ? 'Done' : step.time}</span>
              {done ? <button type="button" className="dp-mark-complete" disabled>Complete</button> : <button type="button" className="dp-step-action" onClick={() => navigate(step.route)}>Set up <ArrowRight size={14} /></button>}
            </div>;
          })}
        </div>
      </Panel>

      <div className="dp-home-grid">
        <Panel className="dp-opening-hours"><div className="dp-panel-heading"><div><span className="dp-section-kicker">YOUR BUSINESS</span><h2>Opening hours</h2></div><CalendarDays size={20} /></div><div className="dp-hours-row"><span>Monday – Saturday</span><strong>09:00 – 18:00</strong></div><div className="dp-hours-row"><span>Sunday</span><strong className="dp-muted">Closed</strong></div><button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/brain')}>Edit opening hours <ArrowRight size={14} /></button></Panel>
        <section className="dp-early-bird"><span className="dp-early-bird-icon"><Sparkles size={20} /></span><span className="dp-section-kicker">EARLY-BIRD OFFER</span><h2>Unlock your early-bird price</h2><p>Get 49% off Bellbee, locked for 2 years. The offer unlocks when Bellbee replies to your first real customer.</p><button type="button" onClick={() => navigate('/dashboard/billing')}>Explore your plan <ArrowRight size={14} /></button></section>
      </div>

      <div className="dp-section-heading"><div><span className="dp-section-kicker">AT A GLANCE</span><h2>Your business activity</h2></div></div>
      <StatGrid columns={4}>
        <StatCard label="Total chats" value="0" icon={MessageCircle} />
        <StatCard label="Customers" value="0" icon={Users} accent="lavender" />
        <StatCard label="Orders" value="0" icon={ShoppingBag} accent="yellow" />
        <StatCard label="Appointments" value="0" icon={CalendarDays} accent="green" />
      </StatGrid>
      <div className="dp-home-shortcuts"><button type="button" onClick={() => navigate('/dashboard/products')}><Package size={17} /> Add a product</button><button type="button" onClick={() => navigate('/dashboard/brain')}><Bot size={17} /> Configure AI</button><button type="button" onClick={() => navigate('/dashboard/billing')}><CreditCard size={17} /> View plan</button><button type="button" onClick={() => navigate('/dashboard/appointments')}><Clock3 size={17} /> Manage bookings</button></div>
    </>
  );
}
