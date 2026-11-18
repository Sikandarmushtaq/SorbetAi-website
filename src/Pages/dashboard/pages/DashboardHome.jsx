import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, CalendarDays, Check, ChevronDown, ChevronUp, Clock3, CreditCard, MessageCircle, Package, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { PageHeader, Panel, StatCard, StatGrid, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { getCurrentUser, getCurrentWorkspace, isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const setupSteps = [
  { id: 'brain', title: 'Set up your AI Brain', description: 'Tell the AI what your business offers and how it should help customers.', time: '~4 min', route: '/dashboard/brain?tab=setup' },
  { id: 'profile', title: 'Complete your profile', description: 'Add your account and business details.', time: '1 min', route: '/dashboard/profile' },
  { id: 'plan', title: 'Start your free plan', description: 'Activate your free AI tokens. No card needed.', time: '1 min', plan: true },
  { id: 'test', title: 'Test your AI assistant', description: 'Try a customer question and review the response.', time: '1 min', route: '/dashboard/brain?tab=test-ai' },
  { id: 'whatsapp', title: 'Connect your WhatsApp', description: 'Connect your business number to start receiving chats.', time: '2 min', route: '/whatsapp' },
];

function overviewValue(overview, key) {
  return overview?.stats?.[key] ?? overview?.metrics?.[key] ?? overview?.[key] ?? '—';
}

function completedStepIds(value) {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : item.id || item.key).filter(Boolean);
  if (value && typeof value === 'object') return Object.entries(value).filter(([, complete]) => Boolean(complete?.is_complete ?? complete?.completed ?? complete)).map(([key]) => key);
  return [];
}

// Builds the dashboard overview from the authenticated account and saved onboarding and activity data.
export default function DashboardHome() {
  const [overview, setOverview] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [businessHours, setBusinessHours] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isConfirmingHours, setIsConfirmingHours] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const navigate = useNavigate();
  const { openFreePlan, isStarted } = useFreePlan();
  const { showNotice, Notice } = useNotice();

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    const [overviewResult, onboardingResult, hoursResult, userResult, workspaceResult] = await Promise.allSettled([
      resourceRequest('dashboardOverview'),
      resourceRequest('onboarding'),
      resourceRequest('businessHours'),
      getCurrentUser(),
      getCurrentWorkspace(),
    ]);
    if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value?.overview || overviewResult.value);
    else setLoadError(overviewResult.reason.message);
    if (onboardingResult.status === 'fulfilled') setCompleted(completedStepIds(onboardingResult.value?.completed_steps || onboardingResult.value?.steps || onboardingResult.value));
    if (hoursResult.status === 'fulfilled') setBusinessHours(hoursResult.value?.hours || hoursResult.value);
    if (userResult.status === 'fulfilled') setUser(userResult.value);
    if (workspaceResult.status === 'fulfilled') setWorkspace(workspaceResult.value);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const isStepComplete = (step) => completed.includes(step.id) || (step.plan && isStarted);
  const doneCount = setupSteps.filter(isStepComplete).length;
  const progress = Math.round((doneCount / setupSteps.length) * 100);
  const nextStep = setupSteps.find((step) => !isStepComplete(step));
  const welcomeName = workspace?.name || overview?.workspace_name || user?.full_name || 'there';
  const showHoursConfirmation = Boolean(businessHours?.is_default_example || businessHours?.is_example_hours);
  const weekDays = businessHours?.days || businessHours?.weekly_hours || [];
  const hoursSummary = overview?.business_hours_summary || businessHours?.summary || '';
  const appName = workspace?.name || 'Bellbee';

  const markCurrentStepComplete = async () => {
    if (!nextStep || !isResourceConfigured('onboarding')) return;
    setIsConfirmingHours(true);
    try {
      await resourceRequest('onboarding', { method: 'PATCH', id: nextStep.id, body: { is_complete: true } });
      setCompleted((current) => current.includes(nextStep.id) ? current : [...current, nextStep.id]);
      showNotice('Setup step marked complete.');
      await loadOverview();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsConfirmingHours(false);
    }
  };

  const confirmHours = async () => {
    setIsConfirmingHours(true);
    try {
      await resourceRequest('businessHours', { method: 'POST', action: 'confirm-defaults', body: {} });
      setBusinessHours((current) => current ? { ...current, is_default_example: false, is_example_hours: false, is_confirmed: true } : current);
      showNotice('Your opening hours have been confirmed.');
      await loadOverview();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsConfirmingHours(false);
    }
  };

  const stats = useMemo(() => [
    { label: 'Total chats', value: overviewValue(overview, 'total_chats'), icon: MessageCircle },
    { label: 'Customers', value: overviewValue(overview, 'customers'), icon: Users, accent: 'lavender' },
    { label: 'Orders', value: overviewValue(overview, 'orders'), icon: ShoppingBag, accent: 'yellow' },
    { label: 'Appointments', value: overviewValue(overview, 'appointments'), icon: CalendarDays, accent: 'green' },
  ], [overview]);

  return (
    <>
      <PageHeader eyebrow="YOUR BUSINESS OVERVIEW" title="Dashboard" description={`Welcome to ${appName}, ${welcomeName}. Here's what needs your attention.`} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}

      <Panel className="dp-onboarding-card">
        <div className="dp-onboarding-top"><div><span className="dp-section-kicker">GET STARTED</span><h2>Your setup checklist</h2><p>{isLoading ? 'Loading saved setup progress…' : `${doneCount} of ${setupSteps.length} steps complete · About 9 minutes in total`}</p></div><button type="button" className="dp-icon-action" onClick={() => setIsCollapsed((value) => !value)} aria-expanded={!isCollapsed} aria-label={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}>{isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button></div>
        <div className="dp-progress-segments" aria-label={`${doneCount} of ${setupSteps.length} setup steps complete`}>{setupSteps.map((step) => <span className={isStepComplete(step) ? 'complete' : ''} key={step.id} />)}</div>
        {!isCollapsed && <>
          {nextStep && <div className="dp-next-step-card"><div><span className="dp-section-kicker">NEXT STEP</span><h3>{nextStep.title}</h3><p>{nextStep.description}</p><small><Clock3 size={13} /> {nextStep.time}</small></div><div className="dp-next-step-actions"><button type="button" className="dp-primary-button" onClick={() => nextStep.plan ? openFreePlan() : navigate(nextStep.route)}>{nextStep.plan ? 'Start free plan' : 'Continue'} <ArrowRight size={14} /></button>{!nextStep.plan && <button type="button" className="dp-text-button" onClick={markCurrentStepComplete} disabled={isConfirmingHours || !isResourceConfigured('onboarding')}>{isConfirmingHours ? 'Saving…' : 'Mark complete'}</button>}</div></div>}
          {setupSteps.map((step, index) => {
            const isComplete = isStepComplete(step);
            return <div className={`dp-setup-step ${isComplete ? 'completed' : ''}`} key={step.id}>
              <span className="dp-step-number">{isComplete ? <Check size={16} /> : `0${index + 1}`}</span>
              <div className="dp-step-content"><strong>{step.title}</strong><p>{step.description}</p></div>
              <span className="dp-step-time">{isComplete ? 'Done' : step.time}</span>
              {isComplete ? <span className="dp-mark-complete">Complete</span> : <button type="button" className="dp-step-action" onClick={() => step.plan ? openFreePlan() : navigate(step.route)}>{step.plan ? 'Start' : 'Set up'} <ArrowRight size={14} /></button>}
            </div>;
          })}
          {!isResourceConfigured('onboarding') && <p className="dp-form-note">Connect the onboarding API to load and save your checklist progress.</p>}
        </>}
      </Panel>

      {showHoursConfirmation && <Panel className="dp-opening-hours-confirmation"><div className="dp-panel-heading"><div><span className="dp-section-kicker">PLEASE CONFIRM</span><h2>Are these your opening hours?</h2></div><CalendarDays size={20} /></div>
        <p className="dp-panel-description">{hoursSummary || 'These example hours are currently saved for your business.'}</p>
        {weekDays.length > 0 && <div className="dp-hours-confirmation-list">{weekDays.map((day) => <div className="dp-hours-row" key={day.day || day.name}><span>{day.day || day.name}</span><strong>{day.is_closed || day.closed ? 'Closed' : `${day.open || day.open_time || ''} – ${day.close || day.close_time || ''}`}</strong></div>)}</div>}
        <div className="dp-opening-hours-actions"><button type="button" className="dp-primary-button" onClick={confirmHours} disabled={isConfirmingHours}>{isConfirmingHours ? 'Saving…' : 'Yes, these are my hours'}</button><button type="button" className="dp-secondary-button" onClick={() => navigate('/dashboard/brain?tab=hours-staff')}>Change hours</button></div>
      </Panel>}

      <div className="dp-home-grid">
        <Panel className="dp-opening-hours"><div className="dp-panel-heading"><div><span className="dp-section-kicker">YOUR BUSINESS</span><h2>Opening hours</h2></div><CalendarDays size={20} /></div>
          {weekDays.length ? weekDays.map((day) => <div className="dp-hours-row" key={day.day || day.name}><span>{day.day || day.name}</span><strong>{day.is_closed || day.closed ? 'Closed' : `${day.open || day.open_time || ''} – ${day.close || day.close_time || ''}`}</strong></div>) : <div className="dp-inline-empty">Business hours have not been returned by the API.</div>}
          <button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/brain?tab=hours-staff')}>Edit opening hours <ArrowRight size={14} /></button>
        </Panel>
        <section className="dp-early-bird"><span className="dp-early-bird-icon"><Sparkles size={20} /></span><span className="dp-section-kicker">EARLY-BIRD OFFER</span><h2>Unlock your early-bird price</h2><p>Get 49% off Bellbee, locked for 2 years. The offer unlocks when Bellbee replies to your first real customer.</p><button type="button" onClick={() => navigate('/dashboard/billing')}>Explore your plan <ArrowRight size={14} /></button></section>
      </div>

      <div className="dp-section-heading"><div><span className="dp-section-kicker">AT A GLANCE</span><h2>Your business activity</h2></div></div>
      <StatGrid columns={4}>{stats.map((item) => <StatCard key={item.label} label={item.label} value={isLoading ? '—' : Number.isFinite(Number(item.value)) ? Number(item.value).toLocaleString() : item.value} icon={item.icon} accent={item.accent} />)}</StatGrid>
      <div className="dp-home-shortcuts"><button type="button" onClick={() => navigate('/dashboard/products')}><Package size={17} /> Add a product</button><button type="button" onClick={() => navigate('/dashboard/brain?tab=setup')}><Bot size={17} /> Configure AI</button><button type="button" onClick={() => navigate('/dashboard/billing')}><CreditCard size={17} /> View plan</button><button type="button" onClick={() => navigate('/dashboard/appointments')}><Clock3 size={17} /> Manage bookings</button></div>
    </>
  );
}
