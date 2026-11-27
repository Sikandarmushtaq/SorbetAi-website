
import './AutomationPage.css';

import { useEffect, useState } from 'react';

import {
  ShoppingCart,
  CalendarDays,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Mic,
  PackageX,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  Bot,
  Users,
  MessageSquare,
  AlertTriangle,
  Rocket,
  RefreshCw,
} from 'lucide-react';

import { automationSettingsApi } from '../../../services/dashboard/automation-settings.api.js';
import { templatesApi } from '../../../services/dashboard/templates.api.js';
import { channelsApi } from '../../../services/dashboard/channels.api.js';

import { useNotice } from '../../../components/dashboard/common/DashboardUI';

/* ==========================================
   INITIAL AUTOMATION SETTINGS
========================================== */

const createDefaultSettings = () => ({
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
});

/* ==========================================
   BACKEND FIELD MAPPING
   Keep existing API keys unchanged
========================================== */

const fieldMap = {
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

/* ==========================================
   AI BEHAVIOR OPTIONS
========================================== */

const behaviorOptions = [
  {
    id: 'sendDocuments',
    title: 'Send documents automatically',
    description:
      'Let the AI send your menu, price list, or catalogue when a customer asks for one.',
    icon: FileText,
  },
  {
    id: 'cancelAppointments',
    title: 'Cancel appointments automatically',
    description:
      "Let the AI cancel an appointment on the customer's request. Turn this off if you want to review every cancellation yourself.",
    icon: CalendarX2,
  },
  {
    id: 'cancelOrders',
    title: 'Cancel orders automatically',
    description:
      "Let the AI cancel an order on the customer's request. Turn this off if you want to review every cancellation yourself.",
    icon: PackageX,
  },
  {
    id: 'rescheduleAppointments',
    title: 'Reschedule appointments automatically',
    description:
      "Let the AI move an appointment to a new time on the customer's request.",
    icon: CalendarClock,
  },
  {
    id: 'understandPhotos',
    title: 'Understand photos',
    description:
      'Let the AI look at photos customers send and try to match them to your products.',
    icon: ImageIcon,
  },
  {
    id: 'transcribeVoice',
    title: 'Transcribe voice notes',
    description:
      'Let the AI transcribe and reply to voice notes. When off, customers get a message asking them to type instead.',
    icon: Mic,
  },
  {
    id: 'confirmAppointments',
    title: 'Confirm appointments instantly',
    description:
      "Let the AI confirm a booking the moment it's made, instead of leaving it pending your review. Off by default.",
    icon: CalendarDays,
  },
  {
    id: 'confirmOrders',
    title: 'Confirm orders instantly',
    description:
      "Let the AI confirm an order the moment it's placed, instead of leaving it pending your review. Off by default.",
    icon: CheckCircle2,
  },
];

/* ==========================================
   PAYMENT OPTIONS
========================================== */

const paymentOptions = [
  {
    id: 'cod',
    title: 'Cash on delivery only',
    description:
      'No payment link is ever sent. This is the standard COD flow.',
    icon: Banknote,
  },
  {
    id: 'details',
    title: 'Share my payment details',
    description:
      'The AI shares your JazzCash/Easypaisa number or bank details in chat. You confirm payment yourself once the customer pays.',
    icon: Wallet,
  },
  {
    id: 'gateway',
    title: 'Connect a payment gateway',
    description:
      'Customers pay via a secure checkout link. Payments settle directly to your own merchant account and reconcile automatically.',
    icon: CreditCard,
  },
];

/* ==========================================
   API RESPONSE HELPERS
========================================== */

function unpackResponse(response) {
  return response?.data ?? response;
}

function extractSettings(response) {
  const outer = unpackResponse(response);

  const source =
    outer?.settings ||
    outer?.data?.settings ||
    outer?.data ||
    outer ||
    {};

  const result = createDefaultSettings();

  Object.entries(fieldMap).forEach(([key, apiKey]) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    } else if (source[apiKey] !== undefined) {
      result[key] = source[apiKey];
    }
  });

  result.handoverSituations = Array.isArray(
    result.handoverSituations
  )
    ? result.handoverSituations.map((item) => {
        if (typeof item === 'string') return item;
        return item?.description || item?.text || '';
      })
    : [];

  return result;
}

