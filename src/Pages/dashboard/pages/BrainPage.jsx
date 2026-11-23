
import './BrainPage.css';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import * as Lucide from 'lucide-react';

import {
  PageHeader,
  Modal,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { getCurrentWorkspace } from '../../../services/dashboardApi';
import { useAuth } from '../../../context/AuthContext';

import { brainSetupApi } from '../../../services/dashboard/brain-setup.api.js';
import { brainAssistantApi } from '../../../services/dashboard/brain-assistant.api.js';
import { businessHoursApi } from '../../../services/dashboard/business-hours.api.js';
import { bookingRulesApi } from '../../../services/dashboard/booking-rules.api.js';
import { closedDatesApi } from '../../../services/dashboard/closed-dates.api.js';
import { staffApi } from '../../../services/dashboard/staff.api.js';
import { locationsApi } from '../../../services/dashboard/locations.api.js';
import { knowledgeApi } from '../../../services/dashboard/knowledge.api.js';
import { requestTypesApi } from '../../../services/dashboard/request-types.api.js';
import { testAiApi } from '../../../services/dashboard/test-ai.api.js';

// Safe icons: undefined Lucide exports will not crash React.
function Icon({ name, size = 17, ...props }) {
  const Component = Lucide[name];

  return Component
    ? <Component size={size} {...props} />
    : <span aria-hidden="true">◆</span>;
}

const brainTabs = [
  ['What AI Knows', 'what-ai-knows', 'Eye'],
  ['Setup', 'setup', 'SlidersHorizontal'],
  ['Hours & Staff', 'hours-staff', 'Users'],
  ['Locations', 'locations', 'MapPin'],
  ['Knowledge', 'knowledge', 'BookOpen'],
  ['Requests', 'requests', 'Target'],
  ['Test AI', 'test-ai', 'Bot'],
];

const knowledgeTabs = [
  ['FAQs', 'BookOpen'],
  ['Promotions', 'Tag'],
  ['Documents', 'FileText'],
  ['Website', 'Globe'],
  ['Chat Training', 'MessageSquare'],
];

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const initialSetup = {
  business_name: '',
  industry: '',
  whatsapp_number: '',
  business_address: '',
  business_phone: '',
  address: '',
  timezone: '',
  business_description: '',
  agent_name: 'Assistant',
  agent_gender: 'Not set',
  reply_language: 'Automatic',
  tone: 'Friendly',
  reply_length: 'Medium',
  custom_instructions: '',
  goodbye_message: '',
};

const initialRules = {
  offer_time: "Each service's own length",
  booking_gap: 'No gap',
  minimum_notice: 'No minimum',
  book_ahead: 'No limit',
  concurrent_customers: '1',
};

const initialStaff = {
  name: '',
  role: '',
  phone: '',
  hours_mode: 'business',
  location_id: '',
  is_active: true,
  custom_hours: [],
};

const initialLocation = {
  name: '', address: '', phone: '', notes: '',
  timezone: '', hours_type: 'same_as_business', is_primary: false,
};

const initialRequest = {
  name: '',
  detailsToCollect: '',
  whatHappensNext: '',
};

const initialEditor = {
  question: '',
  answer: '',
  title: '',
  content: '',
  valid_until: '',
  website_url: '',
  document_title: '',
  document_description: '',
  share_on_whatsapp: false,
  is_active: true,
};

function isConfigured(api) {
  return typeof api?.isConfigured !== 'function'
    || api.isConfigured();
}

function getError(error) {
  const fieldMessages = Array.isArray(error?.errors)
    ? error.errors.map((item) => item?.message).filter(Boolean)
    : [];
  return fieldMessages.join(' · ') || error?.message || 'The request could not be completed.';
}

const timezones = (() => {
  const defaults = ['Asia/Karachi', 'Asia/Dubai', 'Europe/London', 'America/New_York'];
  try {
    const all = Intl.supportedValuesOf?.('timeZone') || [];
    return [...new Set([...defaults, ...all])].sort();
  } catch { return defaults; }
})();

const hoursAsPayload = (rows) => ({
  schedule: weekDays.map((day) => {
    const item = rows.find((row) => row.day === day) || {};
    const closed = !item.enabled;
    const allDay = !closed && Boolean(item.is_24_hours);
    const breaks = closed ? [] : (item.breaks || []).map(({ start_time, end_time }) => ({
      start_time: shortTime(start_time), end_time: shortTime(end_time),
    }));
    if (breaks.length > 5) throw new Error(`${day}: maximum five breaks allowed.`);
    if (!closed && !allDay && (!item.start_time || !item.end_time)) {
      throw new Error(`${day}: opening and closing times are required.`);
    }
    return {
      day_of_week: day.toLowerCase(),
      is_closed: closed,
      is_24_hours: allDay,
      open_time: closed || allDay ? null : shortTime(item.start_time),
      close_time: closed || allDay ? null : shortTime(item.end_time),
      breaks,
    };
  }),
});

const ruleLabels = {
  offer_time: {
    service_length: "Each service's own length", first_available: 'First available',
    '15_min': '15 minutes', '30_min': '30 minutes', '60_min': '60 minutes',
  },
};
function rulesFromApi(data) {
  return {
    offer_time: ruleLabels.offer_time[data?.offer_time] || data?.offer_time || initialRules.offer_time,
    booking_gap: data?.gap_between_appointments ? `${data.gap_between_appointments} minutes` : 'No gap',
    minimum_notice: data?.minimum_notice_hours ? `${data.minimum_notice_hours} hour${data.minimum_notice_hours === 1 ? '' : 's'}` : 'No minimum',
    book_ahead: data?.how_far_ahead_days ? `${data.how_far_ahead_days} days` : 'No limit',
    concurrent_customers: String(data?.customers_at_same_time ?? 1),
  };
}
function rulesAsPayload(form) {
  const match = Object.entries(ruleLabels.offer_time).find(([, label]) => label === form.offer_time);
  return {
    offer_time: match?.[0] || form.offer_time || 'service_length',
    gap_between_appointments: parseInt(form.booking_gap, 10) || 0,
    minimum_notice_hours: parseInt(form.minimum_notice, 10) || 0,
    how_far_ahead_days: parseInt(form.book_ahead, 10) || 0,
    customers_at_same_time: Number(form.concurrent_customers) || 1,
  };
}

function WeeklyHoursEditor({ rows, setRows, disabled = false }) {
  const changeDay = (name, key, value) => setRows((previous) => previous.map((row) =>
    row.day === name ? { ...row, [key]: value } : row
  ));
  return (
    <div className="bb2-brain-custom-hours">
      {rows.map((day) => (
        <div className="bb2-brain-custom-day" key={day.day}>
          <label className="bb2-checkbox">
            <input type="checkbox" checked={Boolean(day.enabled)} disabled={disabled}
              onChange={(event) => changeDay(day.day, 'enabled', event.target.checked)} />
            {day.day}
          </label>
          {day.enabled ? <>
            <label className="bb2-checkbox">
              <input type="checkbox" checked={Boolean(day.is_24_hours)} disabled={disabled}
                onChange={(event) => changeDay(day.day, 'is_24_hours', event.target.checked)} />24 h
            </label>
            {!day.is_24_hours && <>
              <input type="time" className="bb2-control" disabled={disabled} value={day.start_time || ''}
                onChange={(event) => changeDay(day.day, 'start_time', event.target.value)} />
              <span>to</span>
              <input type="time" className="bb2-control" disabled={disabled} value={day.end_time || ''}
                onChange={(event) => changeDay(day.day, 'end_time', event.target.value)} />
            </>}
          </> : <span className="bb2-muted">Closed</span>}
        </div>
      ))}
      <small className="bb2-muted">For custom staff hours, all seven days are sent. Breaks can be managed from the main weekly schedule.</small>
    </div>
  );
}


function records(response, key) {
  if (Array.isArray(response)) return response;

  const result =
    response?.[key] ||
    response?.items ||
    response?.results ||
    [];

  return Array.isArray(result) ? result : [];
}

function shortTime(value) {
  return value ? String(value).slice(0, 5) : '';
}

function normaliseHours(response) {
  const source =
    response?.schedule ||
    response?.days ||
    response?.weekly_hours ||
    response?.hours ||
    response ||
    [];

  const rows = Array.isArray(source)
    ? source
    : Object.entries(source).map(([day, data]) => ({
        day,
        ...(data || {}),
      }));

  return weekDays.map((day) => {
    const match = rows.find(
      (item) =>
        String(item.day || item.day_of_week || item.name).toLowerCase()
        === day.toLowerCase()
    ) || {};

    return {
      day,
      enabled:
        match.enabled ??
        match.is_open ??
        (match.is_closed === false),
      is_24_hours: Boolean(
        match.is_24_hours || match.all_day
      ),
      start_time: shortTime(
        match.start_time ||
        match.open_time ||
        match.open
      ),
      end_time: shortTime(
        match.end_time ||
        match.close_time ||
        match.close
      ),
      breaks: Array.isArray(match.breaks)
        ? match.breaks
        : [],
    };
  });
}

function Field({ title, hint, wide = false, children }) {
  return (
    <label className={`bb2-field ${wide ? 'wide' : ''}`}>
      <span>{title}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SelectField({ value, onChange, choices, disabled = false }) {
  return (
    <select
      className="bb2-control"
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {choices.map((choice) => {
        const [key, label] = Array.isArray(choice)
          ? choice
          : [choice, choice];

        return (
          <option key={key} value={key}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function InfoCard({ title, children }) {
  return (
    <aside className="bb2-brain-info">
      <div>
        <Icon name="Info" size={16} />
        <strong>{title}</strong>
      </div>
      <p>{children}</p>
    </aside>
  );
}

function ChatPanel({
  heading,
  subheading,
  emptyText,
  suggestions = [],
  messages,
  sending,
  text,
  setText,
  submit,
  reset,
  disabled = false,
  tokenNotice = '',
  attachment,
  onAttachment,
  allowVoice = false,
}) {
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const speechRef = useRef(null);

  const [voiceError, setVoiceError] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
    };
  }, []);

  const startVoice = () => {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceError(
        'Voice typing is not supported in this browser.'
      );
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      setText((current) =>
        `${current} ${transcript}`.trim()
      );
    };

    recognition.onerror = (event) => {
      setVoiceError(`Voice input failed: ${event.error}`);
    };

    speechRef.current = recognition;
    recognition.start();
  };

  return (
    <section
      className={`bb2-chat ${
        heading ? 'bb2-chat-assistant' : 'bb2-chat-test'
      }`}
    >
      {heading && (
        <header className="bb2-chat-header">
          <span className="bb2-chat-mark">
            <Icon name="Sparkles" size={19} />
          </span>

          <div>
            <strong>{heading}</strong>
            <small>{subheading}</small>
          </div>

          <button
            type="button"
            title="Reset conversation"
            aria-label="Reset conversation"
            onClick={reset}
            disabled={sending}
          >
            <Icon name="RotateCcw" size={17} />
          </button>
        </header>
      )}

      <div
        className="bb2-chat-messages"
        ref={scrollRef}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="bb2-chat-welcome">
            <Icon
              name={heading ? 'Sparkles' : 'Bot'}
              size={28}
            />

            <p>{emptyText}</p>

            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setText(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`bb2-chat-bubble ${message.role}`}
          >
            {message.text}
          </div>
        ))}

        {sending && (
          <div
            className="bb2-chat-typing"
            role="status"
          >
            <span />
            <span />
            <span />
            Thinking…
          </div>
        )}
      </div>

      {tokenNotice && (
        <div className="bb2-tokens">
          {tokenNotice}
          <a href="/dashboard/billing">
            Add tokens
          </a>
        </div>
      )}

      {attachment && (
        <div className="bb2-chat-attachment">
          {attachment.name}

          <button
            type="button"
            onClick={() => onAttachment?.(null)}
          >
            Remove
          </button>
        </div>
      )}

      {voiceError && (
        <small
          className="bb2-chat-error"
          role="alert"
        >
          {voiceError}
        </small>
      )}

      <form
        className="bb2-chat-compose"
        onSubmit={submit}
      >
        {onAttachment && (
          <>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) =>
                onAttachment(
                  event.target.files?.[0] || null
                )
              }
            />

            <button
              type="button"
              title="Attach file"
              aria-label="Attach file"
              disabled={disabled || sending}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="Paperclip" size={18} />
            </button>
          </>
        )}

        <input
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder={
            heading
              ? 'Message the assistant…'
              : 'Type a message as a customer would…'
          }
          disabled={disabled || sending}
        />

        <button
          type={text.trim() ? 'submit' : 'button'}
          disabled={
            disabled ||
            sending ||
            (!text.trim() && !allowVoice)
          }
          aria-label={
            text.trim()
              ? 'Send message'
              : 'Voice typing'
          }
          onClick={
            !text.trim() && allowVoice
              ? startVoice
              : undefined
          }
        >
          <Icon
            name={
              text.trim()
                ? 'Send'
                : allowVoice
                  ? 'Mic'
                  : 'Send'
            }
            size={17}
          />
        </button>
      </form>
    </section>
  );
}

