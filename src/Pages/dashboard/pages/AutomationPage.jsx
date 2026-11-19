import { automationSettingsApi } from '../../../services/dashboard/automation-settings.api.js';
import { channelsApi } from '../../../services/dashboard/channels.api.js';
import { templatesApi } from '../../../services/dashboard/templates.api.js';
import './AutomationPage.css';
import { useEffect, useMemo, useState } from 'react';
import {
  Banknote, CalendarClock, CalendarDays, CalendarX2, CheckCircle2,
  CreditCard, FileText, Image, Mic, PackageX, Plus, RefreshCw,
  ShoppingCart, Trash2, Wallet,
} from 'lucide-react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
const defaultSettings = {
  cartRecovery: false,
  appointmentReminders: true,
  reminder24Hours: true,
  reminder1Hour: true,
  templateFirst: false,
  sendDocuments: true,
  cancelAppointments: true,
  cancelOrders: true,
  rescheduleAppointments: true,
  understandPhotos: true,
  transcribeVoice: true,
  confirmAppointments: false,
  confirmOrders: false,
  paymentMode: 'cod',
  paymentAccountTitle: '',
  paymentAccountNumber: '',
  paymentProvider: '',
  handoverSituations: [],
};

const behaviorOptions = [
  { id: 'sendDocuments', title: 'Send documents automatically', description: 'Let the AI send your menu, price list, or catalogue when a customer asks for one.', icon: FileText },
  { id: 'cancelAppointments', title: 'Cancel appointments automatically', description: "Let the AI cancel an appointment on the customer's request. Turn this off if you want to review every cancellation yourself.", icon: CalendarX2 },
  { id: 'cancelOrders', title: 'Cancel orders automatically', description: "Let the AI cancel an order on the customer's request. Turn this off if you want to review every cancellation yourself.", icon: PackageX },
  { id: 'rescheduleAppointments', title: 'Reschedule appointments automatically', description: "Let the AI move an appointment to a new time on the customer's request. Turn this off if you want to review every change yourself.", icon: CalendarClock },
  { id: 'confirmAppointments', title: 'Confirm appointments instantly', description: 'Let the AI confirm a booking the moment it is made, instead of leaving it pending your review. Off by default.', icon: CalendarDays },
  { id: 'confirmOrders', title: 'Confirm orders instantly', description: 'Let the AI confirm an order the moment it is placed, instead of leaving it pending your review. Off by default.', icon: CheckCircle2 },
  { id: 'understandPhotos', title: 'Understand customer photos', description: 'Let the AI understand images customers send and use them as context when replying.', icon: Image },
  { id: 'transcribeVoice', title: 'Transcribe voice notes', description: 'Let the AI transcribe customer voice notes so it can understand and respond to them.', icon: Mic },
];

const paymentOptions = [
  { id: 'cod', title: 'Cash on delivery only', description: 'No payment link is ever sent. This is the standard COD flow.', icon: Banknote },
  { id: 'details', title: 'Share my payment details', description: 'The AI shares your JazzCash/Easypaisa number or bank details in chat. You confirm payment yourself once the customer pays.', icon: Wallet },
  { id: 'gateway', title: 'Connect a payment gateway', description: 'Customers pay via a secure checkout link. Payments settle directly to your own merchant account and reconcile automatically.', icon: CreditCard },
];

const settingFieldNames = {
  cartRecovery: 'cart_recovery',
  appointmentReminders: 'appointment_reminders',
  reminder24Hours: 'reminder_24_hours',
  reminder1Hour: 'reminder_1_hour',
  templateFirst: 'template_first',
  sendDocuments: 'send_documents',
  cancelAppointments: 'cancel_appointments',
  cancelOrders: 'cancel_orders',
  rescheduleAppointments: 'reschedule_appointments',
  understandPhotos: 'understand_photos',
  transcribeVoice: 'transcribe_voice',
  confirmAppointments: 'confirm_appointments',
  confirmOrders: 'confirm_orders',
  paymentMode: 'payment_mode',
  paymentAccountTitle: 'payment_account_title',
  paymentAccountNumber: 'payment_account_number',
  paymentProvider: 'payment_provider',
  handoverSituations: 'handover_situations',
};