function serializeSettings(settings) {
  const payload = {};

  Object.entries(fieldMap).forEach(([key, apiKey]) => {
    payload[apiKey] = settings[key];
  });

  return payload;
}

function extractTemplates(response) {
  const data = unpackResponse(response);

  if (Array.isArray(data)) return data;

  return (
    data?.templates ||
    data?.items ||
    data?.results ||
    []
  );
}

function extractWhatsApp(response) {
  const data = unpackResponse(response);

  const channels = Array.isArray(data)
    ? data
    : Array.isArray(data?.channels)
      ? data.channels
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return (
    data?.whatsapp ||
    channels.find((channel) => {
      const type = String(
        channel?.type ||
          channel?.name ||
          channel?.channel ||
          ''
      ).toLowerCase();

      return type.includes('whatsapp');
    }) ||
    null
  );
}

/* ==========================================
   REUSABLE SWITCH
========================================== */

function AutomationSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={Boolean(checked)}
      disabled={disabled}
      className={`ba-switch ${
        checked ? 'ba-switch-active' : ''
      }`}
      onClick={onChange}
    >
      <span className="ba-switch-thumb" />
    </button>
  );
}

/* ==========================================
   ICON BADGE
========================================== */

function IconBadge({
  icon: Icon,
  color = 'coral',
}) {
  return (
    <span className={`ba-icon ba-icon-${color}`}>
      <Icon size={17} strokeWidth={1.9} />
    </span>
  );
}

/* ==========================================
   SUMMARY CARD
========================================== */

function SummaryCard({
  icon: Icon,
  label,
  value,
  total,
  description,
  color,
  compact = false,
}) {
  return (
    <div className="ba-summary-card">
      <div className={`ba-summary-top ba-text-${color}`}>
        <Icon size={16} strokeWidth={1.9} />
        <span>{label}</span>
      </div>

      <div
        className={`ba-summary-value ${
          compact ? 'ba-summary-value-compact' : ''
        }`}
      >
        {value}
        {total && <small>{total}</small>}
      </div>

      <p>{description}</p>
    </div>
  );
}

/* ==========================================
   AI BEHAVIOR CARD
========================================== */

