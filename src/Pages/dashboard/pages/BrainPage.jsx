import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bot, Building2, CalendarDays, Clock3, Copy, FileText,
  Lightbulb, MapPin, Package, Pencil, Plus, RotateCcw, Search,
  Send, Settings, Sparkles, Trash2, Users, X,
} from 'lucide-react';
import {
  EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal,
  PageHeader, Panel, Tabs, useNotice,
} from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { getCurrentWorkspace, isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const brainTabs = [
  { label: 'What AI knows', value: 'what-ai-knows' },
  { label: 'Setup', value: 'setup' },
  { label: 'Hours & Staff', value: 'hours-staff' },
  { label: 'Locations', value: 'locations' },
  { label: 'Knowledge', value: 'knowledge' },
  { label: 'Requests', value: 'requests' },
  { label: 'Test AI', value: 'test-ai' },
];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptySetup = {
  business_name: '', industry: '', whatsapp_number: '', business_address: '', business_description: '',
  agent_name: '', agent_gender: 'Not set', reply_language: 'Automatic', tone: 'Friendly', reply_length: 'Balanced',
  custom_instructions: '', goodbye_message: '',
};
const emptyRules = { offer_time: 'First available', booking_gap: '15 minutes', minimum_notice: '1 hour', book_ahead: '30 days', concurrent_customers: '1' };
const emptyStaff = { name: '', role: '', phone: '', hours_mode: 'business', start_time: '', end_time: '' };
const emptyLocation = { name: '', address: '', phone: '', notes: '' };
const emptyRequest = { name: '', detailsToCollect: '', whatHappensNext: '' };

function recordsFrom(response, key) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.[key] || [];
}

function normaliseHours(response) {
  const source = Array.isArray(response) ? response : response?.days || response?.weekly_hours || response?.hours || [];
  const raw = Array.isArray(source)
    ? source
    : Object.entries(source || {}).map(([day, details]) => ({ day, ...(details || {}) }));
  return weekDays.map((day) => {
    const saved = raw.find((item) => String(item.day || item.name).toLowerCase() === day.toLowerCase()) || {};
    return {
      day,
      enabled: saved.enabled ?? saved.is_open ?? (saved.is_closed !== undefined ? !saved.is_closed : false),
      is_24_hours: Boolean(saved.is_24_hours || saved.all_day),
      start_time: saved.start_time || saved.open_time || saved.open || '',
      end_time: saved.end_time || saved.close_time || saved.close || '',
      breaks: Array.isArray(saved.breaks) ? saved.breaks : [],
    };
  });
}