export default function BrainPage() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const requestedTab = searchParams.get('tab');

  const tab = brainTabs.some(
    ([, value]) => value === requestedTab
  )
    ? requestedTab
    : 'what-ai-knows';

  const {
    isStarted,
    isStatusKnown,
    isChecking: checkingPlan,
    openFreePlan,
  } = useFreePlan();

  const { Notice, showNotice } = useNotice();
  const { user } = useAuth();
  const role = String(user?.workspace_role || user?.current_workspace?.role || user?.role || user?.workspaces?.[0]?.role || '').toLowerCase();
  const readOnly = role === 'agent';


  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] =
    useState(true);
  const [overviewError, setOverviewError] =
    useState('');

  const [setup, setSetup] = useState(initialSetup);
  const [hours, setHours] = useState(() =>
    normaliseHours([])
  );
  const [rules, setRules] = useState(initialRules);

  const [closedDates, setClosedDates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [locations, setLocations] = useState([]);
  const [hoursLocation, setHoursLocation] = useState('');
  const [websiteDetails, setWebsiteDetails] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [entries, setEntries] = useState([]);
  const [requests, setRequests] = useState([]);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState('');

  const [modal, setModal] = useState('');
  const [staffForm, setStaffForm] = useState(initialStaff);

  const [locationForm, setLocationForm] = useState(initialLocation);
  const [locationCustomHours, setLocationCustomHours] = useState(() => normaliseHours([]));

  const [requestForm, setRequestForm] =
    useState(initialRequest);

  const [dateForm, setDateForm] = useState({
    date: '', day_type: 'Closed all day', reason: '',
    open_time: '09:00', close_time: '17:00',
  });

  const [knowledgeSection, setKnowledgeSection] =
    useState('FAQs');

  const [notApplicable, setNotApplicable] =
    useState({});

  const [editor, setEditor] = useState(initialEditor);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentEditingId, setDocumentEditingId] = useState(null);
  const [documentEditForm, setDocumentEditForm] = useState({ title: '', description: '', allow_whatsapp_share: false });

  const [knowledgeSearch, setKnowledgeSearch] =
    useState('');

  const [lookup, setLookup] = useState({
    question: '',
    result: '',
  });

  const [assistantText, setAssistantText] =
    useState('');
  const [assistantFile, setAssistantFile] =
    useState(null);
  const [assistantMessages, setAssistantMessages] =
    useState([]);
  const [assistantSending, setAssistantSending] =
    useState(false);

  const [testText, setTestText] = useState('');
  const [testMessages, setTestMessages] = useState([]);
  const [testSending, setTestSending] = useState(false);

  const changeTab = (value, anchor) => {
    setSearchParams(
      value === 'what-ai-knows'
        ? {}
        : { tab: value },
      { replace: true }
    );

    if (anchor) {
      window.requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  };

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const summary = await knowledgeApi.overview();
      setNotApplicable({
        FAQs: summary?.faqs?.is_applicable === false,
        Promotions: summary?.promotions?.is_applicable === false,
        Documents: summary?.documents?.is_applicable === false,
        Website: summary?.website?.is_applicable === false,
        'Chat Training': summary?.chat_training?.is_applicable === false,
      });
      // General What AI Knows summary has no Phase 1 endpoint.
      setOverview({
        faqs_count: summary?.faqs?.count ?? null,
        promotions_count: summary?.promotions?.count ?? null,
        documents_count: summary?.documents?.count ?? null,
        website_count: summary?.website?.status === 'not_connected' ? 0 : 1,
        website_connected: summary?.website?.status !== 'not_connected',
        chat_training_count: summary?.chat_training?.count ?? null,
      });
    } catch (error) { setOverviewError(getError(error)); }
    finally { setOverviewLoading(false); }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Load only the data required by the selected tab.
  useEffect(() => {
    let active = true;

    const setError = (key, message) => {
      if (!active) return;

      setErrors((current) => ({
        ...current,
        [key]: message,
      }));
    };

    async function loadResource(api, key, update, options = {}) {
      if (!isConfigured(api)) {
        setError(key, 'API is not configured.');
        return;
      }

      try {
        const response = await api.request(options);

        if (active) {
          update(response);
          setError(key, '');
        }
      } catch (error) {
        setError(key, getError(error));
      }
    }

    if (tab === 'setup') {
      if (isConfigured(brainSetupApi)) {
        Promise.all([
          brainSetupApi.request(),
          getCurrentWorkspace().catch(() => null),
        ])
          .then(([response, workspace]) => {
            if (!active) return;

            const value =
              response?.profile ||
              response?.settings ||
              response ||
              {};

            setSetup({
              ...initialSetup,
              ...value,
              business_name: value.business_name || workspace?.name || '',
              whatsapp_number: value.business_phone || '',
              business_address: value.address || '',
              timezone: value.timezone || '',
            });

            setError('setup', '');
          })
          .catch((error) =>
            setError('setup', getError(error))
          );
      } else {
        setError(
          'setup',
          'AI setup API is not configured.'
        );
      }
    }

    if (tab === 'hours-staff') {
      loadResource(
        businessHoursApi, 'hours',
        (response) => setHours(normaliseHours(response)),
        hoursLocation ? { query: { location_id: hoursLocation } } : {}
      );
      loadResource(locationsApi, 'locations', (response) => setLocations(records(response, 'locations')));

      loadResource(
        bookingRulesApi,
        'rules',
        (response) => setRules(rulesFromApi(response?.rules || response))
      );

      loadResource(
        closedDatesApi, 'dates',
        (response) => setClosedDates(records(response, 'dates')),
        hoursLocation ? { query: { location_id: hoursLocation } } : {}
      );

      loadResource(
        staffApi,
        'staff',
        (response) =>
          setStaff(records(response, 'staff'))
      );
    }

    if (tab === 'locations') {
      loadResource(
        locationsApi,
        'locations',
        (response) =>
          setLocations(records(response, 'locations'))
      );
    }

    if (tab === 'knowledge') {
      knowledgeApi.list('Documents')
        .then((response) => active && setDocuments(records(response, 'documents')))
        .catch((error) => setError('documents', getError(error)));
    }

    if (tab === 'requests' && isConfigured(requestTypesApi)) {
      loadResource(requestTypesApi, 'requests', (response) => setRequests(records(response, 'request_types')));
    }

    return () => {
      active = false;
    };
  }, [tab, hoursLocation]);

  // The Phase 1 backend has separate CRUD paths for every knowledge section.
  useEffect(() => {
    if (tab !== 'knowledge') return undefined;
    let active = true;
    setEditingKnowledgeId(null);
    setEditor(initialEditor);
    setEntries([]);
    if (knowledgeSection === 'Website') {
      knowledgeApi.website().then((value) => {
        if (active) {
          setWebsiteDetails(value);
          setEditor((current) => ({ ...current, website_url: value?.url || '' }));
        }
      }).catch((error) => {
        if (active) setErrors((current) => ({ ...current, entries: getError(error) }));
      });
    } else if (knowledgeSection !== 'Documents') {
      knowledgeApi.list(knowledgeSection).then((response) => {
        if (active) {
          setEntries(records(response, 'entries'));
          setErrors((current) => ({ ...current, entries: '' }));
        }
      }).catch((error) => {
        if (active) setErrors((current) => ({ ...current, entries: getError(error) }));
      });
    }
    return () => { active = false; };
  }, [tab, knowledgeSection]);

  const refreshKnowledgeList = async () => {
    if (knowledgeSection === 'Website') {
      const result = await knowledgeApi.website();
      setWebsiteDetails(result);
      setEditor((current) => ({ ...current, website_url: result?.url || '' }));
    } else if (knowledgeSection === 'Documents') {
      setDocuments(records(await knowledgeApi.list('Documents'), 'documents'));
    } else {
      setEntries(records(await knowledgeApi.list(knowledgeSection), 'entries'));
    }
    await loadOverview();
  };

  const beginEditKnowledge = (item) => {
    setEditingKnowledgeId(item.id);
    setEditor((current) => ({
      ...current,
      question: item.question || '', answer: item.answer || '',
      title: item.title || '',
      content: item.details || item.training_notes || '',
      valid_until: item.valid_until || '',
      is_active: item.is_active ?? true,
    }));
    document.getElementById('bb2-knowledge-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const removeKnowledgeItem = async (item) => {
    if (readOnly || !window.confirm('Delete this entry?')) return;
    setSaving('delete-knowledge');
    try {
      await knowledgeApi.remove(knowledgeSection, item.id);
      await refreshKnowledgeList();
      showNotice('Entry deleted.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  // Save through existing backend resource APIs.
  const saveResource = async (
    key,
    api,
    method,
    body,
    onSuccess
  ) => {
    if (readOnly) { showNotice('Agent role has read-only access.'); return; }
    if (!isConfigured(api)) {
      showNotice('This API is not configured yet.');
      return;
    }

    setSaving(key);

    try {
      const result = await api.request({
        method,
        body,
      });

      if (onSuccess) {
        await onSuccess(result);
      }

      showNotice('Changes saved.');
      await loadOverview();
    } catch (error) {
      showNotice(getError(error));
    } finally {
      setSaving('');
    }
  };

  const updateSetup = (key, value) =>
    setSetup((current) => ({
      ...current,
      [key]: value,
    }));

  const updateDay = (day, key, value) => {
    setHours((current) =>
      current.map((entry) =>
        entry.day === day
          ? { ...entry, [key]: value }
          : entry
      )
    );
  };

  const addBreak = (day) => {
    if (hours.find((row) => row.day === day)?.breaks?.length >= 5) {
      showNotice('Maximum five breaks are allowed per day.');
      return;
    }
    setHours((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              breaks: [
                ...entry.breaks,
                { start_time: '', end_time: '' },
              ],
            }
          : entry
      )
    );
  };

  const updateBreak = (day, index, key, value) => {
    setHours((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              breaks: entry.breaks.map((item, i) =>
                i === index
                  ? { ...item, [key]: value }
                  : item
              ),
            }
          : entry
      )
    );
  };

  const removeBreak = (day, index) => {
    setHours((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              breaks: entry.breaks.filter(
                (_, i) => i !== index
              ),
            }
          : entry
      )
    );
  };

  const copyDay = (day) => {
    setHours((current) => {
      const source = current.find(
        (entry) => entry.day === day
      );

      if (!source) return current;

      return current.map((entry) =>
        entry.day === day
          ? entry
          : {
              ...entry,
              enabled: source.enabled,
              is_24_hours: source.is_24_hours,
              start_time: source.start_time,
              end_time: source.end_time,
              breaks: source.breaks.map(
                (item) => ({ ...item })
              ),
            }
      );
    });
  };

  const hoursReadOnly = readOnly || Boolean(hoursLocation && locations.find(
    (place) => place.id === hoursLocation
  )?.hours_type === 'same_as_business');

  const saveHours = async () => {
    if (hoursReadOnly) return;
    try {
      const body = hoursAsPayload(hours);
      setSaving('hours');
      await businessHoursApi.request({
        method: 'PUT', body,
        query: hoursLocation ? { location_id: hoursLocation } : undefined,
      });
      showNotice('Working hours saved.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const saveSpecialDate = async (event) => {
    event.preventDefault();
    if (readOnly) return;
    const closed = dateForm.day_type === 'Closed all day';
    const body = {
      date: dateForm.date, location_id: hoursLocation || null,
      is_closed_all_day: closed,
      open_time: closed ? null : dateForm.open_time,
      close_time: closed ? null : dateForm.close_time,
      note: dateForm.reason.trim() || null,
    };
    setSaving('date');
    try {
      const created = await closedDatesApi.request({ method: 'POST', body });
      setClosedDates((current) => [...current, created]);
      setDateForm({ date: '', day_type: 'Closed all day', reason: '', open_time: '09:00', close_time: '17:00' });
      showNotice('Special date saved.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const saveNotApplicable = async () => {
    if (readOnly) return;
    const isApplicable = Boolean(notApplicable[knowledgeSection]);
    setSaving('applicability');
    try {
      await knowledgeApi.applicability(knowledgeSection, isApplicable);
      setNotApplicable((current) => ({ ...current, [knowledgeSection]: !isApplicable }));
      await loadOverview();
      showNotice('Knowledge preference saved.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const disconnectWebsite = async () => {
    if (readOnly || !window.confirm('Disconnect this website?')) return;
    setSaving('website-delete');
    try {
      await knowledgeApi.removeWebsite();
      await refreshKnowledgeList();
      setEditor((current) => ({ ...current, website_url: '' }));
      showNotice('Website disconnected.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const changePromotionStatus = async (item) => {
    if (readOnly) return;
    setSaving('promotion-toggle');
    try {
      await knowledgeApi.update('Promotions', item.id, { is_active: !item.is_active });
      await refreshKnowledgeList();
      showNotice('Promotion updated.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const sendAssistant = async (event) => {
    event.preventDefault();

    const message = assistantText.trim();

    if (!message || assistantSending) return;

    setAssistantMessages((current) => [
      ...current,
      { role: 'user', text: message },
    ]);

    setAssistantText('');
    setAssistantSending(true);

    try {
      if (!isConfigured(brainAssistantApi)) {
        throw new Error(
          'Brain Assistant API is not configured.'
        );
      }

      let body = { message };

      if (assistantFile) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('attachment', assistantFile);
        body = formData;
      }

      const response = await brainAssistantApi.request({
        method: 'POST',
        body,
      });

      const reply =
        response?.reply ||
        response?.answer ||
        response?.response;

      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error(
          'AI did not return a valid reply.'
        );
      }

      setAssistantMessages((current) => [
        ...current,
        { role: 'assistant', text: reply },
      ]);

      setAssistantFile(null);
    } catch (error) {
      setAssistantMessages((current) => [
        ...current,
        {
          role: 'error',
          text: getError(error),
        },
      ]);
    } finally {
      setAssistantSending(false);
    }
  };

  const sendTestMessage = async (message) => {
    setTestText('');

    setTestMessages((current) => [
      ...current,
      { role: 'user', text: message },
    ]);

    setTestSending(true);

    try {
      if (!isConfigured(testAiApi)) {
        throw new Error('Test AI API is not configured.');
      }

      const response = await testAiApi.request({
        method: 'POST',
        body: { message },
      });

      const reply =
        response?.reply ||
        response?.answer ||
        response?.response;

      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error(
          'AI did not return a valid reply.'
        );
      }

      setTestMessages((current) => [
        ...current,
        { role: 'assistant', text: reply },
      ]);
    } catch (error) {
      setTestMessages((current) => [
        ...current,
        {
          role: 'error',
          text: getError(error),
        },
      ]);
    } finally {
      setTestSending(false);
    }
  };

  const submitTest = (event) => {
    event.preventDefault();

    const message = testText.trim();

    if (
      !message ||
      testSending ||
      checkingPlan
    ) {
      return;
    }

    if (!isStatusKnown) {
      showNotice(
        'Free Plan status could not be verified.'
      );
      return;
    }

    if (!isStarted) {
      openFreePlan(() => sendTestMessage(message));
      return;
    }

    sendTestMessage(message);
  };

  // Phase 1 does not expose a knowledge-search API.
  // Keep the form handler, but do not invoke an unsupported endpoint.
  const checkKnowledge = (event) => {
    event.preventDefault();
    if (!lookup.question.trim()) return;
    showNotice('Knowledge search is planned for Phase 2.');
  };

  const submitKnowledge = async (event) => {
    event.preventDefault();
    if (readOnly) { showNotice('Agent role has read-only access.'); return; }
    setSaving('knowledge');
    try {
      if (knowledgeSection === 'Website') {
        await knowledgeApi.saveWebsite(editor.website_url.trim());
        showNotice('Website saved. AI learning is not active yet (Phase 1).');
      } else {
        let body;
        if (knowledgeSection === 'FAQs') {
          body = { question: editor.question.trim(), answer: editor.answer.trim() };
        } else if (knowledgeSection === 'Promotions') {
          body = {
            title: editor.title.trim(), details: editor.content.trim(),
            valid_until: editor.valid_until || null, is_active: editor.is_active,
          };
        } else if (knowledgeSection === 'Chat Training') {
          body = { title: editor.title.trim(), training_notes: editor.content.trim() };
        } else { throw new Error('This knowledge section does not support this form.'); }
        if (editingKnowledgeId) await knowledgeApi.update(knowledgeSection, editingKnowledgeId, body);
        else await knowledgeApi.create(knowledgeSection, body);
        showNotice(editingKnowledgeId ? 'Entry updated.' : 'Entry created.');
      }
      setEditingKnowledgeId(null);
      setEditor(initialEditor);
      await refreshKnowledgeList();
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const uploadDocument = async (event) => {
    event.preventDefault();
    if (readOnly) { showNotice('Agent role has read-only access.'); return; }
    if (!documentFile || !editor.document_title.trim()) {
      showNotice('Document title and file are required.'); return;
    }
    if (documentFile.size > 10 * 1024 * 1024) {
      showNotice('Maximum file size is 10 MB.'); return;
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(documentFile.type)) {
      showNotice('Supported files: PDF, PNG, JPG, JPEG and WebP.'); return;
    }
    const formData = new FormData();
    formData.append('file', documentFile);
    formData.append('title', editor.document_title.trim());
    formData.append('description', editor.document_description.trim());
    formData.append('allow_whatsapp_share', String(editor.share_on_whatsapp));
    setSaving('document');
    try {
      await knowledgeApi.uploadDocument(formData);
      setDocumentFile(null);
      setEditor((current) => ({ ...current, document_title: '', document_description: '', share_on_whatsapp: false }));
      await refreshKnowledgeList();
      showNotice('Document saved. AI learning is not active yet (Phase 1).');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const downloadDocument = async (documentId) => {
    try {
      // A new private signed link is required for EVERY download.
      const result = await knowledgeApi.downloadDocument(documentId);
      if (!result?.url) throw new Error('Download link was not returned.');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) { showNotice(getError(error)); }
  };

  const saveDocumentDetails = async (event) => {
    event.preventDefault();
    if (!documentEditingId || readOnly) return;
    setSaving('document-details');
    try {
      await knowledgeApi.update('Documents', documentEditingId, {
        title: documentEditForm.title.trim(),
        description: documentEditForm.description.trim() || null,
        allow_whatsapp_share: documentEditForm.allow_whatsapp_share,
      });
      setDocumentEditingId(null);
      await refreshKnowledgeList();
      showNotice('Document details saved.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };
  const beginDocumentEdit = (item) => {
    setDocumentEditingId(item.id);
    setDocumentEditForm({
      title: item.title || '',
      description: item.description || '',
      allow_whatsapp_share: Boolean(item.allow_whatsapp_share),
    });
  };

  const deleteDocument = async (item) => {
    if (readOnly || !window.confirm(`Delete ${item.title || item.file_name}?`)) return;
    setSaving('delete-document');
    try {
      await knowledgeApi.remove('Documents', item.id);
      await refreshKnowledgeList();
      showNotice('Document deleted.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const updateDocumentSharing = async (item, allowed) => {
    if (readOnly) return;
    setSaving(`document-${item.id}`);
    try {
      await knowledgeApi.update('Documents', item.id, { allow_whatsapp_share: allowed });
      await refreshKnowledgeList();
      showNotice('File-sharing preference updated.');
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  // Needs Attention depends ONLY on real business information,
  // not on whether the Free Plan has started.
  const serverAttention = Array.isArray(
    overview?.needs_attention
  )
    ? overview.needs_attention
    : Array.isArray(overview?.attention_items)
      ? overview.attention_items
      : null;

  const attention = serverAttention
    ? serverAttention.map((item) =>
        typeof item === 'string'
          ? { message: item }
          : item
      )
    : overview
      ? [
          (
            (
              Object.prototype.hasOwnProperty.call(
                overview,
                'business_description'
              ) &&
              !overview.business_description
            ) ||
            overview.business_profile_complete === false
          ) && {
            message:
              'Your business has no description, so the AI cannot explain what you do.',
            level: 'warning',
          },

          overview.services_count === 0 &&
          overview.products_count === 0 && {
            message:
              'You have no services or products yet, so the AI cannot take bookings or orders.',
            level: 'warning',
          },

          overview.hours_configured === false && {
            message:
              'Your opening hours need checking so the AI never offers unavailable times.',
            level: 'warning',
          },

          (
            overview.faqs_count === 0 ||
            overview.faq_count === 0
          ) && {
            message:
              'You have no FAQs yet. FAQs help the AI answer common questions.',
            level: 'info',
          },
        ].filter(Boolean)
      : [];

  const attentionAction = (item) => {
    const text = String(
      item.message ||
      item.title ||
      item.description ||
      ''
    );

    if (/hour|time/i.test(text)) {
      changeTab('hours-staff');
    } else if (/faq|knowledge/i.test(text)) {
      setKnowledgeSection('FAQs');
      changeTab('knowledge');
    } else if (/service|product/i.test(text)) {
      navigate('/dashboard/services');
    } else {
      changeTab('setup');
    }
  };

  const knownCards = [
    {
      title: 'Business profile',
      icon: 'Building2',
      value: 'Open Setup',
      detail:
        overview?.business_description ||
        'Your business description and details.',
      action: () => changeTab('setup'),
    },
    {
      title: 'Opening hours',
      icon: 'Clock3',
      value: 'View schedule',
      detail: 'Weekly working hours and availability.',
      action: () => changeTab('hours-staff'),
    },
    {
      title: 'Services',
      icon: 'ListChecks',
      value: overview?.services_count ?? '—',
      detail:
        'Services the AI can book for your customers.',
      action: () => navigate('/dashboard/services'),
    },
    {
      title: 'Products',
      icon: 'Package',
      value: overview?.products_count ?? '—',
      detail:
        'Products the AI can help customers order.',
      action: () => navigate('/dashboard/products'),
    },
    {
      title: 'Stored documents',
      icon: 'FileText',
      value: overview?.documents_count ?? '—',
      detail: 'Privately stored files. AI indexing is not active in Phase 1.',
      action: () => {
        setKnowledgeSection('Documents');
        changeTab('knowledge');
      },
    },
    {
      title: 'Personality and instructions',
      icon: 'Bot',
      value:
        overview?.ai_behaviour_summary ||
        (overview?.ai_behaviour_configured
          ? 'Configured'
          : 'Not configured'),
      detail:
        'Language, tone and special instructions.',
      action: () => changeTab('setup'),
    },
  ];

  const tokenBalance =
    overview?.tokens_remaining ??
    overview?.ai_tokens_remaining ??
    overview?.credit?.tokens_remaining;

  const updateEditor = (key, value) => {
    setEditor((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const closeModal = () => {
    setModal('');
    setEditingStaffId(null);
    setEditingLocationId(null);
    setStaffForm(initialStaff);
    setRequestForm(initialRequest);
    setLocationForm(initialLocation);
  };

  const openStaff = (item = null) => {
    setEditingStaffId(item?.id || null);
    setStaffForm(item ? {
      name: item.name || '', role: item.role || '', phone: item.phone || '',
      hours_mode: item.working_hours_type === 'own_hours' ? 'own' : 'business',
      location_id: item.location_id || '',
      is_active: item.is_active !== false,
      custom_hours: normaliseHours(item.custom_hours || hours),
    } : { ...initialStaff, custom_hours: normaliseHours(hours) });
    setModal('staff');
  };
  const openLocation = (item = null) => {
    setEditingLocationId(item?.id || null);
    setLocationForm(item ? {
      name: item.name || '', address: item.address || '',
      phone: item.phone || '', notes: item.notes || '',
      timezone: item.timezone || '',
      hours_type: item.hours_type || 'same_as_business',
      is_primary: Boolean(item.is_primary),
    } : { ...initialLocation, timezone: setup.timezone || '' });
    setLocationCustomHours(normaliseHours(hours));
    setModal('location');
    // Load the exact business/location schedule as the starting point.
    // GET /hours without location_id returns default business hours.
    businessHoursApi.request(item ? { query: { location_id: item.id } } : {})
      .then((result) => setLocationCustomHours(normaliseHours(result)))
      .catch((error) => showNotice(`Could not preload location hours: ${getError(error)}`));
  };

  const deleteEntity = async (api, resource, item, setItems) => {
    if (readOnly || !window.confirm(`Delete ${item.name}?`)) return;
    setSaving(`delete-${resource}`);
    try {
      await api.request({ method: 'DELETE', id: item.id });
      setItems((previous) => previous.filter((row) => row.id !== item.id));
      showNotice(`${resource} deleted.`);
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  const saveModal = async (event) => {
    event.preventDefault();
    if (readOnly) { showNotice('Agent role has read-only access.'); return; }
    if (modal === 'request') {
      showNotice('Request types are not covered by the Phase 1 AI Brain API.');
      return;
    }
    setSaving(modal);
    try {
      if (modal === 'staff') {
        const body = {
          name: staffForm.name.trim(), role: staffForm.role.trim(),
          phone: staffForm.phone.trim() || null,
          location_id: staffForm.location_id || null,
          working_hours_type: staffForm.hours_mode === 'own' ? 'own_hours' : 'same_as_business',
          custom_hours: staffForm.hours_mode === 'own' ? hoursAsPayload(staffForm.custom_hours).schedule : null,
          is_active: staffForm.is_active,
        };
        await staffApi.request({ method: editingStaffId ? 'PATCH' : 'POST', id: editingStaffId || undefined, body });
        const result = await staffApi.request();
        setStaff(records(result, 'staff'));
      } else if (modal === 'location') {
        // Validate 7-day hours BEFORE creating a new location, preventing
        // partially created locations for invalid local form values.
        const schedule = locationForm.hours_type === 'own_hours'
          ? hoursAsPayload(locationCustomHours) : null;
        const body = {
          ...locationForm,
          name: locationForm.name.trim(), address: locationForm.address.trim(),
          phone: locationForm.phone.trim() || null,
          notes: locationForm.notes.trim() || null,
          timezone: locationForm.timezone || null,
        };
        const result = await locationsApi.request({
          method: editingLocationId ? 'PATCH' : 'POST',
          id: editingLocationId || undefined,
          body,
        });
        const savedId = editingLocationId || result?.id || result?.location?.id;
        if (!editingLocationId && savedId) setEditingLocationId(savedId);
        if (schedule) {
          if (!savedId) throw new Error('Location was saved, but its ID was not returned. Reload Locations to set custom hours.');
          // A location with own_hours inherits a copy of business hours when
          // first saved, then receives its user-edited 7-day schedule.
          await businessHoursApi.request({
            method: 'PUT', query: { location_id: savedId }, body: schedule,
          });
        }
        const updated = await locationsApi.request();
        setLocations(records(updated, 'locations'));
      }
      showNotice('Changes saved.');
      closeModal();
    } catch (error) { showNotice(getError(error)); }
    finally { setSaving(''); }
  };

  return (
    <div className="bb2-brain">
      <PageHeader
        title="AI Brain"
        description="Manage your business settings and knowledge sources"
      />

      {Notice}

      <nav
        className="bb2-brain-tabs"
        aria-label="AI Brain sections"
      >
        {brainTabs.map(([title, value, icon]) => (
          <button
            type="button"
            key={value}
            className={tab === value ? 'active' : ''}
            onClick={() => changeTab(value)}
            aria-current={
              tab === value ? 'page' : undefined
            }
          >
            <Icon name={icon} size={15} />
            {title}
          </button>
        ))}
      </nav>

      {/* WHAT AI KNOWS */}
      {tab === 'what-ai-knows' && (
        <div className="bb2-overview-columns">
          <div className="bb2-overview-content">
            <h2>Your business knowledge overview</h2>
            <p className="bb2-muted">
              Navigate to Setup, Hours &amp; Staff, Locations or Knowledge to review the saved information.
              Phase 1 does not yet send this knowledge to an AI model.
            </p>

            {overviewError && (
              <div className="bb2-error" role="status">
                {overviewError}
                <button
                  type="button"
                  onClick={loadOverview}
                >
                  Retry
                </button>
              </div>
            )}

            <div className="bb2-attention-head">
              NEEDS ATTENTION ({attention.length})
            </div>

            {overviewLoading ? (
              <p className="bb2-muted">
                Checking your business knowledge…
              </p>
            ) : (
              attention.map((item, index) => {
                const message =
                  item.message ||
                  item.title ||
                  item.description ||
                  '';

                const informational =
                  item.level === 'info' ||
                  item.severity === 'info';

                return (
                  <div
                    key={item.id || index}
                    className={`bb2-attention ${
                      informational ? 'info' : ''
                    }`}
                  >
                    <Icon
                      name={
                        informational
                          ? 'Info'
                          : 'TriangleAlert'
                      }
                      size={17}
                    />

                    <span>{message}</span>

                    <button
                      type="button"
                      className="bb2-soft-button"
                      onClick={() =>
                        attentionAction(item)
                      }
                    >
                      Fix
                    </button>

                    <button
                      type="button"
                      className="bb2-main-button"
                      onClick={() =>
                        setAssistantText(
                          `Help me fix this: ${message}`
                        )
                      }
                    >
                      <Icon
                        name="Sparkles"
                        size={14}
                      />
                      Ask assistant
                    </button>
                  </div>
                );
              })
            )}

            {overview &&
              !overviewLoading &&
              attention.length === 0 && (
                <p className="bb2-muted">
                  No items need attention right now.
                </p>
              )}

            <section className="bb2-section">
              <h2>Always knows</h2>

              <p className="bb2-muted">
                This page shows business information saved in Phase 1. It is not yet sent to the AI model.
              </p>

              <div className="bb2-knows-grid">
                {knownCards.map((card) => (
                  <article
                    className="bb2-know-card"
                    key={card.title}
                  >
                    <div>
                      <span className="bb2-small-icon">
                        <Icon
                          name={card.icon}
                          size={17}
                        />
                      </span>

                      <div>
                        <strong>{card.title}</strong>
                        <small>
                          {String(card.value)}
                        </small>
                      </div>

                      <button
                        type="button"
                        title={`Edit ${card.title}`}
                        onClick={card.action}
                      >
                        <Icon
                          name="Pencil"
                          size={16}
                        />
                      </button>
                    </div>

                    <p>{card.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="bb2-section">
              <h2>Looks up when relevant</h2>

              <p className="bb2-muted">
                These stored knowledge records will become searchable when AI learning is enabled in a later phase.
              </p>

              <label className="bb2-search">
                <Icon name="Search" size={17} />

                <input
                  placeholder="Search what your AI knows…"
                  value={knowledgeSearch}
                  onChange={(event) =>
                    setKnowledgeSearch(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      setKnowledgeSection('FAQs');
                      changeTab('knowledge');
                    }
                  }}
                />
              </label>

              <div className="bb2-empty">
                <Icon name="FileText" size={24} />

                <strong>
                  {overview?.reference_material_count > 0
                    ? 'Reference material available'
                    : 'Nothing to look up yet'}
                </strong>

                <p>
                  Add FAQs, documents or promotions from the Knowledge tab.
                </p>
              </div>
            </section>

            <section className="bb2-section">
              <h2>Try a question</h2>
              <p className="bb2-phase1-notice">Question lookup is not available in Phase 1.</p>

              <p className="bb2-muted">
                See what your AI would read before
                answering a customer.
              </p>

              <form
                className="bb2-search-form"
                onSubmit={checkKnowledge}
              >
                <input
                  placeholder="e.g. Do you deliver on Sundays?"
                  value={lookup.question}
                  onChange={(event) =>
                    setLookup((current) => ({
                      ...current,
                      question: event.target.value,
                    }))
                  }
                />

                <button
                  className="bb2-main-button"
                  disabled={true}
                >
                  <Icon name="Search" size={15} />

                  {saving === 'lookup'
                    ? 'Checking…'
                    : 'Check'}
                </button>
              </form>

              {lookup.result && (
                <div className="bb2-result">
                  {lookup.result}
                </div>
              )}
            </section>

            <details className="bb2-rules">
              <summary>
                <Icon
                  name="ShieldCheck"
                  size={16}
                />
                Rules your AI always follows
              </summary>

              <p>
                Business instructions and opening
                hours are used when answering customers.
                Update these in Setup and Hours &amp;
                Staff.
              </p>
            </details>
          </div>

          <div className="bb2-brain-phase1-panel">
            <p className="bb2-phase1-notice" role="status">Brain Assistant chat is planned for a later backend phase. Setup, hours, staff and knowledge editing are available in the tabs.</p>
          <ChatPanel
            heading="Brain Assistant"
            subheading="Tell it about your business. It suggests changes."
            emptyText="Hi! I can see everything your AI knows about your business. Tell me what changed, or pick a place to start."
            suggestions={[
              'Set up my AI with me',
              'Help me write a short description of my business.',
              'Help me add my services.',
            ]}
            messages={assistantMessages}
            sending={assistantSending}
            text={assistantText}
            setText={setAssistantText}
            submit={sendAssistant}
            reset={() => {
              setAssistantMessages([]);
              setAssistantText('');
            }}
            disabled={true}
            tokenNotice={
              tokenBalance != null &&
              Number(tokenBalance) <= 0
                ? 'You are out of AI tokens, so the assistant cannot reply.'
                : ''
            }
            attachment={assistantFile}
            onAttachment={setAssistantFile}
            allowVoice
          />
          </div>
        </div>
      )}

      {/* SETUP */}
      {tab === 'setup' && (
        <div className="bb2-brain-page-content">
          <section className="bb2-section">
            <h2>Business info</h2>

            <p className="bb2-muted">
              Basic details about your business,
              used to personalise AI responses.
            </p>

            {errors.setup && (
              <p className="bb2-error">
                {errors.setup}
              </p>
            )}

            <div className="bb2-form-with-help">
              <form
                className="bb2-form-grid"
                onSubmit={(event) => {
                  event.preventDefault();

                  saveResource(
                    'setup', brainSetupApi, 'PUT',
                    {
                      business_name: setup.business_name.trim(),
                      industry: setup.industry?.trim() || null,
                      business_description: setup.business_description?.trim() || null,
                      timezone: setup.timezone || null,
                    }
                  );
                }}
              >
                <Field title="Business name *" wide>
                  <input
                    className="bb2-control"
                    required
                    value={setup.business_name}
                    onChange={(event) =>
                      updateSetup(
                        'business_name',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field title="Industry">
                  <input
                    className="bb2-control"
                    placeholder="Select or enter your business type"
                    value={setup.industry || ''}
                    onChange={(event) =>
                      updateSetup(
                        'industry',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  title="Business phone number"
                  hint="Connect WhatsApp to verify your business number."
                >
                  <input
                    className="bb2-control"
                    value={setup.whatsapp_number || setup.business_phone || ''}
                    placeholder="Connect WhatsApp to set it"
                    readOnly
                  />
                </Field>

                <Field
                  title="Location / address"
                  wide
                >
                  <div className="bb2-readonly">
                    <Icon name="MapPin" size={16} />

                    {setup.business_address || setup.address || 'Not set yet'}

                    <button
                      type="button"
                      onClick={() =>
                        changeTab('locations')
                      }
                    >
                      Edit in Locations
                    </button>
                  </div>
                </Field>

                <Field title="Business timezone" hint="IANA timezone used for opening hours and dates.">
                  <SelectField
                    disabled={readOnly}
                    value={setup.timezone || ''}
                    choices={[["", "Select your business timezone"], ...timezones]}
                    onChange={(value) => updateSetup('timezone', value)}
                  />
                </Field>

                <Field
                  title="Business description"
                  wide
                >
                  <textarea
                    className="bb2-control"
                    rows={4}
                    maxLength={1000}
                    placeholder="Brief description of your business for the AI…"
                    value={
                      setup.business_description || ''
                    }
                    onChange={(event) =>
                      updateSetup(
                        'business_description',
                        event.target.value
                      )
                    }
                  />

                  <small className="bb2-count">
                    {
                      (
                        setup.business_description || ''
                      ).length
                    }/1000
                  </small>
                </Field>

                <button
                  className="bb2-main-button"
                  disabled={readOnly || saving === 'setup'}
                >
                  {saving === 'setup'
                    ? 'Saving…'
                    : 'Save changes'}
                </button>
              </form>

              <InfoCard title="Why this matters">
                Your business name appears in AI
                greetings. The description helps the
                AI understand what you offer. Be
                specific about your services.
              </InfoCard>
            </div>
          </section>

          <section className="bb2-section bb2-divider-section">
            <h2>AI behaviour</h2>
            <p className="bb2-phase1-notice" role="status">
              Phase 1 does not provide an AI behaviour API. These settings are preview-only; saving is unavailable.
            </p>

            <p className="bb2-muted">
              Control how your AI agent communicates
              with customers.
            </p>

            <div className="bb2-form-with-help">
              <form
                className="bb2-form-grid"
                onSubmit={(event) => {
                  event.preventDefault();

                  showNotice('AI behaviour saving is not available in Phase 1.');
                }}
              >
                <Field title="AI agent name">
                  <input
                    className="bb2-control"
                    value={setup.agent_name || ''}
                    onChange={(event) =>
                      updateSetup(
                        'agent_name',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field title="AI agent gender">
                  <SelectField
                    value={setup.agent_gender}
                    choices={[
                      'Not set',
                      'Female',
                      'Male',
                      'Neutral',
                    ]}
                    onChange={(value) =>
                      updateSetup(
                        'agent_gender',
                        value
                      )
                    }
                  />
                </Field>

                <Field title="Reply language">
                  <SelectField
                    value={setup.reply_language}
                    choices={[
                      'Automatic',
                      'English',
                      'Urdu',
                      'Roman Urdu',
                      'Customer language',
                    ]}
                    onChange={(value) =>
                      updateSetup(
                        'reply_language',
                        value
                      )
                    }
                  />
                </Field>

                <Field title="Tone">
                  <SelectField
                    value={setup.tone}
                    choices={[
                      'Friendly',
                      'Professional',
                      'Casual',
                      'Formal',
                    ]}
                    onChange={(value) =>
                      updateSetup('tone', value)
                    }
                  />
                </Field>

                <Field title="Reply length">
                  <SelectField
                    value={setup.reply_length}
                    choices={[
                      'Short',
                      'Medium',
                      'Long',
                      'Balanced',
                    ]}
                    onChange={(value) =>
                      updateSetup(
                        'reply_length',
                        value
                      )
                    }
                  />
                </Field>

                <Field
                  title="Custom instructions"
                  wide
                  hint="Added to every AI prompt as extra context."
                >
                  <textarea
                    className="bb2-control"
                    rows={4}
                    placeholder="e.g. Always greet customers with Assalamualaikum…"
                    value={
                      setup.custom_instructions || ''
                    }
                    onChange={(event) =>
                      updateSetup(
                        'custom_instructions',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  title="Goodbye message (optional)"
                  wide
                >
                  <input
                    className="bb2-control"
                    placeholder="A message sent when a chat goes quiet"
                    value={
                      setup.goodbye_message || ''
                    }
                    onChange={(event) =>
                      updateSetup(
                        'goodbye_message',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <button
                  className="bb2-main-button"
                  disabled={true}
                >
                  {saving === 'behaviour'
                    ? 'Saving…'
                    : 'Save AI settings'}
                </button>
              </form>

              <div>
                <InfoCard title="Tone & language">
                  Auto-detect handles mixed English
                  and Urdu conversations. Choose
                  Friendly for most businesses.
                </InfoCard>

                <InfoCard title="Custom instructions">
                  Add greetings, disclaimers or rules
                  the AI should always follow.
                </InfoCard>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* HOURS & STAFF */}
      {tab === 'hours-staff' && (
        <div className="bb2-brain-page-content">
          <section className="bb2-section">
            <h2>Working hours</h2>

            <p className="bb2-muted">
              When your business is open. The AI
              uses this to answer availability
              questions.
            </p>

            <div className="bb2-brain-location-filter">
              <Field title="Working hours for">
                <SelectField
                  value={hoursLocation}
                  choices={[
                    ['', 'Default business hours'],
                    ...locations.map((place) => [place.id, `${place.name}${place.is_primary ? ' (Primary)' : ''}`]),
                  ]}
                  onChange={setHoursLocation}
                />
              </Field>
              {hoursLocation && locations.find((place) => place.id === hoursLocation)?.hours_type === 'same_as_business' && (
                <p className="bb2-phase1-notice">This location inherits business hours. Select Own hours in Locations to customize its schedule.</p>
              )}
            </div>

            {errors.hours && (
              <p className="bb2-error">
                {errors.hours}
              </p>
            )}

            <div className="bb2-form-with-help">
              <div>
                <div className="bb2-week">
                  {hours.map((day) => (
                    <div
                      key={day.day}
                      className={`bb2-day ${
                        !day.enabled ? 'closed' : ''
                      }`}
                    >
                      <div className="bb2-day-top">
                        <label>
                          <input
                            type="checkbox"
                            disabled={hoursReadOnly}
                            checked={Boolean(day.enabled)}
                            onChange={(event) =>
                              updateDay(
                                day.day,
                                'enabled',
                                event.target.checked
                              )
                            }
                          />
                          {day.day}
                        </label>

                        {day.enabled ? (
                          <>
                            <label className="bb2-24h">
                              <input
                                type="checkbox"
                                disabled={hoursReadOnly}
                                checked={Boolean(
                                  day.is_24_hours
                                )}
                                onChange={(event) =>
                                  updateDay(
                                    day.day,
                                    'is_24_hours',
                                    event.target.checked
                                  )
                                }
                              />
                              24 hours
                            </label>

                            <button
                              type="button"
                              className="bb2-icon-btn"
                              title="Copy these hours to other days"
                              disabled={hoursReadOnly}
                              onClick={() =>
                                copyDay(day.day)
                              }
                            >
                              <Icon
                                name="Copy"
                                size={16}
                              />
                            </button>

                            {!day.is_24_hours && (
                              <>
                                <input
                                  type="time"
                                  disabled={hoursReadOnly}
                                  value={day.start_time}
                                  onChange={(event) =>
                                    updateDay(
                                      day.day,
                                      'start_time',
                                      event.target.value
                                    )
                                  }
                                />

                                <span>to</span>

                                <input
                                  type="time"
                                  disabled={hoursReadOnly}
                                  value={day.end_time}
                                  onChange={(event) =>
                                    updateDay(
                                      day.day,
                                      'end_time',
                                      event.target.value
                                    )
                                  }
                                />
                              </>
                            )}
                          </>
                        ) : (
                          <span className="bb2-muted">
                            Closed
                          </span>
                        )}
                      </div>

                      {day.enabled &&
                        !day.is_24_hours && (
                          <div className="bb2-breaks">
                            {day.breaks.map(
                              (breakItem, index) => (
                                <div key={index}>
                                  <span>Break</span>

                                  <input
                                    type="time"
                                    disabled={hoursReadOnly}
                                    value={shortTime(
                                      breakItem.start_time
                                    )}
                                    onChange={(event) =>
                                      updateBreak(
                                        day.day,
                                        index,
                                        'start_time',
                                        event.target.value
                                      )
                                    }
                                  />

                                  <span>to</span>

                                  <input
                                    type="time"
                                    disabled={hoursReadOnly}
                                    value={shortTime(
                                      breakItem.end_time
                                    )}
                                    onChange={(event) =>
                                      updateBreak(
                                        day.day,
                                        index,
                                        'end_time',
                                        event.target.value
                                      )
                                    }
                                  />

                                  <button
                                    type="button"
                                    aria-label="Remove break"
                                    disabled={hoursReadOnly}
                                    onClick={() =>
                                      removeBreak(
                                        day.day,
                                        index
                                      )
                                    }
                                  >
                                    <Icon
                                      name="X"
                                      size={14}
                                    />
                                  </button>
                                </div>
                              )
                            )}

                            <button
                              type="button"
                              disabled={hoursReadOnly}
                              onClick={() =>
                                addBreak(day.day)
                              }
                            >
                              + Add a break
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="bb2-main-button"
                  disabled={hoursReadOnly || saving === 'hours'}
                  onClick={saveHours}
                >
                  {saving === 'hours'
                    ? 'Saving…'
                    : 'Save hours'}
                </button>
              </div>

              <InfoCard title="How hours are used">
                When a customer asks whether you're
                open, the AI checks these hours.
                Mark 24 hours for an always-open day,
                or add breaks to block times.
              </InfoCard>
            </div>
          </section>

          <section className="bb2-two-panels bb2-divider-section">
            <div className="bb2-card">
              <h2>Booking rules</h2>

              <p className="bb2-muted">
                How opening hours become the times
                offered to customers.
              </p>

              {errors.rules && (
                <p className="bb2-error">
                  {errors.rules}
                </p>
              )}

              <div className="bb2-form-grid">
                <Field title="Offer a time">
                  <SelectField
                    value={rules.offer_time}
                    choices={[
                      "Each service's own length",
                      'First available',
                      '15 minutes',
                      '30 minutes',
                      '60 minutes',
                    ]}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        offer_time: value,
                      }))
                    }
                  />
                </Field>

                <Field title="Gap between appointments">
                  <SelectField
                    value={rules.booking_gap}
                    choices={[
                      'No gap',
                      '5 minutes',
                      '10 minutes',
                      '15 minutes',
                      '30 minutes',
                    ]}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        booking_gap: value,
                      }))
                    }
                  />
                </Field>

                <Field title="Minimum notice">
                  <SelectField
                    value={rules.minimum_notice}
                    choices={[
                      'No minimum',
                      '1 hour',
                      '2 hours',
                      '4 hours',
                      '24 hours',
                    ]}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        minimum_notice: value,
                      }))
                    }
                  />
                </Field>

                <Field title="How far ahead">
                  <SelectField
                    value={rules.book_ahead}
                    choices={[
                      'No limit',
                      '7 days',
                      '14 days',
                      '30 days',
                      '60 days',
                    ]}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        book_ahead: value,
                      }))
                    }
                  />
                </Field>

                <Field title="Customers at the same time">
                  <input
                    className="bb2-control"
                    type="number"
                    min={1}
                    max={100}
                    value={
                      rules.concurrent_customers || 1
                    }
                    onChange={(event) =>
                      setRules((current) => ({
                        ...current,
                        concurrent_customers:
                          event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <button
                type="button"
                className="bb2-main-button"
                disabled={readOnly || saving === 'rules'}
                onClick={() =>
                  saveResource(
                    'rules',
                    bookingRulesApi,
                    'PUT',
                      rulesAsPayload(rules)
                    )
                }
              >
                Save booking rules
              </button>
            </div>

            <div className="bb2-card">
              <h2>Closed days and special hours</h2>

              <p className="bb2-muted">
                A date that differs from your weekly
                hours, such as a holiday or a shorter
                day.
              </p>

              {closedDates.map((item) => (
                <div
                  className="bb2-saved-row"
                  key={item.id || item.date}
                >
                  <span>
                    {item.date} ·{' '}
                    {item.note || (item.is_closed_all_day ? 'Closed all day' : `${shortTime(item.open_time)}–${shortTime(item.close_time)}`)}
                  </span>

                  <button
                    type="button"
                    disabled={readOnly || saving === 'delete-date'}
                    onClick={async () => {
                      if (!item.id) {
                        showNotice(
                          'This date has no backend identifier.'
                        );
                        return;
                      }

                      setSaving('delete-date');

                      try {
                        await closedDatesApi.request({
                          method: 'DELETE',
                          id: item.id,
                        });

                        setClosedDates((current) =>
                          current.filter(
                            (entry) => entry !== item
                          )
                        );

                        showNotice('Date deleted.');
                      } catch (error) {
                        showNotice(getError(error));
                      } finally {
                        setSaving('');
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <form
                className="bb2-form-grid"
                onSubmit={saveSpecialDate}
              >
                <Field title="Date">
                  <input
                    className="bb2-control"
                    type="date"
                    required
                    value={dateForm.date}
                    onChange={(event) =>
                      setDateForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field title="That day">
                  <SelectField
                    value={dateForm.day_type}
                    choices={[
                      'Closed all day',
                      'Special opening hours',
                    ]}
                    onChange={(value) =>
                      setDateForm((current) => ({
                        ...current,
                        day_type: value,
                      }))
                    }
                  />
                </Field>

                {dateForm.day_type === 'Special opening hours' && <>
                  <Field title="Opening time *">
                    <input type="time" className="bb2-control" required value={dateForm.open_time}
                      onChange={(event) => setDateForm((current) => ({ ...current, open_time: event.target.value }))} />
                  </Field>
                  <Field title="Closing time *">
                    <input type="time" className="bb2-control" required value={dateForm.close_time}
                      onChange={(event) => setDateForm((current) => ({ ...current, close_time: event.target.value }))} />
                  </Field>
                </>}
                <Field
                  title="Note for customers (optional)"
                  wide
                >
                  <input
                    className="bb2-control"
                    placeholder="e.g. Public holiday"
                    value={dateForm.reason}
                    onChange={(event) =>
                      setDateForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                  />
                </Field>

                <button
                  className="bb2-soft-button"
                  disabled={readOnly || saving === 'date'}
                >
                  Add date
                </button>
              </form>
            </div>
          </section>

          <section className="bb2-section bb2-divider-section">
            <div className="bb2-heading-with-action">
              <div>
                <h2>Staff members</h2>
                <p className="bb2-muted">
                  Staff the AI can assign appointments
                  to and answer questions about.
                </p>
              </div>

              <button
                type="button"
                className="bb2-main-button"
                onClick={() => openStaff()}
              >
                <Icon name="Plus" size={16} />
                Add staff
              </button>
            </div>

            {errors.staff && (
              <p className="bb2-error">
                {errors.staff}
              </p>
            )}

            {staff.length > 0 ? (
              staff.map((person) => (
                <div
                  className="bb2-saved-row"
                  key={
                    person.id ||
                    person.staff_id ||
                    person.name
                  }
                >
                  <span>
                    {person.name} ·{' '}
                    {person.role || 'Staff'}
                    {person.is_active === false ? ' · Inactive' : ''}
                  </span>
                  {!readOnly && <div className="bb2-brain-row-actions">
                    <button type="button" onClick={() => openStaff(person)}>Edit</button>
                    <button type="button" disabled={Boolean(saving)}
                      onClick={() => deleteEntity(staffApi, 'Staff', person, setStaff)}>Delete</button>
                  </div>}
                </div>
              ))
            ) : (
              <div className="bb2-empty">
                <Icon name="Users" size={26} />
                <strong>No staff members yet</strong>
                <p>
                  Add staff so the AI can assign
                  appointments.
                </p>

                <button
                  type="button"
                  className="bb2-main-button"
                  disabled={readOnly}
                  onClick={() => openStaff()}
                >
                  Add first staff member
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* LOCATIONS */}
      {tab === 'locations' && (
        <div className="bb2-brain-page-content">
          <div className="bb2-heading-with-action">
            <div>
              <h2>Business locations</h2>
              <p className="bb2-muted">
                Branches or places your AI can suggest
                to customers.
              </p>
            </div>

            <button
              type="button"
              className="bb2-main-button"
              disabled={readOnly}
              onClick={() => openLocation()}
            >
              <Icon name="Plus" size={16} />
              Add location
            </button>
          </div>

          {errors.locations && (
            <p className="bb2-error">
              {errors.locations}
            </p>
          )}

          {locations.length ? (
            <div className="bb2-knows-grid">
              {locations.map((location) => (
                <article
                  className="bb2-know-card"
                  key={
                    location.id ||
                    location.location_id ||
                    location.name
                  }
                >
                  <strong>{location.name}</strong>
                  <p>{location.address}</p>
                  <small>{location.phone || ''}</small>
                  <p className="bb2-muted">{location.is_primary ? 'Primary · ' : ''}
                    {location.hours_type === 'own_hours' ? 'Own hours' : 'Same as business'}
                    {location.effective_timezone ? ` · ${location.effective_timezone}` : ''}
                  </p>
                  {!readOnly && <div className="bb2-brain-row-actions">
                    <button type="button" onClick={() => openLocation(location)}>Edit</button>
                    <button type="button" disabled={Boolean(saving)}
                      onClick={() => deleteEntity(locationsApi, 'Location', location, setLocations)}>Delete</button>
                  </div>}
                </article>
              ))}
            </div>
          ) : (
            <div className="bb2-empty">
              <Icon name="MapPin" size={26} />
              <strong>No locations yet</strong>
              <p>Add your first business location.</p>

              <button
                type="button"
                className="bb2-main-button"
                disabled={readOnly}
                onClick={() => openLocation()}
              >
                Add first location
              </button>
            </div>
          )}
        </div>
      )}

      {/* KNOWLEDGE */}
      {tab === 'knowledge' && (
        <div className="bb2-brain-page-content">
          <div className="bb2-knowledge-stats">
            {knowledgeTabs.map(([name, icon]) => {
              const countMap = {
                FAQs: overview?.faqs_count,
                Promotions: overview?.promotions_count,
                Documents: overview?.documents_count,
                Website: overview?.website_count,
                'Chat Training':
                  overview?.chat_training_count,
              };

              return (
                <article key={name}>
                  <div>
                    <Icon name={icon} size={15} />
                    {name}
                  </div>

                  <strong>
                    {countMap[name] ?? '—'}
                  </strong>

                  {name === 'Website' &&
                    !overview?.website_connected && (
                      <small>Not connected</small>
                    )}
                </article>
              );
            })}
          </div>

          <nav
            className="bb2-knowledge-tabs"
            aria-label="Knowledge categories"
          >
            {knowledgeTabs.map(([name, icon]) => (
              <button
                type="button"
                key={name}
                className={
                  knowledgeSection === name
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setKnowledgeSection(name)
                }
              >
                <Icon name={icon} size={15} />
                {name}
              </button>
            ))}
          </nav>

          <section className="bb2-section">
            <h2>{knowledgeSection}</h2>
            <p className="bb2-phase1-notice" role="status">
              Phase 1 saves and validates knowledge records. Document indexing, website crawling, and AI learning are not active yet.
            </p>

            <p className="bb2-muted">
              {knowledgeSection === 'FAQs'
                ? 'Manage FAQs in your knowledge base. AI learning is not active in Phase 1.'
                : knowledgeSection === 'Promotions'
                  ? 'Save promotions and their status. AI responses are not connected in Phase 1.'
                  : knowledgeSection === 'Documents'
                    ? 'Upload PDFs and images for private storage. Processing and AI sharing are not active in Phase 1.'
                    : knowledgeSection === 'Website'
                      ? 'Save a public website URL. Automatic crawling is not active in Phase 1.'
                      : 'Store correction and training notes. Model training is not active in Phase 1.'}
            </p>

            <button
              type="button"
              className="bb2-text-link"
              disabled={readOnly || saving === 'applicability'}
              onClick={saveNotApplicable}
            >
              {notApplicable[knowledgeSection]
                ? 'Mark as applicable'
                : 'Not applicable to my business'}
            </button>

            {errors.entries &&
              knowledgeSection !== 'Documents' && (
                <p className="bb2-error">
                  {errors.entries}
                </p>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'FAQs' && (
                <>
                  <form
                    id="bb2-knowledge-entry-form"
                    className="bb2-knowledge-form"
                    onSubmit={submitKnowledge}
                  >
                    <Field title="Question *">
                      <input
                        className="bb2-control"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder="What are your opening hours?"
                        value={editor.question}
                        onChange={(event) =>
                          updateEditor(
                            'question',
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <Field title="Answer *">
                      <textarea
                        className="bb2-control"
                        required
                        maxLength={5000}
                        rows={3}
                        value={editor.answer}
                        onChange={(event) =>
                          updateEditor(
                            'answer',
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <button
                      className="bb2-main-button"
                      disabled={readOnly || saving === 'knowledge'}
                    >
                      <Icon name={editingKnowledgeId ? 'Save' : 'Plus'} size={16} />
                      {editingKnowledgeId ? 'Update FAQ' : 'Save FAQ'}
                    </button>
                  </form>

                  <div className="bb2-knowledge-list">
                    {entries.map((item) => (
                      <div key={item.id || item.question}>
                        <strong>
                          {item.question || item.title}
                        </strong>

                        <p>{item.answer || item.content}</p>
                        {!readOnly && <div className="bb2-brain-row-actions">
                          <button type="button" onClick={() => beginEditKnowledge(item)}>Edit</button>
                          <button type="button" disabled={Boolean(saving)} onClick={() => removeKnowledgeItem(item)}>Delete</button>
                        </div>}
                      </div>
                    ))}

                    {!entries.length && (
                      <p className="bb2-muted">
                        No FAQs yet. Add your first FAQ
                        above.
                      </p>
                    )}
                  </div>

                  <div className="bb2-divider" />

                  <h2>Q&amp;A log</h2>
                  <p className="bb2-phase1-notice">Unanswered customer questions are not available from this Phase 1 API.</p>

                  <p className="bb2-muted">
                    Questions the AI couldn't answer.
                    Review them and teach your AI.
                  </p>

                  <div className="bb2-empty">
                    <Icon name="Brain" size={24} />
                    <strong>
                      Questions will appear here when
                      provided by the backend.
                    </strong>
                  </div>
                </>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'Promotions' && (
                <>
                <form
                  id="bb2-knowledge-entry-form"
                  className="bb2-knowledge-form"
                  onSubmit={submitKnowledge}
                >
                  <p className="bb2-muted">
                    Active promotions can be mentioned
                    when customers ask about pricing
                    or services.
                  </p>

                  <Field title="Title *">
                    <input
                      className="bb2-control"
                      required
                      minLength={2}
                      maxLength={200}
                      value={editor.title}
                      placeholder="e.g. Eid Special, 20% off all services"
                      onChange={(event) =>
                        updateEditor(
                          'title',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field title="Details">
                    <textarea
                      className="bb2-control"
                      rows={3}
                      maxLength={2000}
                      value={editor.content}
                      placeholder="e.g. Book before 30 June to avail…"
                      onChange={(event) =>
                        updateEditor(
                          'content',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field title="Valid until">
                    <input
                      className="bb2-control"
                      type="date"
                      value={editor.valid_until}
                      onChange={(event) =>
                        updateEditor(
                          'valid_until',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <label className="bb2-checkbox">
                    <input type="checkbox" checked={Boolean(editor.is_active)} disabled={readOnly}
                      onChange={(event) => updateEditor('is_active', event.target.checked)} />
                    Promotion active
                  </label>
                  <button className="bb2-main-button" disabled={readOnly || saving === 'knowledge'}>
                    <Icon name={editingKnowledgeId ? 'Save' : 'Plus'} size={16} />
                    {editingKnowledgeId ? 'Update promotion' : 'Add promotion'}
                  </button>
                </form>
                <div className="bb2-knowledge-list">
                  {entries.map((item) => (
                    <div key={item.id}>
                      <strong>{item.title}</strong>
                      <p>{item.details || 'No additional details'} · {item.is_currently_valid ? 'Currently valid' : item.is_active ? 'Active' : 'Paused'}
                        {item.valid_until ? ` · Ends ${item.valid_until}` : ''}</p>
                      {!readOnly && <div className="bb2-brain-row-actions">
                        <button type="button" onClick={() => beginEditKnowledge(item)}>Edit</button>
                        <button type="button" onClick={() => changePromotionStatus(item)} disabled={Boolean(saving)}>{item.is_active ? 'Pause' : 'Activate'}</button>
                        <button type="button" onClick={() => removeKnowledgeItem(item)} disabled={Boolean(saving)}>Delete</button>
                      </div>}
                    </div>
                  ))}
                </div>
              </>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'Documents' && (
                <div className="bb2-form-with-help">
                  <form
                    className="bb2-knowledge-form"
                    onSubmit={uploadDocument}
                  >
                    <Field title="Title *">
                      <input
                        className="bb2-control"
                        required
                        maxLength={200}
                        value={editor.document_title}
                        onChange={(event) =>
                          updateEditor(
                            'document_title',
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <Field title="Description">
                      <textarea
                        className="bb2-control"
                        rows={2}
                        maxLength={1000}
                        value={
                          editor.document_description
                        }
                        placeholder="Send this when customers ask for the menu…"
                        onChange={(event) =>
                          updateEditor(
                            'document_description',
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <Field title="File (max 10 MB) *">
                      <input
                        className="bb2-control"
                        type="file"
                        required={!documentFile}
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={(event) =>
                          setDocumentFile(
                            event.target.files?.[0] ||
                              null
                          )
                        }
                      />
                    </Field>

                    <label className="bb2-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          editor.share_on_whatsapp
                        }
                        onChange={(event) =>
                          updateEditor(
                            'share_on_whatsapp',
                            event.target.checked
                          )
                        }
                      />

                      Allow this document to be sent to
                      customers on WhatsApp
                    </label>

                    <button
                      className="bb2-main-button"
                      disabled={readOnly || saving === 'document'}
                    >
                      <Icon name="Upload" size={16} />
                      Upload document
                    </button>

                    {errors.documents && (
                      <p className="bb2-error">
                        {errors.documents}
                      </p>
                    )}

                    {documents.map((item) => (
                      <div className="bb2-saved-row bb2-brain-document-row" key={item.id || item.document_id || item.title}>
                        <div className="bb2-brain-document-details">
                          <strong>{item.title || item.file_name}</strong>
                          <small>{item.file_name || ''} · {item.ai_ready ? 'AI ready' : 'Pending — AI learning not active yet'}</small>
                          <label className="bb2-checkbox">
                            <input type="checkbox" disabled={readOnly || Boolean(saving)}
                              checked={Boolean(item.allow_whatsapp_share)}
                              onChange={(event) => updateDocumentSharing(item, event.target.checked)} />
                            Allow WhatsApp file sharing (setting only in Phase 1)
                          </label>
                        </div>
                        <div className="bb2-brain-row-actions">
                          <button type="button" onClick={() => downloadDocument(item.id)}>Download</button>
                          {!readOnly && <button type="button" disabled={Boolean(saving)} onClick={() => beginDocumentEdit(item)}>Edit</button>}
                          {!readOnly && <button type="button" disabled={Boolean(saving)} onClick={() => deleteDocument(item)}>Delete</button>}
                        </div>
                      </div>
                    ))}
                  </form>
                  {documentEditingId && <form className="bb2-brain-doc-edit" onSubmit={saveDocumentDetails}>
                    <h3>Edit document details</h3>
                    <Field title="Title *"><input className="bb2-control" required maxLength={200}
                      value={documentEditForm.title} onChange={(e) => setDocumentEditForm((v) => ({ ...v, title: e.target.value }))} /></Field>
                    <Field title="Description"><textarea className="bb2-control" maxLength={1000} rows={2}
                      value={documentEditForm.description} onChange={(e) => setDocumentEditForm((v) => ({ ...v, description: e.target.value }))} /></Field>
                    <div className="bb2-brain-row-actions">
                      <button type="submit" className="bb2-main-button" disabled={readOnly || Boolean(saving)}>Save details</button>
                      <button type="button" className="bb2-soft-button" onClick={() => setDocumentEditingId(null)}>Cancel</button>
                    </div>
                  </form>}

                  <InfoCard title="Phase 1 document storage">
                    Files are privately stored but remain pending with ai_ready false. Processing, AI learning and automatic sending are not active in this phase.
                  </InfoCard>
                </div>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'Website' && (
                <div className="bb2-form-with-help">
                  <form
                    className="bb2-knowledge-form"
                    onSubmit={submitKnowledge}
                  >
                    <p className="bb2-muted">
                      Phase 1 validates and saves your website URL. Crawling is not active yet.
                    </p>

                    <Field title="Website URL *">
                      <input
                        type="url"
                        required
                        className="bb2-control"
                        maxLength={500}
                        placeholder="https://yourbusiness.com"
                        value={editor.website_url}
                        onChange={(event) =>
                          updateEditor(
                            'website_url',
                            event.target.value
                          )
                        }
                      />
                    </Field>

                    <button
                      className="bb2-main-button"
                      disabled={readOnly || saving === 'knowledge'}
                    >
                      <Icon name="Globe" size={16} />
                      Save website URL
                    </button>
                  </form>

                  <div className="bb2-brain-website-status" role="status">
                    <strong>Website status: {websiteDetails?.status || 'Not connected'}</strong>
                    <span>{websiteDetails?.ai_ready ? 'AI ready' : 'AI learning not active yet'}</span>
                    {websiteDetails?.url && <small>{websiteDetails.url}</small>}
                    {websiteDetails?.url && !readOnly && (
                      <button type="button" className="bb2-soft-button" disabled={Boolean(saving)} onClick={disconnectWebsite}>Disconnect website</button>
                    )}
                  </div>
                  <InfoCard title="Website registration">
                    The backend saves your website address with pending status. Crawling is planned for Phase 2.
                  </InfoCard>
                </div>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'Chat Training' && (
                <>
                <form
                  id="bb2-knowledge-entry-form"
                  className="bb2-knowledge-form"
                  onSubmit={submitKnowledge}
                >
                  <Field title="Training title *">
                    <input
                      className="bb2-control"
                      required
                      minLength={2}
                      maxLength={255}
                      value={editor.title}
                      onChange={(event) =>
                        updateEditor(
                          'title',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field title="Correct response or training notes *">
                    <textarea
                      className="bb2-control"
                      rows={5}
                      required
                      minLength={3}
                      maxLength={5000}
                      value={editor.content}
                      onChange={(event) =>
                        updateEditor(
                          'content',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <button className="bb2-main-button" disabled={readOnly || saving === 'knowledge'}>
                    {editingKnowledgeId ? 'Update training' : 'Save training'}
                  </button>
                </form>
                <div className="bb2-knowledge-list">
                  {entries.map((item) => (
                    <div key={item.id}>
                      <strong>{item.title}</strong>
                      <p>{item.training_notes}</p>
                      {!readOnly && <div className="bb2-brain-row-actions">
                        <button type="button" onClick={() => beginEditKnowledge(item)}>Edit</button>
                        <button type="button" onClick={() => removeKnowledgeItem(item)} disabled={Boolean(saving)}>Delete</button>
                      </div>}
                    </div>
                  ))}
                </div>
                </>
              )}
          </section>
        </div>
      )}

      {/* REQUESTS */}
      {tab === 'requests' && (
        <div className="bb2-brain-page-content">
          <div className="bb2-heading-with-action">
            <div>
              <h2>Request types</h2>
              <p className="bb2-muted">
                Request types are planned for a later backend phase. No API endpoint is supplied in the Phase 1 AI Brain documentation.
              </p>
            </div>

            <button
              type="button"
              className="bb2-main-button"
              disabled={true}
              onClick={() => setModal('request')}
            >
              <Icon name="Plus" size={16} />
              Add Request Type
            </button>
          </div>

          {errors.requests && (
            <p className="bb2-error">
              {errors.requests}
            </p>
          )}

          {requests.length ? (
            requests.map((item) => (
              <article
                className="bb2-saved-row"
                key={
                  item.id ||
                  item.request_type_id ||
                  item.name
                }
              >
                <span>
                  <b>{item.name}</b>
                  {' · '}
                  {item.details_to_collect ||
                    'No additional details'}
                </span>
              </article>
            ))
          ) : (
            <div className="bb2-empty">
              <Icon name="ClipboardList" size={26} />

              <strong>Nothing to collect yet</strong>

              <p>
                Request type management is not enabled in Phase 1.
              </p>

              <button
                type="button"
                className="bb2-main-button"
                disabled={true}
              onClick={() => setModal('request')}
              >
                Add Request Type
              </button>
            </div>
          )}
        </div>
      )}

      {/* TEST AI */}
      {tab === 'test-ai' && (
        <div className="bb2-test-area">
          <div className="bb2-test-head">
            <p>
              Test AI is planned for a later backend phase. It is disabled until the backend provides a real test chat endpoint.
            </p>

            <button
              type="button"
              className="bb2-soft-button"
              disabled={testSending}
              onClick={() => {
                setTestMessages([]);
                setTestText('');
              }}
            >
              <Icon name="RotateCcw" size={15} />
              Reset
            </button>
          </div>

          <ChatPanel
            emptyText="Say hello to start testing your AI."
            messages={testMessages}
            sending={testSending}
            text={testText}
            setText={setTestText}
            submit={submitTest}
            reset={() => setTestMessages([])}
            disabled={true}
          />

          {!isConfigured(testAiApi) && (
            <p className="bb2-error">
              Test AI is not available in the Phase 1 AI Brain API.
            </p>
          )}
        </div>
      )}

      {/* ADD STAFF / LOCATION / REQUEST MODAL */}
      {modal && (
        <Modal
          title={
            modal === 'staff'
              ? (editingStaffId ? 'Edit staff member' : 'Add staff member')
              : modal === 'location'
                ? (editingLocationId ? 'Edit location' : 'Add location')
                : 'Add Request Type'
          }
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                className="bb2-soft-button"
                onClick={closeModal}
                disabled={Boolean(saving)}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="bb2-brain-modal"
                className="bb2-main-button"
                disabled={readOnly || Boolean(saving) || modal === 'request'}
              >
                {saving ? 'Saving…' : editingStaffId || editingLocationId ? 'Update' : 'Save'}
              </button>
            </>
          }
        >
          <form
            id="bb2-brain-modal"
            className="bb2-form-grid"
            onSubmit={saveModal}
          >
            {(
              modal === 'staff'
                ? [
                    ['name', 'Name'],
                    ['role', 'Role'],
                    ['phone', 'Phone'],
                  ]
                : modal === 'location'
                  ? [
                      ['name', 'Location name'],
                      ['address', 'Address'],
                      ['phone', 'Phone'],
                      ['notes', 'Notes'],
                    ]
                  : [
                      ['name', 'Name'],
                      [
                        'detailsToCollect',
                        'Details to collect',
                      ],
                      [
                        'whatHappensNext',
                        'What happens next',
                      ],
                    ]
            ).map(([key, title]) => {
              const current =
                modal === 'staff'
                  ? staffForm
                  : modal === 'location'
                    ? locationForm
                    : requestForm;

              const setCurrent =
                modal === 'staff'
                  ? setStaffForm
                  : modal === 'location'
                    ? setLocationForm
                    : setRequestForm;

              return (
                <Field key={key} title={title}>
                  <input
                    className="bb2-control"
                    required={modal === 'staff' ? ['name', 'role'].includes(key) : modal === 'location' ? ['name', 'address'].includes(key) : true}
                    disabled={readOnly}
                    maxLength={key === 'name' ? (modal === 'staff' ? 100 : 120) : key === 'role' ? 100 : key === 'address' ? 255 : key === 'notes' ? 500 : undefined}
                    value={current[key] || ''}
                    onChange={(event) =>
                      setCurrent((value) => ({
                        ...value,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </Field>
              );
            })}

            {modal === 'staff' && <>
              <Field title="Assigned location">
                <SelectField value={staffForm.location_id} disabled={readOnly}
                  choices={[["", "No specific location"], ...locations.map((l) => [l.id, l.name])]}
                  onChange={(value) => setStaffForm((previous) => ({ ...previous, location_id: value }))} />
              </Field>
              <Field title="Working hours">
                <SelectField
                  value={staffForm.hours_mode}
                  disabled={readOnly}
                  choices={[
                    [
                      'business',
                      'Same as business',
                    ],
                    ['own', 'Own hours'],
                  ]}
                  onChange={(value) =>
                    setStaffForm((current) => ({
                      ...current,
                      hours_mode: value,
                    }))
                  }
                />
              </Field>
              <label className="bb2-checkbox">
                <input type="checkbox" checked={staffForm.is_active} disabled={readOnly}
                  onChange={(event) => setStaffForm((old) => ({ ...old, is_active: event.target.checked }))} />
                Active staff member
              </label>
              {staffForm.hours_mode === 'own' && (
                <div className="bb2-field wide">
                  <strong>Custom weekly hours *</strong>
                  <WeeklyHoursEditor rows={staffForm.custom_hours} disabled={readOnly}
                    setRows={(fn) => setStaffForm((old) => ({ ...old, custom_hours: fn(old.custom_hours) }))} />
                </div>
              )}
            </>}
            {modal === 'location' && <>
              <Field title="Location timezone">
                <SelectField value={locationForm.timezone} disabled={readOnly}
                  choices={[["", "Use business timezone"], ...timezones]}
                  onChange={(value) => setLocationForm((old) => ({ ...old, timezone: value }))} />
              </Field>
              <Field title="Location working hours">
                <SelectField value={locationForm.hours_type} disabled={readOnly}
                  choices={[["same_as_business", "Same as business"], ["own_hours", "Own hours (copies business schedule)"]]}
                  onChange={(value) => setLocationForm((old) => ({ ...old, hours_type: value }))} />
              </Field>
              <label className="bb2-checkbox">
                <input type="checkbox" checked={locationForm.is_primary} disabled={readOnly || (editingLocationId && locations.find((l) => l.id === editingLocationId)?.is_primary)}
                  onChange={(event) => setLocationForm((old) => ({ ...old, is_primary: event.target.checked }))} />
                Primary business location
              </label>
              {locationForm.hours_type === 'own_hours' && (
                <div className="bb2-field wide">
                  <strong>Location custom weekly hours *</strong>
                  <WeeklyHoursEditor rows={locationCustomHours} disabled={readOnly}
                    setRows={setLocationCustomHours} />
                  <small className="bb2-muted">Hours are saved for this location after the location record is saved.</small>
                </div>
              )}
            </>}
          </form>
        </Modal>
      )}
    </div>
  );
}