function BehaviorCard({
  item,
  checked,
  onChange,
}) {
  const Icon = item.icon;

  return (
    <div
      className={`ba-behavior-card ${
        checked ? 'ba-behavior-selected' : ''
      }`}
    >
      <div className="ba-behavior-card-icon">
        <Icon size={17} strokeWidth={1.8} />
      </div>

      <div className="ba-behavior-card-content">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>

      <AutomationSwitch
        label={item.title}
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
}

/* ==========================================
   MAIN AUTOMATION PAGE
========================================== */

export default function AutomationPage() {
  const [settings, setSettings] = useState(
    createDefaultSettings
  );

  const [savedSnapshot, setSavedSnapshot] = useState(
    JSON.stringify(createDefaultSettings())
  );

  const [isLoading, setIsLoading] = useState(
    automationSettingsApi.isConfigured()
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [hasApprovedTemplate, setHasApprovedTemplate] =
    useState(false);

  const [templateStatusKnown, setTemplateStatusKnown] =
    useState(false);

  const [isWhatsAppConnected, setIsWhatsAppConnected] =
    useState(false);

  const { showNotice, Notice } = useNotice();

  /* ========================================
     LOAD SAVED SETTINGS
  ======================================== */

  useEffect(() => {
    let mounted = true;

    if (!automationSettingsApi.isConfigured()) {
      setIsLoading(false);
      setError(
        'Automation settings API is not configured. Changes cannot be saved until it is connected.'
      );
      return undefined;
    }

    async function loadSettings() {
      try {
        const response =
          await automationSettingsApi.request();

        if (!mounted) return;

        const normalized = extractSettings(response);

        setSettings(normalized);
        setSavedSnapshot(
          JSON.stringify(normalized)
        );
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  /* ========================================
     VERIFY WHATSAPP & TEMPLATES
  ======================================== */

  useEffect(() => {
    let mounted = true;

    async function loadRequirements() {
      const results = await Promise.allSettled([
        templatesApi.isConfigured()
          ? templatesApi.request()
          : Promise.reject(
              new Error('Templates API unavailable')
            ),

        channelsApi.isConfigured()
          ? channelsApi.request()
          : Promise.reject(
              new Error('Channels API unavailable')
            ),
      ]);

      if (!mounted) return;

      if (results[0].status === 'fulfilled') {
        const templates = extractTemplates(
          results[0].value
        );

        setHasApprovedTemplate(
          Array.isArray(templates) &&
            templates.some(
              (item) =>
                String(item.status).toLowerCase() ===
                'approved'
            )
        );

        setTemplateStatusKnown(true);
      }

      if (results[1].status === 'fulfilled') {
        const whatsapp = extractWhatsApp(
          results[1].value
        );

        setIsWhatsAppConnected(
          Boolean(
            whatsapp?.connected ||
              whatsapp?.is_connected ||
              String(
                whatsapp?.status || ''
              ).toLowerCase() === 'connected'
          )
        );
      }
    }

    loadRequirements();

    return () => {
      mounted = false;
    };
  }, []);

  /* ========================================
     UPDATE SETTINGS
  ======================================== */

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleSetting = (key) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  /* ========================================
     HANDOVER SITUATIONS
  ======================================== */

  const addSituation = () => {
    setSettings((current) => ({
      ...current,
      handoverSituations: [
        ...current.handoverSituations,
        '',
      ],
    }));
  };

  const updateSituation = (index, value) => {
    setSettings((current) => ({
      ...current,
      handoverSituations:
        current.handoverSituations.map(
          (situation, position) =>
            position === index
              ? value
              : situation
        ),
    }));
  };

  const removeSituation = (index) => {
    setSettings((current) => ({
      ...current,
      handoverSituations:
        current.handoverSituations.filter(
          (_, position) => position !== index
        ),
    }));
  };

  /* ========================================
     SUMMARY COUNTS
  ======================================== */

  const proactiveCount =
    Number(Boolean(settings.cartRecovery)) +
    Number(Boolean(settings.appointmentReminders)) +
    Number(Boolean(settings.templateFirst));

  const autonomyCount = behaviorOptions.filter(
    (option) => Boolean(settings[option.id])
  ).length;

  const selectedPayment = paymentOptions.find(
    (option) => option.id === settings.paymentMode
  );

  const isDirty =
    JSON.stringify(settings) !== savedSnapshot;

  /* ========================================
     SAVE SETTINGS THROUGH EXISTING API
  ======================================== */

  const saveSettings = async () => {
    if (isSaving || isLoading) return;

    if (!automationSettingsApi.isConfigured()) {
      showNotice(
        'Connect the automation settings API before saving.'
      );
      return;
    }

    if (
      settings.templateFirst &&
      templateStatusKnown &&
      !hasApprovedTemplate
    ) {
      showNotice(
        'Template-First Mode requires at least one approved WhatsApp template.'
      );
      return;
    }

    if (
      settings.paymentMode === 'details' &&
      (!settings.paymentProvider.trim() ||
        !settings.paymentAccountNumber.trim())
    ) {
      showNotice(
        'Enter a payment label and payment details.'
      );
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload = serializeSettings(settings);

      const response =
        await automationSettingsApi.request({
          method: 'PUT',
          body: payload,
        });

      if (
        response?.success === false ||
        response?.data?.success === false
      ) {
        throw new Error(
          response?.message ||
            'The server did not save your settings.'
        );
      }

      setSavedSnapshot(JSON.stringify(settings));

      showNotice(
        'Automation settings saved successfully.'
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to save automation settings.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="ba-page">
      {/* PAGE HEADER */}

      <header className="ba-page-header">
        <h1>Automation Settings</h1>

        <p>
          Turn proactive messages on or off, and choose
          how you collect payment. Everything here is
          optional.
        </p>
      </header>

      {Notice}

      {error && (
        <div className="ba-api-error" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="ba-loading">
          <RefreshCw size={16} />
          Loading your saved automation settings...
        </div>
      )}

      {/* SUMMARY */}

      <div className="ba-summary-grid">
        <SummaryCard
          icon={Rocket}
          label="PROACTIVE MESSAGING"
          value={proactiveCount}
          total="/3"
          description="Cart recovery, reminders & template-first"
          color="coral"
        />

        <SummaryCard
          icon={Bot}
          label="AI AUTONOMY"
          value={autonomyCount}
          total="/8"
          description="Things the AI can do without asking you"
          color="green"
        />

        <SummaryCard
          icon={CreditCard}
          label="PAYMENT MODE"
          value={
            selectedPayment?.title ||
            'Cash on delivery only'
          }
          description="How customers pay you"
          compact
          color="blue"
        />
      </div>

      {/* PROACTIVE MESSAGING */}

      <section className="ba-proactive-grid">
        <div className="ba-panel ba-proactive-card">
          <div className="ba-section-intro">
            <IconBadge
              icon={ShoppingCart}
              color="yellow"
            />

            <div className="ba-section-title">
              <h2>Abandoned Cart Recovery</h2>

              <p>
                Automatically follow up with customers
                who start an order but never finish it.
                Off by default.
              </p>
            </div>

            <AutomationSwitch
              label="Abandoned Cart Recovery"
              checked={settings.cartRecovery}
              onChange={() =>
                toggleSetting('cartRecovery')
              }
            />
          </div>
        </div>

        <div className="ba-panel ba-proactive-card">
          <div className="ba-section-intro">
            <IconBadge
              icon={CalendarDays}
              color="blue"
            />

            <div className="ba-section-title">
              <h2>Appointment Reminders</h2>

              <p>
                Send a tap-to-confirm reminder before
                an appointment so customers don't forget.
              </p>
            </div>

            <AutomationSwitch
              label="Appointment Reminders"
              checked={settings.appointmentReminders}
              onChange={() =>
                toggleSetting('appointmentReminders')
              }
            />
          </div>

          {(!hasApprovedTemplate ||
            !isWhatsAppConnected) && (
            <div className="ba-warning">
              <AlertTriangle size={16} />

              <span>
                Needs an approved template and a
                connected WhatsApp number to send.
              </span>
            </div>
          )}

          <div className="ba-reminder-options">
            <div>
              <AutomationSwitch
                label="24 hours before"
                checked={settings.reminder24Hours}
                onChange={() =>
                  toggleSetting('reminder24Hours')
                }
                disabled={!settings.appointmentReminders}
              />

              <span>24 hours before</span>
            </div>

            <div>
              <AutomationSwitch
                label="1 hour before"
                checked={settings.reminder1Hour}
                onChange={() =>
                  toggleSetting('reminder1Hour')
                }
                disabled={!settings.appointmentReminders}
              />

              <span>1 hour before</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI BEHAVIOR */}

      <section className="ba-panel ba-behavior-panel">
        <div className="ba-section-intro">
          <IconBadge
            icon={Bot}
            color="lavender"
          />

          <div className="ba-section-title">
            <h2>AI Behavior</h2>

            <p>
              Turn off specific things the AI is allowed
              to do on its own. It will still tell the
              customer it can't help and offer to connect
              them to you instead.
            </p>
          </div>
        </div>

        <div className="ba-behavior-grid">
          {behaviorOptions.map((item) => (
            <BehaviorCard
              key={item.id}
              item={item}
              checked={Boolean(settings[item.id])}
              onChange={() =>
                toggleSetting(item.id)
              }
            />
          ))}
        </div>
      </section>

      {/* HANDOVER */}

      <section className="ba-panel ba-handover-panel">
        <div className="ba-section-intro">
          <IconBadge
            icon={Users}
            color="lavender"
          />

          <div className="ba-section-title">
            <h2>Hand over to you</h2>

            <p>
              Choose what your team handles personally.
              The AI still answers customers' questions,
              then passes the chat to you and switches it
              to human mode.
            </p>
          </div>
        </div>

        <div className="ba-handover-form">
          <h3>Always hand over when</h3>

          <p>
            Describe situations in your own words. The
            AI tells the customer someone from your team
            will help, and you get a notification with
            the reason.
          </p>

          <div className="ba-handover-list">
            {settings.handoverSituations.map(
              (situation, index) => (
                <div
                  className="ba-handover-row"
                  key={`situation-${index}`}
                >
                  <input
                    type="text"
                    value={situation}
                    placeholder="e.g. Customer asks for a refund or wants to speak with a manager"
                    aria-label={`Handover situation ${
                      index + 1
                    }`}
                    onChange={(event) =>
                      updateSituation(
                        index,
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="ba-delete-button"
                    onClick={() =>
                      removeSituation(index)
                    }
                    aria-label={`Remove situation ${
                      index + 1
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            )}
          </div>

          <button
            type="button"
            className="ba-secondary-button"
            onClick={addSituation}
          >
            <Plus size={15} />
            Add a situation
          </button>
        </div>
      </section>

      {/* TEMPLATE FIRST MODE */}

      <section className="ba-panel ba-template-panel">
        <div className="ba-section-intro">
          <IconBadge
            icon={MessageSquare}
            color="green"
          />

          <div className="ba-section-title">
            <h2>Template-First Mode</h2>

            <p>
              Send one of your own approved WhatsApp
              templates as the first message to a new
              customer, instead of the AI. Add a button
              to that template for customers to reach
              the AI. Tapping it hands the conversation
              off automatically. Off by default.
            </p>
          </div>

          <AutomationSwitch
            label="Template-First Mode"
            checked={settings.templateFirst}
            disabled={
              !settings.templateFirst &&
              !hasApprovedTemplate
            }
            onChange={() =>
              toggleSetting('templateFirst')
            }
          />
        </div>

        {!hasApprovedTemplate && (
          <div className="ba-warning">
            <AlertTriangle size={16} />

            <span>
              {templateStatusKnown
                ? 'You need at least one approved WhatsApp template to turn this on.'
                : 'An approved WhatsApp template is required. Template status has not been verified yet.'}
            </span>
          </div>
        )}
      </section>

      {/* PAYMENT COLLECTION */}

      <section className="ba-panel ba-payment-panel">
        <div className="ba-section-intro">
          <IconBadge
            icon={CreditCard}
            color="lavender"
          />

          <div className="ba-section-title">
            <h2>Payment Collection</h2>
          </div>
        </div>

        <div className="ba-payment-grid">
          {paymentOptions.map((option) => {
            const Icon = option.icon;
            const selected =
              settings.paymentMode === option.id;

            return (
              <label
                key={option.id}
                className={`ba-payment-option ${
                  selected
                    ? 'ba-payment-option-active'
                    : ''
                }`}
              >
                <div className="ba-payment-top">
                  <IconBadge
                    icon={Icon}
                    color={
                      selected
                        ? 'lavender'
                        : 'neutral'
                    }
                  />

                  <input
                    type="radio"
                    name="automationPaymentMode"
                    value={option.id}
                    checked={selected}
                    onChange={() =>
                      updateSetting(
                        'paymentMode',
                        option.id
                      )
                    }
                  />
                </div>

                <strong>{option.title}</strong>

                <p>{option.description}</p>
              </label>
            );
          })}
        </div>

        {/* SHARE PAYMENT DETAILS */}

        {settings.paymentMode === 'details' && (
          <div className="ba-payment-fields">
            <label className="ba-form-field">
              <span>
                Label (e.g. "JazzCash", "Bank Transfer")
              </span>

              <input
                type="text"
                placeholder="JazzCash"
                value={settings.paymentProvider}
                onChange={(event) =>
                  updateSetting(
                    'paymentProvider',
                    event.target.value
                  )
                }
              />
            </label>

            <label className="ba-form-field">
              <span>Payment details</span>

              <textarea
                rows={2}
                placeholder="0300-1234567, Account title: Your Business Name"
                value={settings.paymentAccountNumber}
                onChange={(event) =>
                  updateSetting(
                    'paymentAccountNumber',
                    event.target.value
                  )
                }
              />
            </label>

            <p className="ba-payment-help">
              Shared with customers in chat when
              they're ready to pay. You'll be notified
              to verify each payment.
            </p>
          </div>
        )}

        {/* PAYMENT GATEWAY */}

        {settings.paymentMode === 'gateway' && (
          <p className="ba-payment-gateway-note">
            Connect a payment gateway from the Billing
            page to start accepting automatic checkout
            links.
          </p>
        )}
      </section>

      {/* SAVE CHANGES */}

      <div className="ba-save-row">
        <button
          type="button"
          className="ba-primary-button"
          onClick={saveSettings}
          disabled={
            !isDirty ||
            isSaving ||
            isLoading ||
            !automationSettingsApi.isConfigured()
          }
        >
          {isSaving && (
            <RefreshCw size={15} />
          )}

          {isSaving
            ? 'Saving...'
            : 'Save Changes'}
        </button>

        <span>
          {isDirty
            ? 'You have unsaved changes'
            : 'All changes saved'}
        </span>
      </div>
    </div>
  );
}