function normalizeSettings(response) {
  const payload = response?.settings || response?.data || response || {};
  const normalized = { ...defaultSettings };
  Object.entries(settingFieldNames).forEach(([clientKey, apiKey]) => {
    if (payload[clientKey] !== undefined) normalized[clientKey] = payload[clientKey];
    else if (payload[apiKey] !== undefined) normalized[clientKey] = payload[apiKey];
  });
  if (!Array.isArray(normalized.handoverSituations)) normalized.handoverSituations = [];
  return normalized;
}

function serializeSettings(settings) {
  return Object.fromEntries(Object.entries(settingFieldNames).map(([clientKey, apiKey]) => [apiKey, settings[clientKey]]));
}

// Loads account automation preferences and keeps every change in an explicit save flow.
export default function AutomationPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(automationSettingsApi.isConfigured());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [hasApprovedTemplate, setHasApprovedTemplate] = useState(false);
  const [templateStatusKnown, setTemplateStatusKnown] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [channelStatusKnown, setChannelStatusKnown] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(JSON.stringify(defaultSettings));
  const { showNotice, Notice } = useNotice();

  useEffect(() => {
    let active = true;
    if (!automationSettingsApi.isConfigured()) return undefined;
    automationSettingsApi.request()
      .then((response) => {
        if (!active) return;
        const nextSettings = normalizeSettings(response);
        setSettings(nextSettings);
        setInitialSnapshot(JSON.stringify(nextSettings));
      })
      .catch((error) => { if (active) setSaveError(error.message); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadRequirements = async () => {
      const [templateResult, channelResult] = await Promise.allSettled([
        templatesApi.request(),
        channelsApi.isConfigured() ? channelsApi.request() : Promise.resolve([]),
      ]);
      if (!active) return;
      if (templateResult.status === 'fulfilled') {
        const response = templateResult.value;
        const templates = Array.isArray(response) ? response : response?.items || response?.results || response?.templates || [];
        setHasApprovedTemplate(templates.some((template) => String(template.status).toLowerCase() === 'approved'));
        setTemplateStatusKnown(true);
      }
      if (channelResult.status === 'fulfilled' && channelsApi.isConfigured()) {
        const response = channelResult.value;
        const channels = Array.isArray(response) ? response : response?.items || response?.channels || [];
        const whatsapp = response?.whatsapp || channels.find((channel) => String(channel.type || channel.name || channel.channel).toLowerCase().includes('whatsapp'));
        setIsWhatsAppConnected(Boolean(whatsapp?.is_connected || whatsapp?.connected || String(whatsapp?.status).toLowerCase() === 'connected'));
        setChannelStatusKnown(true);
      }
    };
    loadRequirements();
    return () => { active = false; };
  }, []);

  const enabledAutonomy = useMemo(() => behaviorOptions.filter(({ id }) => Boolean(settings[id])).length, [settings]);
  const proactiveCount = Number(settings.cartRecovery) + Number(settings.appointmentReminders) + Number(settings.templateFirst);
  const isDirty = JSON.stringify(settings) !== initialSnapshot;

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const toggle = (key) => update(key, !settings[key]);
  const addSituation = () => update('handoverSituations', [...settings.handoverSituations, '']);
  const editSituation = (index, value) => update('handoverSituations', settings.handoverSituations.map((item, itemIndex) => itemIndex === index ? value : item));
  const removeSituation = (index) => update('handoverSituations', settings.handoverSituations.filter((_, itemIndex) => itemIndex !== index));

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await automationSettingsApi.request({ method: 'PUT', body: serializeSettings(settings) });
      setInitialSnapshot(JSON.stringify(settings));
      showNotice('Automation settings saved.');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="SYSTEM"
        title="Automation Settings"
        description="Turn proactive messages on or off, and choose how you collect payment. Everything here is optional."
      />
      {Notice}
      {saveError && <div className="dp-inline-notice dp-api-error" role="status">{saveError}</div>}
      {isLoading && <p className="dp-muted">Loading your saved automation settings…</p>}

      <div className="dp-automation-summary">
        <SummaryCard icon={ShoppingCart} label="PROACTIVE MESSAGING" value={proactiveCount} total="/3" helper="Cart recovery, reminders & template-first" />
        <SummaryCard icon={CheckCircle2} label="AI AUTONOMY" value={enabledAutonomy} total="/8" helper="Things the AI can do without asking you" />
        <SummaryCard icon={Banknote} label="PAYMENT MODE" value={paymentOptions.find((item) => item.id === settings.paymentMode)?.title || paymentOptions[0].title} helper="How customers pay you" compact />
      </div>

      <section className="dp-settings-section">
        <div className="dp-section-heading"><div><span className="dp-section-kicker">PROACTIVE MESSAGING</span><h2>Customer follow-ups</h2></div></div>
        <div className="dp-automation-proactive-grid">
          <ProactiveCard
            icon={ShoppingCart}
            title="Abandoned Cart Recovery"
            description="Automatically follow up with customers who start an order but never finish it. Off by default."
            checked={settings.cartRecovery}
            onChange={() => toggle('cartRecovery')}
          />
          <ProactiveCard
            icon={CalendarDays}
            title="Appointment Reminders"
            description="Send a tap-to-confirm reminder before an appointment so customers don't forget."
            checked={settings.appointmentReminders}
            onChange={() => toggle('appointmentReminders')}
            warning={(templateStatusKnown && !hasApprovedTemplate) || (channelStatusKnown && !isWhatsAppConnected) ? 'Needs an approved template and a connected WhatsApp number to send.' : null}
          >
            <div className="dp-reminder-options">
              <CompactToggle label="24 hours before" checked={settings.reminder24Hours} onChange={() => toggle('reminder24Hours')} />
              <CompactToggle label="1 hour before" checked={settings.reminder1Hour} onChange={() => toggle('reminder1Hour')} />
            </div>
          </ProactiveCard>
        </div>
      </section>

      <Panel className="dp-settings-panel dp-automation-behavior">
        <div className="dp-panel-heading"><div><span className="dp-section-kicker">AI AUTONOMY</span><h2>AI Behavior</h2></div><CheckCircle2 size={20} /></div>
        <p className="dp-panel-description">Turn off specific things the AI is allowed to do on its own. It will still tell the customer it can't help and offer to connect them to you instead.</p>
        <div className="dp-automation-behavior-grid">
          {behaviorOptions.map(({ id, title, description, icon: Icon }) => (
            <article className="dp-automation-behavior-card" key={id}>
              <div className="dp-automation-card-top"><span><Icon size={18} /></span><ToggleSwitch title={title} checked={Boolean(settings[id])} onChange={() => toggle(id)} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel className="dp-settings-panel">
        <div className="dp-panel-heading"><div><span className="dp-section-kicker">HUMAN HANDOVER</span><h2>Hand over to you</h2></div></div>
        <p className="dp-panel-description">Choose what your team handles personally. The AI still answers customers' questions, then passes the chat to you and switches it to human mode.</p>
        <div className="dp-handover-copy"><strong>Always hand over when</strong><p>Describe situations in your own words. The AI tells the customer someone from your team will help, and you get a notification with the reason.</p></div>
        <div className="dp-handover-list">
          {settings.handoverSituations.map((situation, index) => (
            <div className="dp-handover-row" key={`handover-${index}`}>
              <input aria-label={`Handover situation ${index + 1}`} value={situation} onChange={(event) => editSituation(index, event.target.value)} placeholder="Describe when your team should take over…" />
              <button type="button" className="dp-icon-action" onClick={() => removeSituation(index)} aria-label="Remove situation"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <button type="button" className="dp-secondary-button" onClick={addSituation}><Plus size={15} /> Add a situation</button>
      </Panel>

      <Panel className="dp-settings-panel">
        <div className="dp-panel-heading"><div><span className="dp-section-kicker">FIRST CONTACT</span><h2>Template-First Mode</h2></div><ToggleSwitch title="Template-First Mode" checked={Boolean(settings.templateFirst)} disabled={!hasApprovedTemplate} onChange={() => toggle('templateFirst')} /></div>
        <p className="dp-panel-description">Send one of your own approved WhatsApp templates as the first message to a new customer, instead of the AI. Add a button to that template for customers to reach the AI. Tapping it hands the conversation off automatically. Off by default.</p>
        {templateStatusKnown && !hasApprovedTemplate ? <div className="dp-warning-strip">You need at least one approved WhatsApp template to turn this on.</div> : !templateStatusKnown ? <p className="dp-form-note">Connect the templates API to verify whether an approved WhatsApp template is available.</p> : null}
      </Panel>

      <Panel className="dp-settings-panel">
        <div className="dp-panel-heading"><div><span className="dp-section-kicker">PAYMENT COLLECTION</span><h2>How customers pay you</h2></div></div>
        <div className="dp-payment-options dp-payment-options-grid">
          {paymentOptions.map(({ id, title, description, icon: Icon }) => (
            <label className={`dp-payment-option dp-payment-radio-card ${settings.paymentMode === id ? 'selected' : ''}`} key={id}>
              <div className="dp-payment-option-top"><span className="dp-automation-icon"><Icon size={18} /></span><input type="radio" name="paymentMode" value={id} checked={settings.paymentMode === id} onChange={() => update('paymentMode', id)} /></div>
              <strong>{title}</strong>
              <small>{description}</small>
            </label>
          ))}
        </div>
        {settings.paymentMode === 'details' && <div className="dp-form-grid dp-payment-details">
          <label className="dp-form-field"><span>Account title</span><input className="dp-field-control" value={settings.paymentAccountTitle} onChange={(event) => update('paymentAccountTitle', event.target.value)} placeholder="Account holder name" /></label>
          <label className="dp-form-field"><span>Number / IBAN</span><input className="dp-field-control" value={settings.paymentAccountNumber} onChange={(event) => update('paymentAccountNumber', event.target.value)} placeholder="JazzCash, Easypaisa or IBAN" /></label>
          <label className="dp-form-field dp-form-full"><span>Bank / wallet name</span><input className="dp-field-control" value={settings.paymentProvider} onChange={(event) => update('paymentProvider', event.target.value)} placeholder="e.g. JazzCash, Easypaisa, HBL" /></label>
        </div>}
        {settings.paymentMode === 'gateway' && <div className="dp-warning-strip">A secure gateway connection is required before checkout links can be sent.</div>}
      </Panel>

      <div className="dp-settings-save-row">
        <span className="dp-muted">{isDirty ? 'You have unsaved changes.' : 'Your current settings are up to date.'}</span>
        <button type="button" className="dp-primary-button" onClick={saveSettings} disabled={!isDirty || isSaving}>
          {isSaving ? <RefreshCw size={14} className="dp-spin" /> : null} {isSaving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, total, helper, compact = false }) {
  return (
    <article className="dp-automation-summary-card">
      <span className="dp-automation-icon"><Icon size={18} /></span>
      <span className="dp-summary-label">{label}</span>
      <strong className={compact ? 'dp-summary-compact-value' : ''}>{value}{total && <small>{total}</small>}</strong>
      <p>{helper}</p>
    </article>
  );
}

function ProactiveCard({ icon: Icon, title, description, checked, onChange, warning, children }) {
  return (
    <Panel className="dp-proactive-card">
      <div className="dp-panel-heading"><div className="dp-proactive-title"><span className="dp-automation-icon"><Icon size={18} /></span><h3>{title}</h3></div><ToggleSwitch title={title} checked={checked} onChange={onChange} /></div>
      <p className="dp-panel-description">{description}</p>
      {warning && <div className="dp-warning-strip">{warning}</div>}
      {children}
    </Panel>
  );
}

function ToggleSwitch({ title, checked, onChange, disabled = false }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={title} disabled={disabled} className={`dp-switch ${checked ? 'on' : ''}`} onClick={onChange}><span /></button>;
}

function CompactToggle({ label, checked, onChange }) {
  return <div className="dp-compact-toggle"><span>{label}</span><ToggleSwitch title={label} checked={checked} onChange={onChange} /></div>;
}