// Coordinates the URL-driven AI Brain sections and keeps all business knowledge connected to API data.
export default function BrainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedTab = searchParams.get('tab') || 'what-ai-knows';
  const tab = brainTabs.some((item) => item.value === selectedTab) ? selectedTab : 'what-ai-knows';
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [setup, setSetup] = useState(emptySetup);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupSaving, setSetupSaving] = useState(false);
  const [hours, setHours] = useState(() => normaliseHours([]));
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [rules, setRules] = useState(emptyRules);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [closedDates, setClosedDates] = useState([]);
  const [closedDate, setClosedDate] = useState({ date: '', reason: '' });
  const [staff, setStaff] = useState([]);
  const [locations, setLocations] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [sectionErrors, setSectionErrors] = useState({});
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState(emptyStaff);
  const [locationModal, setLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [requestModal, setRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [savingModal, setSavingModal] = useState(false);
  const [knowledgeFile, setKnowledgeFile] = useState(null);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [searchingKnowledge, setSearchingKnowledge] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantSending, setAssistantSending] = useState(false);
  const [question, setQuestion] = useState('');
  const [testMessages, setTestMessages] = useState([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const { showNotice, Notice } = useNotice();
  const { isStarted, isStatusKnown, isChecking: isCheckingPlan, openFreePlan } = useFreePlan();

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const response = await resourceRequest('brainOverview');
      setOverview(response?.overview || response);
    } catch (error) {
      setOverview(null);
      setOverviewError(error.message);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useEffect(() => {
    let active = true;
    const loadSetup = async () => {
      setSetupLoading(true);
      setSectionErrors((current) => ({ ...current, setup: '' }));
      try {
        const [setupResponse, workspaceResponse] = await Promise.all([
          resourceRequest('brainSetup'),
          getCurrentWorkspace().catch(() => null),
        ]);
        if (!active) return;
        const saved = setupResponse?.profile || setupResponse?.settings || setupResponse;
        setSetup({ ...emptySetup, ...saved, ...(!saved.business_name && workspaceResponse?.name ? { business_name: workspaceResponse.name } : {}) });
      } catch (error) {
        if (active) setSectionErrors((current) => ({ ...current, setup: error.message }));
      } finally {
        if (active) setSetupLoading(false);
      }
    };
    if (tab === 'setup') loadSetup();
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      setHoursLoading(true);
      setSectionErrors((current) => ({ ...current, hours: '' }));
      const [hoursResult, rulesResult, datesResult, staffResult] = await Promise.allSettled([
        resourceRequest('businessHours'), resourceRequest('bookingRules'), resourceRequest('closedDates'), resourceRequest('staff'),
      ]);
      if (!active) return;
      if (hoursResult.status === 'fulfilled') setHours(normaliseHours(hoursResult.value));
      else setSectionErrors((current) => ({ ...current, hours: hoursResult.reason.message }));
      if (rulesResult.status === 'fulfilled') setRules({ ...emptyRules, ...(rulesResult.value?.rules || rulesResult.value) });
      if (datesResult.status === 'fulfilled') setClosedDates(recordsFrom(datesResult.value, 'dates'));
      if (staffResult.status === 'fulfilled') setStaff(recordsFrom(staffResult.value, 'staff'));
      setHoursLoading(false);
    };
    if (tab === 'hours-staff') loadSchedule();
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    let active = true;
    if (tab !== 'locations') return undefined;
    setSectionErrors((current) => ({ ...current, locations: '' }));
    resourceRequest('locations')
      .then((response) => { if (active) setLocations(recordsFrom(response, 'locations')); })
      .catch((error) => { if (active) { setLocations([]); setSectionErrors((current) => ({ ...current, locations: error.message })); } });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    let active = true;
    if (tab !== 'knowledge') return undefined;
    setSectionErrors((current) => ({ ...current, knowledge: '' }));
    resourceRequest('knowledge')
      .then((response) => { if (active) setKnowledge(recordsFrom(response, 'documents')); })
      .catch((error) => { if (active) { setKnowledge([]); setSectionErrors((current) => ({ ...current, knowledge: error.message })); } });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    let active = true;
    if (tab !== 'requests') return undefined;
    setIsRequestLoading(true);
    setRequestError('');
    resourceRequest('requestTypes')
      .then((response) => { if (active) setRequestTypes(recordsFrom(response, 'request_types')); })
      .catch((error) => { if (active) setRequestError(error.message); })
      .finally(() => { if (active) setIsRequestLoading(false); });
    return () => { active = false; };
  }, [tab]);

  const changeTab = (label, hash = '') => {
    const value = brainTabs.find((item) => item.label === label)?.value || 'what-ai-knows';
    const params = new URLSearchParams(searchParams);
    if (value === 'what-ai-knows') params.delete('tab');
    else params.set('tab', value);
    setSearchParams(params, { replace: true });
    if (hash) requestAnimationFrame(() => document.getElementById(hash.split('#')[1])?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const updateSetup = (key, value) => setSetup((current) => ({ ...current, [key]: value }));
  const saveSetup = async (event) => {
    event.preventDefault();
    setSetupSaving(true);
    try {
      await resourceRequest('brainSetup', { method: 'PATCH', body: setup });
      showNotice('AI Brain setup saved.');
      await loadOverview();
    } catch (error) {
      setSectionErrors((current) => ({ ...current, setup: error.message }));
    } finally {
      setSetupSaving(false);
    }
  };

  const saveHours = async () => {
    setHoursSaving(true);
    try {
      await resourceRequest('businessHours', { method: 'PUT', body: { days: hours } });
      showNotice('Business hours saved.');
      await loadOverview();
    } catch (error) { setSectionErrors((current) => ({ ...current, hours: error.message })); }
    finally { setHoursSaving(false); }
  };

  const saveRules = async () => {
    setRulesSaving(true);
    try {
      await resourceRequest('bookingRules', { method: 'PUT', body: rules });
      showNotice('Booking rules saved.');
    } catch (error) { setSectionErrors((current) => ({ ...current, rules: error.message })); }
    finally { setRulesSaving(false); }
  };

  const updateHour = (index, key, value) => setHours((current) => current.map((day, dayIndex) => dayIndex === index ? { ...day, [key]: value } : day));
  const copyMondayHours = () => setHours((current) => current.map((day, index) => index === 0 || index === 6 ? day : { ...day, enabled: current[0].enabled, is_24_hours: current[0].is_24_hours, start_time: current[0].start_time, end_time: current[0].end_time, breaks: current[0].breaks }));
  const addBreak = (index) => setHours((current) => current.map((day, dayIndex) => dayIndex === index ? { ...day, breaks: [...day.breaks, { start_time: '', end_time: '' }] } : day));
  const updateBreak = (dayIndex, breakIndex, key, value) => setHours((current) => current.map((day, index) => index === dayIndex ? { ...day, breaks: day.breaks.map((pause, ix) => ix === breakIndex ? { ...pause, [key]: value } : pause) } : day));

  const addClosedDate = async (event) => {
    event.preventDefault();
    try {
      const response = await resourceRequest('closedDates', { method: 'POST', body: closedDate });
      const created = response?.date || response;
      if (created && (created.id || created.date)) setClosedDates((current) => [...current, created]);
      setClosedDate({ date: '', reason: '' });
    } catch (error) { setSectionErrors((current) => ({ ...current, hours: error.message })); }
  };

  const deleteResource = async (resource, item, setter, key) => {
    const id = item.id || item[`${key}_id`] || item.date;
    try {
      await resourceRequest(resource, { method: 'DELETE', id });
      setter((current) => current.filter((entry) => String(entry.id || entry[`${key}_id`]) !== String(id)));
    } catch (error) { showNotice(error.message); }
  };

  const saveStaff = async (event) => {
    event.preventDefault();
    setSavingModal(true);
    try {
      const response = await resourceRequest('staff', { method: 'POST', body: { ...staffForm, role: staffForm.role.trim(), name: staffForm.name.trim(), phone: staffForm.phone.trim() } });
      const created = response?.staff_member || response;
      if (created && (created.id || created.staff_id)) setStaff((current) => [created, ...current]);
      setStaffForm(emptyStaff);
      setStaffModal(false);
    } catch (error) { showNotice(error.message); }
    finally { setSavingModal(false); }
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    setSavingModal(true);
    try {
      const response = await resourceRequest('locations', { method: 'POST', body: locationForm });
      const created = response?.location || response;
      if (created && (created.id || created.location_id)) setLocations((current) => [created, ...current]);
      setLocationForm(emptyLocation);
      setLocationModal(false);
    } catch (error) { showNotice(error.message); }
    finally { setSavingModal(false); }
  };

  const saveKnowledgeFile = async (event) => {
    event.preventDefault();
    if (!knowledgeFile) return;
    setSavingModal(true);
    try {
      const payload = new FormData();
      payload.append('file', knowledgeFile);
      const response = await resourceRequest('knowledge', { method: 'POST', body: payload });
      const created = response?.document || response;
      if (created && (created.id || created.document_id)) setKnowledge((current) => [created, ...current]);
      setKnowledgeFile(null);
    } catch (error) { showNotice(error.message); }
    finally { setSavingModal(false); }
  };

  const checkKnowledge = async (event) => {
    event.preventDefault();
    if (!knowledgeSearch.trim()) return;
    setSearchingKnowledge(true);
    setSearchResult('');
    try {
      const response = await resourceRequest('knowledge', { method: 'POST', action: 'search', body: { query: knowledgeSearch.trim() } });
      setSearchResult(response?.answer || response?.result || response?.message || 'No matching information was returned.');
    } catch (error) { setSearchResult(error.message); }
    finally { setSearchingKnowledge(false); }
  };

  const saveRequestType = async (event) => {
    event.preventDefault();
    setSavingModal(true);
    setRequestError('');
    try {
      const response = await resourceRequest('requestTypes', { method: 'POST', body: { name: requestForm.name.trim(), details_to_collect: requestForm.detailsToCollect.trim(), collect_phone_from_whatsapp: true, what_happens_next: requestForm.whatHappensNext.trim() } });
      const created = response?.request_type || response;
      if (created && (created.id || created.request_type_id || created.name)) setRequestTypes((current) => [created, ...current]);
      setRequestForm(emptyRequest);
      setRequestModal(false);
    } catch (error) { setRequestError(error.message); }
    finally { setSavingModal(false); }
  };

  const sendAssistantMessage = async (event) => {
    event.preventDefault();
    const message = assistantMessage.trim();
    if (!message || assistantSending) return;
    setAssistantSending(true);
    try {
      const response = await resourceRequest('brainAssistant', { method: 'POST', body: { message } });
      const reply = response?.reply || response?.answer || response?.response;
      if (!reply) throw new Error('The Brain Assistant API did not return a reply.');
      setAssistantMessages((current) => [...current, { role: 'user', text: message }, { role: 'assistant', text: reply }]);
      setAssistantMessage('');
    } catch (error) { showNotice(error.message); }
    finally { setAssistantSending(false); }
  };

  const sendTestQuestion = async (message) => {
    setIsSendingTest(true);
    try {
      const response = await resourceRequest('testAi', { method: 'POST', body: { message } });
      const reply = response?.reply || response?.answer || response?.response;
      if (typeof reply !== 'string' || !reply.trim()) throw new Error('The AI API did not return a reply.');
      setTestMessages((current) => [...current, { role: 'user', text: message }, { role: 'assistant', text: reply }]);
      setQuestion('');
    } catch (error) { showNotice(error.message); }
    finally { setIsSendingTest(false); }
  };

  const handleTestSubmit = (event) => {
    event.preventDefault();
    const pendingMessage = question.trim();
    if (!pendingMessage || isSendingTest || isCheckingPlan) return;
    if (!isStatusKnown) {
      showNotice('Your free-plan status could not be verified. Connect the billing plan-status API before testing your AI.');
      return;
    }
    if (!isStarted) {
      openFreePlan(() => sendTestQuestion(pendingMessage));
      return;
    }
    sendTestQuestion(pendingMessage);
  };

  const tabLabel = brainTabs.find((item) => item.value === tab)?.label || 'What AI knows';
  const businessName = overview?.business_name || overview?.business?.name || setup.business_name || 'your business';
  const attentionItems = overview?.needs_attention || overview?.attention_items || [];
  const knowledgeCards = [
    { id: 'profile', title: 'Business profile', icon: Building2, value: overview?.business_profile_summary || (overview?.business_profile_complete ? 'Complete' : 'Not set up'), detail: overview?.business_description || 'Your business information and description.', onClick: () => changeTab('Setup', 'setup#business-info') },
    { id: 'hours', title: 'Opening hours', icon: Clock3, value: overview?.hours_summary || (overview?.hours_configured ? 'Configured' : 'Not set up'), detail: 'Your saved weekly availability.', onClick: () => changeTab('Hours & Staff', 'hours-staff') },
    { id: 'services', title: 'Services', icon: Settings, value: overview?.services_count ?? '—', detail: 'Services available for appointment booking.', onClick: () => navigate('/dashboard/services') },
    { id: 'products', title: 'Products', icon: Package, value: overview?.products_count ?? '—', detail: 'Products available for customer orders.', onClick: () => navigate('/dashboard/products') },
    { id: 'documents', title: 'Documents', icon: FileText, value: overview?.documents_count ?? '—', detail: 'Menus, price lists or documents your AI can share.', onClick: () => changeTab('Knowledge', 'knowledge') },
    { id: 'personality', title: 'Personality & instructions', icon: Sparkles, value: overview?.ai_behaviour_summary || (overview?.ai_behaviour_configured ? 'Configured' : 'Not set up'), detail: 'Your AI language, tone, reply length and custom instructions.', onClick: () => changeTab('Setup', 'setup#ai-behaviour') },
  ];
  const tokenCount = overview?.tokens_remaining ?? overview?.ai_tokens_remaining ?? overview?.credit?.tokens_remaining;


  return (
    <>
      <PageHeader eyebrow="MANAGE YOUR AI" title="AI Brain" description="See what your AI knows, teach it about your business, and test it before customers do." />
      {Notice}
      <Panel className="dp-brain-panel">
        <Tabs items={brainTabs.map((item) => item.label)} active={tabLabel} onChange={changeTab} />
        {tab === 'what-ai-knows' && <div className="dp-brain-overview-layout">
          <div className="dp-brain-overview-main">
            {overviewError && <div className="dp-inline-notice dp-api-error" role="status">{overviewError}</div>}
            <div className="dp-brain-summary"><div><span className="dp-section-kicker">YOUR AI KNOWLEDGE</span><h2>{overviewLoading ? 'Loading your AI knowledge…' : `Your AI knows ${overview?.known_items_count ?? overview?.knowledge_count ?? '—'} things about ${businessName}`}</h2><p>{overview?.summary || 'Your saved business information and reference material help the AI answer customer questions.'}</p></div><button type="button" className="dp-icon-action" onClick={loadOverview} aria-label="Refresh AI knowledge" disabled={overviewLoading}><RotateCcw size={15} /></button></div>
            <div className="dp-attention-list">
              {overviewLoading ? <div className="dp-api-empty-state">Loading items that need attention…</div> : attentionItems.length ? attentionItems.map((item, index) => <div className="dp-attention-item" key={item.id || item.key || index}><span><Lightbulb size={16} /></span><p>{item.message || item.description || item.title}</p><div className="dp-attention-actions">{item.fix_tab && <button type="button" className="dp-text-button" onClick={() => changeTab(brainTabs.find((entry) => entry.value === item.fix_tab)?.label || 'Setup', item.anchor || '')}>Fix</button>}<button type="button" className="dp-text-button" onClick={() => { setAssistantMessage(item.assistant_prompt || item.message || item.title || 'Help me improve my AI setup.'); document.querySelector('.dp-brain-assistant-input')?.focus(); }}>Ask assistant</button></div></div>) : !overviewError ? <div className="dp-form-note">No attention items were returned for your business.</div> : null}
            </div>
            <div className="dp-section-heading"><div><span className="dp-section-kicker">CORE KNOWLEDGE</span><h2>Always knows</h2><p>Your AI sees saved core information in every conversation.</p></div></div>
            <div className="dp-knowledge-grid">
              {knowledgeCards.map(({ id, title, icon: Icon, value, detail, onClick }) => <article className="dp-knowledge-card dp-knowledge-card-editable" key={id}><div className="dp-knowledge-card-top"><Icon size={19} /><button type="button" className="dp-icon-action" aria-label={`Edit ${title}`} onClick={onClick}><Pencil size={13} /></button></div><h3>{title}</h3><p>{value}</p><small>{detail}</small></article>)}
            </div>
            <div className="dp-section-heading"><div><span className="dp-section-kicker">REFERENCE MATERIAL</span><h2>Looks up when relevant</h2><p>Your AI checks relevant reference material when customers ask related questions.</p></div></div>
            <div className="dp-knowledge-empty"><FileText size={21} /><div><strong>Reference knowledge</strong><p>{overview?.reference_material_summary || 'Documents and knowledge entries connected to your account appear here.'}</p></div><button type="button" className="dp-secondary-button" onClick={() => changeTab('Knowledge')}>Open knowledge</button></div>
          </div>
          <BrainAssistantPanel
            messages={assistantMessages}
            value={assistantMessage}
            onChange={setAssistantMessage}
            onSubmit={sendAssistantMessage}
            isSending={assistantSending}
            tokensRemaining={tokenCount}
            suggestions={overview?.assistant_suggestions || []}
            onReset={() => { setAssistantMessages([]); setAssistantMessage(''); }}
          />
        </div>}

        {tab === 'setup' && <section id="business-info" className="dp-brain-tab-content">
          <div className="dp-brain-tab-heading"><div><span className="dp-section-kicker">YOUR BUSINESS</span><h2>Business information</h2><p>Give your AI the context it needs to answer questions accurately.</p></div><Building2 size={21} /></div>
          {sectionErrors.setup && <div className="dp-inline-notice dp-api-error" role="status">{sectionErrors.setup}</div>}
          {setupLoading && <div className="dp-api-empty-state">Loading your saved AI setup…</div>}
          <form className="dp-form-grid dp-brain-form" onSubmit={saveSetup}>
            <FormField label="Business name"><FieldInput value={setup.business_name || ''} onChange={(event) => updateSetup('business_name', event.target.value)} maxLength={120} required /></FormField>
            <FormField label="Industry"><FieldInput value={setup.industry || ''} onChange={(event) => updateSetup('industry', event.target.value)} placeholder="e.g. Restaurant, salon, retail" /></FormField>
            <FormField label="WhatsApp number" hint="Connected number is managed in Channels."><FieldInput value={setup.whatsapp_number || ''} readOnly placeholder="No connected WhatsApp number" /></FormField>
            <FormField label="Business address" hint="Manage your address in Profile."><div className="dp-readonly-address"><FieldInput value={setup.business_address || ''} readOnly placeholder="No saved address" /><button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/profile')}>Edit in Profile</button></div></FormField>
            <FormField label="Business description" className="dp-form-full"><FieldTextarea rows={4} maxLength={1000} value={setup.business_description || ''} onChange={(event) => updateSetup('business_description', event.target.value)} placeholder="Describe what your business does, who it serves and what makes it different." /><small>{(setup.business_description || '').length}/1000 characters</small></FormField>
            <div className="dp-form-full dp-settings-save-row"><span className="dp-muted">Your AI uses this information when answering customers.</span><button type="submit" className="dp-primary-button" disabled={setupSaving || setupLoading}>{setupSaving ? 'Saving…' : 'Save business information'}</button></div>
          </form>
          <div id="ai-behaviour" className="dp-brain-tab-heading dp-brain-tab-heading-spaced"><div><span className="dp-section-kicker">AI BEHAVIOUR</span><h2>How your AI speaks</h2><p>Choose the style and language your assistant uses with customers.</p></div><Bot size={21} /></div>
          <form className="dp-form-grid dp-brain-form" onSubmit={saveSetup}>
            <FormField label="AI assistant name"><FieldInput value={setup.agent_name || ''} onChange={(event) => updateSetup('agent_name', event.target.value)} placeholder="e.g. Ayesha" /></FormField>
            <FormField label="Gender"><FieldSelect value={setup.agent_gender || 'Not set'} onChange={(event) => updateSetup('agent_gender', event.target.value)}><option>Not set</option><option>Female</option><option>Male</option><option>Neutral</option></FieldSelect></FormField>
            <FormField label="Reply language"><FieldSelect value={setup.reply_language || 'Automatic'} onChange={(event) => updateSetup('reply_language', event.target.value)}><option>Automatic</option><option>English</option><option>Urdu</option><option>Roman Urdu</option><option>English and Urdu</option></FieldSelect></FormField>
            <FormField label="Tone"><FieldSelect value={setup.tone || 'Friendly'} onChange={(event) => updateSetup('tone', event.target.value)}><option>Friendly</option><option>Professional</option><option>Casual</option><option>Warm</option><option>Concise</option></FieldSelect></FormField>
            <FormField label="Reply length"><FieldSelect value={setup.reply_length || 'Balanced'} onChange={(event) => updateSetup('reply_length', event.target.value)}><option>Short</option><option>Balanced</option><option>Detailed</option></FieldSelect></FormField>
            <FormField label="Goodbye message (optional)"><FieldInput value={setup.goodbye_message || ''} onChange={(event) => updateSetup('goodbye_message', event.target.value)} placeholder="A short closing message" /></FormField>
            <FormField label="Custom instructions" className="dp-form-full"><FieldTextarea rows={4} value={setup.custom_instructions || ''} onChange={(event) => updateSetup('custom_instructions', event.target.value)} placeholder="Add specific instructions your AI should follow…" /></FormField>
            <div className="dp-form-full dp-settings-save-row"><span className="dp-muted">Changes are sent to the AI setup API.</span><button type="submit" className="dp-primary-button" disabled={setupSaving || setupLoading}>{setupSaving ? 'Saving…' : 'Save AI behaviour'}</button></div>
          </form>
          <div className="dp-brain-info-grid"><InfoCard title="Why this matters" text="Clear business details help your AI give accurate answers and set expectations." /><InfoCard title="Tone & language" text="Automatic language follows the customer's message. Set a preferred tone for consistent replies." /><InfoCard title="Custom instructions" text="Use this for policies, details and response rules that are unique to your business." /></div>
        </section>}

        {tab === 'hours-staff' && <section className="dp-brain-tab-content">
          <div className="dp-brain-tab-heading"><div><span className="dp-section-kicker">AVAILABILITY</span><h2>Hours & Staff</h2><p>Set when customers can book and which staff members are available.</p></div><CalendarDays size={21} /></div>
          {sectionErrors.hours && <div className="dp-inline-notice dp-api-error" role="status">{sectionErrors.hours}</div>}
          {hoursLoading ? <div className="dp-api-empty-state">Loading saved opening hours…</div> : <Panel className="dp-brain-subpanel"><div className="dp-panel-heading"><div><h3>Working hours</h3><p className="dp-panel-description">Set the hours customers can request an appointment.</p></div><button type="button" className="dp-secondary-button" onClick={copyMondayHours}><Copy size={14} /> Copy Monday to Tue–Sat</button></div>
            <div className="dp-week-hours-list">{hours.map((day, index) => <article className="dp-week-hours-row" key={day.day}><label className="dp-week-day-toggle"><input type="checkbox" checked={Boolean(day.enabled)} onChange={(event) => updateHour(index, 'enabled', event.target.checked)} /><strong>{day.day}</strong></label>{day.enabled ? <div className="dp-week-hours-controls"><label><input type="checkbox" checked={Boolean(day.is_24_hours)} onChange={(event) => updateHour(index, 'is_24_hours', event.target.checked)} /> 24 hours</label>{!day.is_24_hours && <><FieldInput type="time" aria-label={`${day.day} opening time`} value={day.start_time} onChange={(event) => updateHour(index, 'start_time', event.target.value)} /><span>to</span><FieldInput type="time" aria-label={`${day.day} closing time`} value={day.end_time} onChange={(event) => updateHour(index, 'end_time', event.target.value)} /></>}{day.breaks.map((pause, pauseIndex) => <div className="dp-week-break-row" key={pauseIndex}><span>Break</span><FieldInput type="time" aria-label="Break start" value={pause.start_time} onChange={(event) => updateBreak(index, pauseIndex, 'start_time', event.target.value)} /><FieldInput type="time" aria-label="Break end" value={pause.end_time} onChange={(event) => updateBreak(index, pauseIndex, 'end_time', event.target.value)} /><button type="button" className="dp-icon-action" onClick={() => updateHour(index, 'breaks', day.breaks.filter((_, itemIndex) => itemIndex !== pauseIndex))} aria-label="Remove break"><X size={13} /></button></div>)}<button type="button" className="dp-text-button" onClick={() => addBreak(index)}>+ Add break</button></div> : <strong className="dp-closed-label">Closed</strong>}</article>)}</div>
            <div className="dp-settings-save-row"><span className="dp-muted">Save your weekly availability.</span><button type="button" className="dp-primary-button" onClick={saveHours} disabled={hoursSaving}>{hoursSaving ? 'Saving…' : 'Save hours'}</button></div>
          </Panel>}
          <Panel className="dp-brain-subpanel"><div className="dp-panel-heading"><div><h3>Booking rules</h3><p className="dp-panel-description">Control the options your AI offers when customers book.</p></div></div>
            <div className="dp-form-grid"><FormField label="Offer a time"><FieldSelect value={rules.offer_time} onChange={(event) => setRules((current) => ({ ...current, offer_time: event.target.value }))}><option>First available</option><option>Ask customer for preferred time</option><option>Show available slots</option></FieldSelect></FormField><FormField label="Gap between bookings"><FieldSelect value={rules.booking_gap} onChange={(event) => setRules((current) => ({ ...current, booking_gap: event.target.value }))}>{['No gap', '5 minutes', '10 minutes', '15 minutes', '30 minutes', '60 minutes'].map((value) => <option key={value}>{value}</option>)}</FieldSelect></FormField><FormField label="Minimum notice"><FieldSelect value={rules.minimum_notice} onChange={(event) => setRules((current) => ({ ...current, minimum_notice: event.target.value }))}>{['No minimum', '1 hour', '2 hours', '4 hours', '12 hours', '24 hours'].map((value) => <option key={value}>{value}</option>)}</FieldSelect></FormField><FormField label="How far ahead can customers book?"><FieldSelect value={rules.book_ahead} onChange={(event) => setRules((current) => ({ ...current, book_ahead: event.target.value }))}>{['7 days', '14 days', '30 days', '60 days', '90 days'].map((value) => <option key={value}>{value}</option>)}</FieldSelect></FormField><FormField label="Concurrent customers"><FieldSelect value={rules.concurrent_customers} onChange={(event) => setRules((current) => ({ ...current, concurrent_customers: event.target.value }))}>{['1', '2', '3', '4', '5', '10'].map((value) => <option key={value}>{value}</option>)}</FieldSelect></FormField></div>
            {sectionErrors.rules && <p className="dp-form-note dp-api-error">{sectionErrors.rules}</p>}<button type="button" className="dp-primary-button dp-settings-save" onClick={saveRules} disabled={rulesSaving}>{rulesSaving ? 'Saving…' : 'Save booking rules'}</button>
          </Panel>
          <Panel className="dp-brain-subpanel"><div className="dp-panel-heading"><div><h3>Special closed dates</h3><p className="dp-panel-description">Add holidays and dates when your business will be unavailable.</p></div></div><form className="dp-special-date-form" onSubmit={addClosedDate}><FieldInput type="date" value={closedDate.date} onChange={(event) => setClosedDate((current) => ({ ...current, date: event.target.value }))} required /><FieldInput value={closedDate.reason} onChange={(event) => setClosedDate((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason (optional)" /><button type="submit" className="dp-secondary-button"><Plus size={14} /> Add date</button></form>{closedDates.map((item) => <div className="dp-brain-list-row" key={item.id || item.date}><span><strong>{item.date}</strong><small>{item.reason || 'Closed'}</small></span><button type="button" className="dp-icon-action" onClick={() => deleteResource('closedDates', item, setClosedDates, 'closed_date')} aria-label="Remove closed date"><Trash2 size={14} /></button></div>)}</Panel>
          <Panel className="dp-brain-subpanel"><div className="dp-panel-heading"><div><h3>Staff members</h3><p className="dp-panel-description">Manage your staff and their appointment availability.</p></div><button type="button" className="dp-primary-button" onClick={() => setStaffModal(true)}><Plus size={14} /> Add staff</button></div>{staff.length ? staff.map((person) => <div className="dp-brain-list-row" key={person.id || person.staff_id}><span><strong>{person.name || person.full_name}</strong><small>{person.role || 'Staff'} · {person.phone || 'No phone number'}</small></span><button type="button" className="dp-icon-action" onClick={() => deleteResource('staff', person, setStaff, 'staff')} aria-label="Remove staff member"><Trash2 size={14} /></button></div>) : <EmptyState icon={Users} title="No staff members yet" description="Add team members to manage who can take appointments." buttonText="Add staff member" onAction={() => setStaffModal(true)} />}</Panel>
          <div className="dp-brain-footer-actions"><button type="button" className="dp-secondary-button" onClick={() => { setTabToLocations(setSearchParams, searchParams); }}><MapPin size={14} /> Add Location</button><span className="dp-muted">Staff may have their own working hours when the staff API supports it.</span></div>
        </section>}

        {tab === 'locations' && <section className="dp-brain-tab-content">
          <div className="dp-brain-tab-heading"><div><span className="dp-section-kicker">BUSINESS LOCATIONS</span><h2>Locations</h2><p>Add branches and tell your AI where each service is available.</p></div><button type="button" className="dp-primary-button" onClick={() => setLocationModal(true)}><Plus size={14} /> Add location</button></div>
          {sectionErrors.locations && <div className="dp-inline-notice dp-api-error" role="status">{sectionErrors.locations}</div>}
          {locations.length ? <div className="dp-location-grid">{locations.map((location) => <Panel className="dp-location-card" key={location.id || location.location_id}><div className="dp-panel-heading"><MapPin size={18} /><button type="button" className="dp-icon-action" onClick={() => deleteResource('locations', location, setLocations, 'location')} aria-label="Delete location"><Trash2 size={14} /></button></div><h3>{location.name}</h3><p>{location.address || 'No address added'}</p><small>{location.phone || ''}</small></Panel>)}</div> : sectionErrors.locations ? <div className="dp-api-empty-state"><MapPin size={22} /><strong>Locations are ready to connect</strong><p>Connect the locations API to load and manage business branches.</p></div> : <EmptyState icon={MapPin} title="No locations yet" description="Add your first business location to help the AI direct customers to the right branch." buttonText="Add location" onAction={() => setLocationModal(true)} />}
        </section>}

        {tab === 'knowledge' && <section className="dp-brain-tab-content">
          <div className="dp-brain-tab-heading"><div><span className="dp-section-kicker">REFERENCE MATERIAL</span><h2>Knowledge library</h2><p>Upload documents your AI can look up when a customer asks a related question.</p></div><FileText size={21} /></div>
          {sectionErrors.knowledge && <div className="dp-inline-notice dp-api-error" role="status">{sectionErrors.knowledge}</div>}
          <Panel className="dp-brain-subpanel"><form className="dp-knowledge-upload-form" onSubmit={saveKnowledgeFile}><label className="dp-knowledge-file-picker"><input type="file" accept=".pdf,.doc,.docx,.txt,.csv" onChange={(event) => setKnowledgeFile(event.target.files?.[0] || null)} /><span><Plus size={18} />{knowledgeFile ? knowledgeFile.name : 'Choose a document to upload'}</span><small>PDF, DOC, DOCX, TXT or CSV</small></label><button type="submit" className="dp-primary-button" disabled={!knowledgeFile || savingModal}>{savingModal ? 'Uploading…' : 'Upload document'}</button></form></Panel>
          <Panel className="dp-brain-subpanel"><div className="dp-panel-heading"><div><h3>Saved documents</h3><p className="dp-panel-description">Only uploaded documents returned by your knowledge API are shown.</p></div><span className="dp-count-badge">{knowledge.length} documents</span></div>{knowledge.length ? knowledge.map((item) => <div className="dp-brain-list-row" key={item.id || item.document_id}><span><strong>{item.name || item.filename || item.title}</strong><small>{item.status || item.indexing_status || 'Saved'} · {item.size_label || ''}</small></span><button type="button" className="dp-icon-action" onClick={() => deleteResource('knowledge', item, setKnowledge, 'document')} aria-label="Delete document"><Trash2 size={14} /></button></div>) : !sectionErrors.knowledge && <EmptyState icon={FileText} title="No documents yet" description="Upload your menu, price list, catalogue or business information to build your reference knowledge." />}</Panel>
          <Panel className="dp-brain-subpanel"><div className="dp-panel-heading"><div><h3>Try a question</h3><p className="dp-panel-description">Check whether your saved knowledge contains the answer.</p></div><Search size={18} /></div><form className="dp-special-date-form" onSubmit={checkKnowledge}><FieldInput value={knowledgeSearch} onChange={(event) => setKnowledgeSearch(event.target.value)} placeholder="Ask something about your business…" /><button type="submit" className="dp-secondary-button" disabled={searchingKnowledge || !knowledgeSearch.trim()}>{searchingKnowledge ? 'Checking…' : 'Check'}</button></form>{searchResult && <div className="dp-knowledge-search-result">{searchResult}</div>}<button type="button" className="dp-text-button dp-rules-toggle" onClick={() => setShowRules((value) => !value)}>{showRules ? 'Hide' : 'Show'} knowledge rules</button>{showRules && <div className="dp-knowledge-rules"><p>Your AI looks up reference documents when a customer asks something related. Core business details remain available in every conversation.</p></div>}</Panel>
        </section>}

        {tab === 'requests' && <section className="dp-brain-requests">
          <div className="dp-brain-requests-heading"><div><span className="dp-section-kicker">LEAD COLLECTION</span><h2>Request types</h2><p>Tell your AI which details to collect when customers make an enquiry.</p></div><button type="button" className="dp-primary-button" onClick={() => setRequestModal(true)}><Plus size={15} /> Add Request Type</button></div>
          {requestError && <div className="dp-inline-notice dp-api-error" role="status">{requestError}</div>}
          {isRequestLoading ? <div className="dp-api-empty-state">Loading request types…</div> : requestTypes.length ? <div className="dp-brain-request-list">{requestTypes.map((item) => <article className="dp-brain-request-row" key={item.id || item.request_type_id || item.name}><div><strong>{item.name}</strong><p>{item.details_to_collect || item.details || 'No additional details specified.'}</p><small>{item.collect_phone_from_whatsapp !== false ? 'Phone number is collected from the WhatsApp conversation.' : 'Phone number is not collected automatically.'}</small></div><span className={`dp-status-pill ${item.is_active === false ? 'neutral' : 'success'}`}>{item.is_active === false ? 'Inactive' : 'Active'}</span></article>)}</div> : requestError ? <div className="dp-api-empty-state">Request types are ready to connect. Add the request types API to load your saved forms.</div> : <EmptyState icon={Users} title="Nothing to collect yet" description="Add the enquiry types your team follows up personally. Your AI will collect the details and save them as leads." buttonText="Add Request Type" onAction={() => setRequestModal(true)} />}
        </section>}

        {tab === 'test-ai' && <TestAIContent question={question} setQuestion={setQuestion} messages={testMessages} isSending={isSendingTest} isCheckingPlan={isCheckingPlan} onSubmit={handleTestSubmit} />}
      </Panel>

      {staffModal && <Modal title="Add staff member" description="Add a person who can take appointments." onClose={() => !savingModal && setStaffModal(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setStaffModal(false)} disabled={savingModal}>Cancel</button><button type="submit" form="brain-staff-form" className="dp-primary-button" disabled={savingModal}>{savingModal ? 'Saving…' : 'Add staff member'}</button></>}>
        <form id="brain-staff-form" className="dp-form-grid" onSubmit={saveStaff}><FormField label="Name"><FieldInput value={staffForm.name} onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))} required /></FormField><FormField label="Role"><FieldInput value={staffForm.role} onChange={(event) => setStaffForm((current) => ({ ...current, role: event.target.value }))} placeholder="e.g. Stylist" required /></FormField><FormField label="Phone"><FieldInput value={staffForm.phone} onChange={(event) => setStaffForm((current) => ({ ...current, phone: event.target.value }))} /></FormField><FormField label="Working hours"><FieldSelect value={staffForm.hours_mode} onChange={(event) => setStaffForm((current) => ({ ...current, hours_mode: event.target.value }))}><option value="business">Same as the business</option><option value="own">Own hours</option></FieldSelect></FormField>{staffForm.hours_mode === 'own' && <><FormField label="Start time"><FieldInput type="time" value={staffForm.start_time} onChange={(event) => setStaffForm((current) => ({ ...current, start_time: event.target.value }))} required /></FormField><FormField label="End time"><FieldInput type="time" value={staffForm.end_time} onChange={(event) => setStaffForm((current) => ({ ...current, end_time: event.target.value }))} required /></FormField></>}<div className="dp-form-full"><button type="button" className="dp-secondary-button" onClick={() => { setStaffModal(false); setLocationModal(true); }}><MapPin size={14} /> Add Location</button></div></form>
      </Modal>}

      {locationModal && <Modal title="Add location" description="Add a business branch or service location." onClose={() => !savingModal && setLocationModal(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setLocationModal(false)} disabled={savingModal}>Cancel</button><button type="submit" form="brain-location-form" className="dp-primary-button" disabled={savingModal}>{savingModal ? 'Saving…' : 'Add location'}</button></>}>
        <form id="brain-location-form" className="dp-form-grid" onSubmit={saveLocation}><FormField label="Location name"><FieldInput value={locationForm.name} onChange={(event) => setLocationForm((current) => ({ ...current, name: event.target.value }))} required /></FormField><FormField label="Phone"><FieldInput value={locationForm.phone} onChange={(event) => setLocationForm((current) => ({ ...current, phone: event.target.value }))} /></FormField><FormField label="Address" className="dp-form-full"><FieldTextarea value={locationForm.address} onChange={(event) => setLocationForm((current) => ({ ...current, address: event.target.value }))} rows={2} required /></FormField><FormField label="Notes" className="dp-form-full"><FieldTextarea value={locationForm.notes} onChange={(event) => setLocationForm((current) => ({ ...current, notes: event.target.value }))} rows={2} /></FormField></form>
      </Modal>}

      {requestModal && <Modal title="Add Request Type" description="Choose what your AI should collect from a customer." onClose={() => !savingModal && setRequestModal(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setRequestModal(false)} disabled={savingModal}>Cancel</button><button type="submit" form="brain-request-form" className="dp-primary-button" disabled={savingModal || !requestForm.name.trim() || !requestForm.detailsToCollect.trim() || !requestForm.whatHappensNext.trim()}>{savingModal ? 'Saving…' : 'Add Request Type'}</button></>}>
        <form id="brain-request-form" className="dp-form-grid" onSubmit={saveRequestType}><FormField label="Name" className="dp-form-full"><FieldInput value={requestForm.name} onChange={(event) => setRequestForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Wedding enquiry" required maxLength={120} /></FormField><FormField label="Details to collect" className="dp-form-full" hint="The customer's phone number is added automatically from their WhatsApp conversation."><FieldTextarea rows={4} value={requestForm.detailsToCollect} onChange={(event) => setRequestForm((current) => ({ ...current, detailsToCollect: event.target.value }))} placeholder="e.g. Event date, guest count and preferred package" required maxLength={1000} /></FormField><FormField label="What happens next (your AI tells the customer this)" className="dp-form-full"><FieldTextarea rows={3} value={requestForm.whatHappensNext} onChange={(event) => setRequestForm((current) => ({ ...current, whatHappensNext: event.target.value }))} placeholder="e.g. Our team will review your enquiry and get back to you shortly." required maxLength={1000} /></FormField>{requestError && <p className="dp-form-note dp-api-error dp-form-full">{requestError}</p>}</form>
      </Modal>}
    </>
  );
}

function BrainAssistantPanel({ messages, value, onChange, onSubmit, isSending, tokensRemaining, suggestions, onReset }) {
  const noTokens = tokensRemaining !== undefined && tokensRemaining !== null && Number(tokensRemaining) <= 0;
  return <aside className="dp-brain-assistant dp-brain-assistant-side">
    <div className="dp-brain-assistant-head"><div><span className="dp-section-kicker">BELLBEE</span><h2>Brain Assistant</h2><p>Ask questions or get help improving your AI setup.</p></div><button type="button" className="dp-icon-action" onClick={onReset} aria-label="Reset assistant conversation"><RotateCcw size={14} /></button></div>
    {noTokens && <div className="dp-token-warning">You are out of AI tokens, so the assistant cannot reply. <a href="/dashboard/billing">Add tokens</a></div>}
    <div className="dp-assistant-messages-scroll">{messages.length ? messages.map((message, index) => <div key={index} className={`dp-assistant-message ${message.role}`}><span>{message.role === 'assistant' ? 'B' : 'You'}</span><p>{message.text}</p></div>) : <div className="dp-assistant-welcome"><span className="dp-assistant-welcome-icon"><Bot size={22} /></span><strong>Hi! I'm your Brain Assistant.</strong><p>Ask me about your business setup or how to make your AI more helpful.</p></div>}
      {(Array.isArray(suggestions) ? suggestions : []).slice(0, 3).map((suggestion, index) => <button type="button" className="dp-assistant-suggestion" key={index} onClick={() => onChange(typeof suggestion === 'string' ? suggestion : suggestion.prompt || suggestion.text)}>{typeof suggestion === 'string' ? suggestion : suggestion.label || suggestion.prompt || suggestion.text}</button>)}
    </div>
    <form className="dp-assistant-compose" onSubmit={onSubmit}><input className="dp-brain-assistant-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ask your AI…" disabled={noTokens} /><button type="submit" disabled={!value.trim() || isSending || noTokens} aria-label="Send message"><Send size={15} /></button></form>
    <small className="dp-assistant-connect-note">{isResourceConfigured('brainAssistant') ? (isSending ? 'Thinking…' : 'Your changes are not saved until you approve them.') : 'Assistant API not connected yet.'}</small>
  </aside>;
}

function TestAIContent({ question, setQuestion, messages, isSending, isCheckingPlan, onSubmit }) {
  return <div className="dp-test-ai"><span className="dp-section-kicker">AI PLAYGROUND</span><h2>Try a customer question</h2><p>Send a test message to check how your AI responds using your saved business information.</p><div className="dp-test-ai-conversation">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`dp-test-ai-message ${message.role}`}><strong>{message.role === 'user' ? 'You' : 'AI'}</strong><p>{message.text}</p></div>)}</div><form className="dp-test-ai-form" onSubmit={onSubmit}><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onSubmit(event); } }} placeholder="Ask your AI a question…" aria-label="Test AI message" /><button type="submit" disabled={!question.trim() || isSending || isCheckingPlan}><Send size={15} /> {isCheckingPlan ? 'Checking plan…' : isSending ? 'Sending…' : 'Send'}</button></form></div>;
}

function InfoCard({ title, text }) {
  return <article className="dp-brain-info-card"><span><Lightbulb size={17} /></span><div><strong>{title}</strong><p>{text}</p></div></article>;
}

function setTabToLocations(setSearchParams, searchParams) {
  const params = new URLSearchParams(searchParams);
  params.set('tab', 'locations');
  setSearchParams(params, { replace: true });
}
