
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
import { friendlyDashboardError } from '../../../components/dashboard/common/dashboardFormErrors';

import { brainSetupApi } from '../../../services/dashboard/brain-setup.api.js';
import { brainOverviewApi, brainConfigApi } from '../../../services/dashboard/brain-overview.api.js';
import { freePlanStatusApi } from '../../../services/dashboard/free-plan-status.api.js';
import { brainAssistantApi } from '../../../services/dashboard/brain-assistant.api.js';
import { businessHoursApi } from '../../../services/dashboard/business-hours.api.js';
import { bookingRulesApi } from '../../../services/dashboard/booking-rules.api.js';
import { closedDatesApi } from '../../../services/dashboard/closed-dates.api.js';
import { staffApi } from '../../../services/dashboard/staff.api.js';
import { locationsApi } from '../../../services/dashboard/locations.api.js';
import { knowledgeApi } from '../../../services/dashboard/knowledge.api.js';
import RequestTypesPanel from './RequestTypesPanel.jsx';
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
  return friendlyDashboardError(fieldMessages[0] || error?.message || 'The request could not be completed.');
}

const STREAM_PROGRESS = {
  accepted: 'Message received…',
  thinking: 'Thinking…',
  searching_knowledge: 'Searching your knowledge…',
  checking_hours: 'Checking opening hours…',
  listing_locations: 'Checking locations…',
  recording_handover: 'Checking handover…',
  reading_configuration: 'Reading your AI setup…',
  reading_attachment: 'Reading your attachment…',
  preparing_proposal: 'Preparing changes for your approval…',
  checking_answer: 'Checking the answer…',
  repairing: 'Double-checking the answer…',
};

function shouldRetryAsJson(error) {
  // Older backend deployments may have JSON messaging but not SSE yet.
  // Also resume a disconnected stream using the SAME client_message_id.
  return error?.code === 'STREAM_INTERRUPTED' ||
    (error?.status === 404 && ['NOT_FOUND_404', 'HTTP_ERROR'].includes(error?.code));
}

function appendChatCustomer(setMessages, text) {
  setMessages((rows) => {
    const cleaned = rows.filter((row) => row.role !== 'error');
    const last = cleaned[cleaned.length - 1];
    return last?.role === 'user' && last.text === text
      ? cleaned
      : [...cleaned, { role: 'user', text }];
  });
}

async function recoverChatResult(jsonMessage, onWaiting) {
  let response = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    response = await jsonMessage();
    if (response?.reply) return response;
    onWaiting?.('Finishing the previous answer…');
    if (attempt < 7) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  return response;
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
    // Ignore untouched placeholder breaks. Partial entries must be completed.
    const breaks = closed ? [] : (item.breaks || [])
      .filter((b) => Boolean(b.start_time || b.end_time))
      .map(({ start_time, end_time }) => ({
        start_time: shortTime(start_time), end_time: shortTime(end_time),
      }));
    if (breaks.length > 5) throw new Error(`${day}: maximum five breaks allowed.`);
    if (!closed && !allDay && (!item.start_time || !item.end_time)) {
      throw new Error(`${day}: opening and closing times are required.`);
    }
    const minutes = (value) => {
      if (!/^\d{2}:\d{2}$/.test(value || '')) return NaN;
      const [hour, minute] = value.split(':').map(Number);
      return hour < 24 && minute < 60 ? hour * 60 + minute : NaN;
    };
    const opening = minutes(shortTime(item.start_time));
    const closing = minutes(shortTime(item.end_time));
    if (!closed && !allDay && (!Number.isFinite(opening) || !Number.isFinite(closing) || closing === opening)) {
      throw new Error(`${day}: please check the opening and closing times.`);
    }
    const orderedBreaks = [];
    for (const current of breaks) {
      const start = minutes(current.start_time);
      const end = minutes(current.end_time);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        throw new Error(`${day}: Invalid break time. End time must be after start time.`);
      }
      // Same-day schedules are safe to validate here; overnight schedules
      // remain subject to the backend's existing overnight-hours rules.
      if (!allDay && closing > opening && (start < opening || end > closing)) {
        throw new Error(`${day}: Invalid break time. Choose a break within working hours.`);
      }
      orderedBreaks.push({ start, end });
    }
    orderedBreaks.sort((a, b) => a.start - b.start);
    if (orderedBreaks.some((b, i) => i > 0 && b.start < orderedBreaks[i - 1].end)) {
      throw new Error(`${day}: Break times cannot overlap.`);
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

const DOCUMENT_PROCESSING_STATUSES = new Set([
  'pending', 'queued', 'uploaded', 'processing', 'extracting',
  'chunking', 'indexing',
]);

function isDocumentProcessing(item) {
  const detail = String(item?.status_detail || '').toLowerCase();
  return DOCUMENT_PROCESSING_STATUSES.has(String(item?.status || '').toLowerCase()) ||
    detail === 'retry_scheduled' || detail === 'waiting_for_provider';
}

function describeDocumentStatus(item) {
  if (item?.ai_ready === true) return 'AI ready — approved and usable';
  const status = String(item?.status || 'pending').replaceAll('_', ' ');
  const explanation = {
    retry_scheduled: 'Temporary processing issue — retry scheduled',
    waiting_for_provider: 'AI provider unavailable — waiting to retry',
    provider_not_configured: 'AI processing is not configured on the server',
    awaiting_approval: 'This document version needs approval',
    section_not_applicable: 'Documents are disabled in AI knowledge',
  };
  const details = [explanation[item?.status_detail] || status];
  if (item?.status_detail && item.status_detail !== item.status && !explanation[item.status_detail]) {
    details.push(item.status_detail.replaceAll('_', ' '));
  }
  if (item?.error_message) details.push(item.error_message);
  if (item?.error_code && !details.some((text) => String(text).includes(item.error_code))) {
    details.push(`Code: ${item.error_code}`);
  }
  if (item?.approval_status && item.approval_status !== 'approved') {
    details.push(`Approval: ${item.approval_status}`);
  }
  return details.join(' · ');
}

// Open the tab during the click gesture, before the signed-link API resolves.
// This avoids browsers silently blocking a window.open() after an awaited call.
async function openPrivateDocument(getSignedLink, onError) {
  const popup = window.open('about:blank', '_blank');
  if (popup) popup.opener = null;
  try {
    const result = await getSignedLink();
    if (!result?.url) throw new Error('The backend did not return a download URL.');
    const link = new URL(result.url);
    const isLocalDev = link.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(link.hostname);
    if (link.protocol !== 'https:' && !isLocalDev) {
      throw new Error('The backend returned an unsafe document URL.');
    }
    if (popup && !popup.closed) {
      popup.location.replace(link.href);
    } else {
      // Some browsers block the initial new tab. Open in this tab as a fallback.
      window.location.assign(link.href);
    }
  } catch (error) {
    if (popup && !popup.closed) popup.close();
    onError?.(error);
  }
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
  progress = '',
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

  // Brain Assistant supports an attachment without typed text.
  // The Test AI composer (which has no onAttachment) is unchanged.
  const canSend = Boolean(text.trim() || (onAttachment && attachment));

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
            disabled={sending || disabled}
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
            {message.request_preview && (
              <aside className="kr-test-preview" aria-label="Test AI request preview">
                <strong>{message.request_preview.stage === 'would_create' ? 'This test would create a request' :
                  message.request_preview.stage === 'needs_confirmation' ? 'Waiting for customer confirmation' :
                  'Collecting request details'}</strong>
                <span>{message.request_preview.request_type || 'Customer request'} — Test mode only; nothing is saved.</span>
                {(message.request_preview.fields || []).map((field, index) => (
                  <span key={`${field.label || index}-${index}`}>{field.label || 'Detail'}: {field.value || 'Not collected yet'}</span>
                ))}
                {message.request_preview.summary && <span>{message.request_preview.summary}</span>}
              </aside>
            )}
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
            {progress || 'Thinking…'}
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
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(event) => {
                onAttachment(event.target.files?.[0] || null);
                // Selecting the same file again must still fire onChange.
                event.target.value = '';
              }}
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
          type={canSend ? 'submit' : 'button'}
          disabled={disabled || sending || (!canSend && !allowVoice)}
          aria-label={canSend ? 'Send message or attachment' : 'Voice typing'}
          onClick={!canSend && allowVoice ? startVoice : undefined}
        >
          <Icon
            name={canSend ? 'Send' : allowVoice ? 'Mic' : 'Send'}
            size={17}
          />
        </button>
      </form>
    </section>
  );
}

// Crawler V3: use backend-owned status and coverage; missing fields are normal
// for older crawls. Never infer readiness from status alone.
const CRAWLER_RUNNING = new Set(['pending', 'extracting', 'chunking', 'indexing']);

function isWebsiteProcessing(website) {
  if (!website || website.status_detail === 'provider_not_configured') return false;
  return CRAWLER_RUNNING.has(website.status) ||
    ['retry_scheduled', 'waiting_for_provider'].includes(website.status_detail);
}

function readableDate(value) {
  if (!value) return 'Not yet crawled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

function websiteStatusText(website) {
  if (!website?.url || website.status === 'not_connected') return 'Not connected';
  const detail = website.status_detail;
  if (website.ai_ready === true) {
    if (isWebsiteProcessing(website)) return 'AI ready · Refreshing website';
    if (['failed', 'needs_review'].includes(website.status)) return 'AI ready · Previous version serving';
    if (detail === 'retry_scheduled' || detail === 'waiting_for_provider') return 'AI ready · Refresh retry scheduled';
    return 'AI ready';
  }
  if (detail === 'provider_not_configured') return 'Crawler processing is not configured';
  if (detail === 'retry_scheduled' || detail === 'waiting_for_provider') return 'Waiting to retry';
  if (website.status === 'needs_review') return 'Needs review';
  if (website.status === 'failed') return 'Crawl failed';
  if (isWebsiteProcessing(website)) return 'Processing website…';
  return 'Not AI ready';
}

function SafeSource({ url, children }) {
  let target = null;
  try {
    const parsed = new URL(String(url || ''));
    if (['https:', 'http:'].includes(parsed.protocol)) target = parsed.href;
  } catch { /* URLs from a crawl may be incomplete; render as text */ }
  return target
    ? <a href={target} target="_blank" rel="noopener noreferrer">{children || url}</a>
    : <span>{children || url || 'Unknown source'}</span>;
}

function WebsiteCoverageDetails({ coverage }) {
  if (!coverage || typeof coverage !== 'object') {
    return <p className="bb2-muted">Crawl coverage is not available yet. Refresh after processing.</p>;
  }
  const duplicates = coverage.duplicates || {};
  const skipped = coverage.skipped || {};
  const conflicts = Array.isArray(coverage.conflicts) ? coverage.conflicts : [];
  const failedPages = Array.isArray(coverage.failed_pages) ? coverage.failed_pages : [];
  const notCrawled = Array.isArray(coverage.not_crawled) ? coverage.not_crawled : [];
  const crawledPages = Array.isArray(coverage.pages) ? coverage.pages : [];
  const missingPages = Array.isArray(coverage.missing_important_pages) ? coverage.missing_important_pages : [];
  const documentsFound = Array.isArray(coverage.documents_found) ? coverage.documents_found : [];
  const facts = coverage.facts || {};
  const metrics = [
    ['Pages read', coverage.pages_indexed ?? 0],
    ['Pages attempted', coverage.pages_attempted ?? 0],
    ['Business pages', coverage.important_pages_indexed ?? 0],
    ['Broken links', coverage.broken_links ?? 0],
    ['Unchanged pages', coverage.pages_unchanged ?? 0],
    ['Structured found', coverage.structured_facts ?? 0],
    ['Structured indexed', coverage.structured_facts_indexed ?? 0],
  ];
  return <div className="bb2-crawler-coverage">
    <div className="bb2-crawler-metrics">
      {metrics.map(([label,value]) => <div className="bb2-crawler-stat" key={label}><strong>{value}</strong><small>{label}</small></div>)}
    </div>
    {coverage.javascript_only && <div className="bb2-crawler-alert">
      <strong>JavaScript-only website</strong>
      <p>Only accessible structured data and metadata may have been read. Add FAQs or documents for missing information.</p>
    </div>}
    {coverage.limit_reached && <p className="bb2-crawler-alert">Crawl limit reached{coverage.limit_reason ? `: ${coverage.limit_reason}` : '.'}</p>}
    {coverage.primary_language && <p className="bb2-muted">Primary language: {coverage.primary_language} · Alternate-language pages skipped: {coverage.language_alternates ?? 0}</p>}
    <div className="bb2-crawler-two-col">
      <section className="bb2-crawler-detail-card">
        <h4>Duplicates skipped (not errors)</h4>
        <p>Duplicate pages: {duplicates.duplicate_page ?? 0} · Similar pages: {duplicates.near_duplicate ?? skipped.near_duplicate ?? 0} · Query variants: {duplicates.query_variant ?? skipped.query_variant ?? 0} · Duplicate content: {duplicates.duplicate_content ?? 0}</p>
        <p>Blocked by robots.txt: {skipped.blocked_by_robots ?? 0}</p>
        <p>Skipped pages and their reasons are not counted as crawl failures.</p>
        {Object.entries(skipped).filter(([reason, count]) => count > 0 && !['blocked_by_robots','near_duplicate','query_variant'].includes(reason)).map(([reason, count]) => (
          <p key={reason}>{reason.replaceAll('_', ' ')}: {count}</p>
        ))}
      </section>
      <section className="bb2-crawler-detail-card">
        <h4>Changes and gaps</h4>
        <p>Held conflicting lines: {coverage.held ?? 0}</p>
        <p>Price changes: {coverage.changes?.prices ?? 0} · Phone changes: {coverage.changes?.phones ?? 0} · Hours changes: {coverage.changes?.hours ?? 0}</p>
        {coverage.changes?.detected_at && <small>Detected {readableDate(coverage.changes.detected_at)}</small>}
      </section>
    </div>
    {conflicts.length > 0 && <section className="bb2-crawler-warning-group">
      <h4>Website contradictions ({conflicts.length})</h4>
      <p className="bb2-muted">Only held values are excluded. Flagged addresses remain available for review; visible text wins over conflicting structured data.</p>
      {conflicts.map((conflict,i) => <article key={`${conflict.kind || 'conflict'}-${i}`} className="bb2-crawler-conflict">
        <strong>{conflict.subject || conflict.kind || 'Conflicting information'} — {conflict.resolution === 'held' ? 'Not used by AI' : conflict.resolution === 'visible_wins' ? 'Visible page text wins' : 'Flagged for review (not held)'}</strong>
        {conflict.reason && <small className="bb2-crawler-reason">Reason: {String(conflict.reason).replaceAll('_', ' ')}</small>}
        {(Array.isArray(conflict.values) ? conflict.values : []).map((val,j) => <p key={j}>
          <span>{val.value || 'Unknown value'}</span> <small>({val.source || 'website'})</small>{val.url && <> · <SafeSource url={val.url}>Source page</SafeSource></>}
        </p>)}
      </article>)}
    </section>}
    {(missingPages.length > 0 || failedPages.length > 0) && <section className="bb2-crawler-warning-group">
      <h4>Pages needing attention</h4>
      {missingPages.map((entry,i) => <p key={`missing-${i}`}>Missing business page: {typeof entry === 'string' ? entry : entry?.url || entry?.title || 'Unknown page'}</p>)}
      {failedPages.map((entry,i) => <p key={`failed-${i}`}>Failed page: {typeof entry === 'string' ? entry : entry?.url || entry?.reason || 'Unknown page'}</p>)}
    </section>}
    {notCrawled.length > 0 && <section className="bb2-crawler-detail-card">
      <h4>Not read because of the page limit ({notCrawled.length})</h4>
      <p className="bb2-muted">These pages were discovered but not crawled within the 25-page budget. They are not failed pages.</p>
      {notCrawled.map((entry,i) => <p key={`unread-${i}`}>
        <SafeSource url={typeof entry === 'string' ? entry : entry?.url}>{typeof entry === 'string' ? entry : entry?.url || 'Page'}</SafeSource>
        {entry?.important && <small> · Important page</small>}
      </p>)}
    </section>}
    {crawledPages.length > 0 && <details className="bb2-crawler-detail-card bb2-crawler-page-diagnostics">
      <summary>Page diagnostics ({crawledPages.length})</summary>
      <div className="bb2-crawler-page-diagnostics-scroll"><table>
        <thead><tr><th>Page</th><th>Type</th><th>Score</th><th>Characters</th><th>Facts</th><th>Reused</th></tr></thead>
        <tbody>{crawledPages.map((page,i) => <tr key={`${page?.canonical_url || page?.url || i}`}>
          <td><SafeSource url={page?.url}>{page?.title || page?.url || `Page ${i+1}`}</SafeSource></td>
          <td>{page?.page_type || '—'}</td><td>{page?.score ?? '—'}</td>
          <td>{page?.characters ?? '—'}</td>
          <td>{Object.entries(page?.facts || {}).filter(([,value]) => Number(value)>0).map(([key,value]) => `${key}: ${value}`).join(', ') || '—'}</td>
          <td>{page?.reused === true ? 'Yes' : page?.reused === false ? 'No' : '—'}</td>
        </tr>)}</tbody>
      </table></div>
    </details>}
    {documentsFound.length > 0 && <section className="bb2-crawler-detail-card">
      <h4>PDFs discovered ({documentsFound.length})</h4>
      <p className="bb2-muted">Imported PDFs appear separately in Knowledge → Documents. Discovery alone does not prove an import succeeded.</p>
      {documentsFound.map((doc,i) => <p key={i}><SafeSource url={doc.url}>{doc.title || doc.url || 'PDF'}</SafeSource></p>)}
    </section>}
    {(facts.phones?.length > 0 || facts.emails?.length > 0 || facts.addresses?.length > 0 || facts.hours) && <details className="bb2-crawler-facts">
      <summary>Published website facts</summary>
      {['phones','emails','addresses'].map((type) => (Array.isArray(facts[type]) ? facts[type] : []).map((fact,i) =>
        <p key={`${type}-${i}`}><strong>{type === 'addresses' && fact.role ? `${fact.role.replaceAll('_',' ')} address` : type}:</strong> {fact.value || '—'} {fact.source && <small>({fact.source})</small>}</p>
      ))}
      {facts.hours && <p><strong>Website hours:</strong> {Object.entries(facts.hours).map(([day,hours]) => `${day}: ${hours}`).join(' · ')}</p>}
    </details>}
  </div>;
}

function WebsiteCrawlerDetails({ website, notify, onReview, refreshVersion }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!website?.url || website.status === 'not_connected') { setItem(null); setError(''); return undefined; }
    let active = true;
    setLoading(true);
    setItem(null);
    setError('');
    const load = async () => {
      try {
        const list = await knowledgeApi.items({ source_type: 'website', page_size: 10 });
        const found = (Array.isArray(list?.items) ? list.items : []).find((entry) => entry.source_type === 'website');
        const data = found?.id || found?.item_id ? await knowledgeApi.item(found.id || found.item_id) : null;
        if (active) { setItem(data); setError(''); }
      } catch (failure) { if (active) setError(getError(failure)); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [website?.url, website?.status, website?.last_crawled_at, refreshVersion]);
  if (!website?.url || website.status === 'not_connected') return null;
  return <section className="bb2-crawler-insights" aria-label="Website crawler details">
    <div className="bb2-crawler-section-heading">
      <h3>Website coverage &amp; review</h3>
      {item && <button type="button" className="bb2-soft-button" onClick={() => onReview(item)}>
        <Icon name="ListChecks" size={15}/> Review extracted pages
      </button>}
    </div>
    {loading && <p className="bb2-muted">Loading website crawl coverage…</p>}
    {error && <p className="bb2-error" role="alert">{error}</p>}
    {item ? <>
      <p className="bb2-muted">Knowledge version {item.source_version ?? '—'} · Approval: {item.approval_status || 'Unknown'}</p>
      <WebsiteCoverageDetails coverage={item.coverage}/>
    </> : !loading && !error ? <p className="bb2-muted">The crawler has not registered a knowledge item yet. Refresh after processing.</p> : null}
  </section>;
}

function ReviewPageBlocks({ blocks, held = false }) {
  if (!Array.isArray(blocks) || !blocks.length) return null;
  return <div className={held ? 'bb2-crawler-held-blocks' : 'bb2-crawler-trusted-blocks'}>
    <strong>{held ? 'Not used by AI — held conflicting text' : 'Extracted content (usable only when AI ready)'}</strong>
    {blocks.map((block,index) => <div key={index} className="bb2-crawler-review-block">
      <small className={held ? 'bb2-crawler-held-label' : 'bb2-crawler-source-label'}>
        {held ? 'Held / excluded' : block.source === 'structured_data' ? 'From website structured data' : 'Visible website content'}
      </small>
      {block.text && <p>{block.text}</p>}
      {Array.isArray(block.rows) && block.rows.length > 0 && <pre>{JSON.stringify(block.rows,null,2)}</pre>}
    </div>)}
  </div>;
}

function BrainKnowledgeExplorer({ readOnly, notify, reviewDocument = null, onKnowledgeChanged }) {
  const [items, setItems] = useState([]);
  const [sourceType, setSourceType] = useState('');
  const [status, setStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState(null);
  const [correction, setCorrection] = useState('');
  const [confirmedReview, setConfirmedReview] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Open the exact knowledge item backing the selected document, rather than
  // leaving the owner to guess which source to review.
  useEffect(() => {
    if (!reviewDocument) return undefined;
    let active = true;
    setSourceType(reviewDocument.source_type || 'document');
    setStatus('');
    setSearchText('');
    setSearchResults(null);
    setSelected(null);
    setReview(null);
    setCorrection('');
    setConfirmedReview(false);
    if (!reviewDocument.knowledge_item_id) {
      setError('This document has not received a knowledge item ID yet. Refresh the document list after processing starts.');
      return undefined;
    }
    const open = async () => {
      setBusy('detail');
      try {
        const item = await knowledgeApi.item(reviewDocument.knowledge_item_id);
        const reviewData = await knowledgeApi.review(reviewDocument.knowledge_item_id, { page: 1, page_size: 50 });
        if (!active) return;
        setSelected(item);
        setReview(reviewData);
        setCorrection(reviewData?.correction?.content || '');
        setError('');
      } catch (error) { if (active) setError(getError(error)); }
      finally { if (active) setBusy(''); }
    };
    open();
    return () => { active = false; };
  }, [reviewDocument]);

  useEffect(() => {
    let active = true;
    let needsPolling = false;
    const load = async () => {
      try {
        const [list, health] = await Promise.all([
          knowledgeApi.items({source_type:sourceType,status,page_size:50}),
          knowledgeApi.processing(),
        ]);
        if (!active) return;
        const rows = Array.isArray(list?.items) ? list.items : [];
        needsPolling = rows.some((item) => ['pending','extracting','chunking','indexing'].includes(item.status));
        setItems(rows);
        setProcessing(health);
        setError('');
      } catch (failure) {
        if (active) setError(failure.status === 404
          ? 'Knowledge Explorer is not enabled on this backend yet.'
          : getError(failure));
      }
    };
    load();
    // Poll while source processing is in progress. The backend owns the actual status.
    const interval = setInterval(() => {
      if (active && needsPolling) load();
    }, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [sourceType,status,refreshVersion]);

  useEffect(() => {
    let active = true;
    const query = searchText.trim();
    // Don't leave results from a previous query visible while this one loads.
    setSearchResults(null);
    if (!query) return undefined;
    if (query.length > 200) return undefined;
    const timer = setTimeout(() => {
      knowledgeApi.search(query,20).then((result) => {
        if (active) setSearchResults(Array.isArray(result?.results) ? result.results : []);
      }).catch((failure) => {
        if (active) {
          setSearchResults(null);
          setError(getError(failure));
        }
      });
    },300);
    return () => { active = false; clearTimeout(timer); };
  }, [searchText]);

  const chooseItem = async (item) => {
    setBusy('detail'); setSelected(null); setReview(null); setConfirmedReview(false); setCorrection('');
    try {
      const detail = await knowledgeApi.item(item.id || item.item_id);
      setSelected(detail);
      if (['document','website'].includes(detail.source_type)) {
        const response = await knowledgeApi.review(detail.id || detail.item_id, {page:1,page_size:50});
        setReview(response);
        setCorrection(response?.correction?.content || '');
      }
    } catch (failure) { notify(getError(failure),'error'); }
    finally { setBusy(''); }
  };

  const mutate = async (operation) => {
    if (!selected || readOnly || busy) return;
    const itemId = selected.id || selected.item_id;
    const version = selected.source_version;
    if (!Number.isInteger(version)) { notify('Source version is missing; refresh item before saving.', 'error'); return; }
    const done = async (action) => {
      await action();
      notify('Knowledge updated. Refreshing current version…');
      setSelected(null); setReview(null); setConfirmedReview(false);
      setRefreshVersion((v) => v + 1);
      onKnowledgeChanged?.();
    };
    setBusy(operation);
    try {
      if (operation === 'correct') {
        if (!correction.trim() || correction.length > 50000) throw new Error('Replacement knowledge must be 1–50,000 characters.');
        if (!window.confirm('Replace ALL extracted information for this source with your corrected text?')) return;
        await done(() => knowledgeApi.correction(itemId,version,correction));
      } else if (operation === 'accept') {
        if (!review?.can_accept || !review?.extraction_hash || !confirmedReview) throw new Error('Review every page against the original and tick the acknowledgement first.');
        await done(() => knowledgeApi.accept(itemId,{expected_version:version,extraction_hash:review.extraction_hash,acknowledged:true}));
      } else if (operation === 'remove-correction') {
        if (!window.confirm('Remove your correction and restore the original extraction?')) return;
        await done(() => knowledgeApi.removeCorrection(itemId,version));
      } else if (operation === 'reindex') {
        await done(() => knowledgeApi.reindex(itemId,{expected_version:version,re_extract:false,remove_correction:false}));
      } else if (operation === 'reextract') {
        const removal = Boolean(review?.correction);
        if (!window.confirm(removal
          ? 'Re-extract source and REMOVE the existing owner correction? This cannot be undone.'
          : 'Re-extract the original source? This will reprocess the file/website.')) return;
        await done(() => knowledgeApi.reindex(itemId,{expected_version:version,re_extract:true,remove_correction:removal}));
      } else if (operation === 'reject') {
        if (!window.confirm('Stop the AI from using this knowledge version?')) return;
        await done(() => knowledgeApi.reject(itemId,version));
      } else if (operation === 'approve') {
        await done(() => knowledgeApi.approve(itemId,version));
      }
    } catch (failure) {
      notify(failure.code === 'KNOWLEDGE_409_VERSION' || failure.code === 'KNOWLEDGE_409_STALE_REVIEW'
        ? 'The source changed. Open it again before retrying.' : getError(failure),'error');
    } finally { setBusy(''); }
  };

  const displayed = searchResults || items;
  return (
    <div className="bb2-knowledge-explorer" id="bb2-brain-knowledge-explorer">
      {reviewDocument && <p className="bb2-brain-review-hint" role="status">
        Review knowledge source: <strong>{reviewDocument.title || 'Selected source'}</strong>. Inspect its extracted content and correct or approve the current version if needed.
      </p>}
      <div className="bb2-brain-explorer-controls">
        <label className="bb2-search"><Icon name="Search" size={16}/>
          <input aria-label="Search indexed knowledge" placeholder="Search titles and content…" value={searchText} maxLength={200} onChange={(e) => setSearchText(e.target.value)}/>
        </label>
        <select className="bb2-control" aria-label="Knowledge type" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
          <option value="">All types</option>{['faq','promotion','document','website','chat_training'].map((value) => <option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}
        </select>
        <select className="bb2-control" aria-label="Processing status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{['pending','extracting','chunking','indexing','ready','needs_review','failed'].map((value) => <option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}
        </select>
        <button type="button" className="bb2-soft-button" onClick={() => setRefreshVersion((v) => v+1)}>Refresh</button>
      </div>
      {error && <p className="bb2-error" role="alert">{error}</p>}
      {processing?.provider?.configured === false && <p className="bb2-phase1-notice">AI processing provider is not configured on the backend. New sources may stay pending.</p>}
      {processing?.counts && <p className="bb2-muted">Ready: {processing.counts.ready || 0} · Pending: {processing.counts.pending || 0} · Needs review: {processing.counts.needs_review || 0} · Failed: {processing.counts.failed || 0}</p>}
      <div className="bb2-brain-explorer-list">
        {displayed.map((item,index) => {
          const key = item.id || item.item_id || index;
          return <button key={key} type="button" className="bb2-brain-explorer-item" disabled={!!busy} onClick={() => chooseItem(item)}>
            <span><strong>{item.title || item.source_type || 'Knowledge source'}</strong><small>{item.source_type?.replaceAll('_',' ')} · {item.status_detail || item.status || 'Unknown'} · {item.approval_status || 'Review pending'}</small></span>
            {item.ai_ready === true ? <b className="bb2-ready">AI ready</b> : <b className="bb2-not-ready">Not AI ready</b>}
          </button>;
        })}
        {!displayed.length && !error && <p className="bb2-muted">No matching knowledge sources.</p>}
      </div>
      {selected && <section className="bb2-brain-advanced-card" aria-label="Knowledge source detail">
        <div className="bb2-brain-advanced-actions"><h3>{selected.title || 'Knowledge details'}</h3><button type="button" className="bb2-soft-button" onClick={() => {setSelected(null);setReview(null);}}>Close</button></div>
        <p className="bb2-muted">Version {selected.source_version ?? '—'} · {selected.status || 'Unknown'} · {selected.status_detail || 'No additional status'} · Approval: {selected.approval_status || 'Unknown'}</p>
        {selected.source_type === 'website' && <WebsiteCoverageDetails coverage={selected.coverage}/>}
        {selected.source_type !== 'website' && selected.coverage && <details><summary>Source coverage</summary><pre className="bb2-brain-json">{JSON.stringify(selected.coverage,null,2)}</pre></details>}
        {selected.chunks?.items?.length > 0 && <details open><summary>Indexed sections</summary>{selected.chunks.items.map((section,i) => <p key={section.id || i} className="bb2-brain-advanced-card">{section.content || section.text}</p>)}</details>}
        {review && <div className="bb2-brain-review">
          <h3>Review extracted text</h3>
          <p className="bb2-muted">Compare the original with the extracted content. An owner correction replaces the ENTIRE knowledge source, not just one line. Website sources cannot use document-only acceptance.</p>
          {review.source_type === 'document' && review.source_id && <button type="button" className="bb2-soft-button" onClick={() =>
            openPrivateDocument(
              () => knowledgeApi.downloadDocument(review.source_id),
              (failure) => notify(getError(failure), 'error')
            )
          }>Open original document</button>}
          {(review.pages?.items || []).map((page,i) => <details key={page.page || i} open={Boolean(page.uncertain)}>
            <summary>Page {page.page || i+1}: {page.title ? `${page.title} — ` : ''}{page.reason || (page.flags?.includes('conflict') ? 'Conflicting information' : page.uncertain ? 'Needs review' : 'Extracted')}</summary>
            {page.source_url && <SafeSource url={page.source_url}>Open source page</SafeSource>}
            {page.flags?.includes('conflict') && <p className="bb2-crawler-alert">This page contains conflicting values. Held lines below are NOT used by the AI.</p>}
            <ReviewPageBlocks blocks={page.blocks}/>
            <ReviewPageBlocks blocks={page.untrusted_blocks} held/>
          </details>)}
          {!readOnly && <>
            <label className="bb2-field">Corrected replacement text (entire source)
              <textarea className="bb2-control" rows={6} maxLength={50000} value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="Replace all extracted text with verified content…" />
            </label>
            <label className="bb2-checkbox"><input type="checkbox" checked={confirmedReview} onChange={(e) => setConfirmedReview(e.target.checked)}/> I compared the original source with every meaningful page shown above.</label>
          </>}
        </div>}
        {!readOnly && <div className="bb2-brain-advanced-actions">
          {review && <button type="button" className="bb2-main-button" disabled={!!busy || !correction.trim()} onClick={() => mutate('correct')}>Save correction</button>}
          {selected.source_type === 'document' && review?.can_accept && <button type="button" className="bb2-soft-button" disabled={!!busy || !confirmedReview} onClick={() => mutate('accept')}>Accept verified extraction</button>}
          {review?.correction && <button type="button" className="bb2-soft-button" disabled={!!busy} onClick={() => mutate('remove-correction')}>Remove correction</button>}
          <button type="button" className="bb2-soft-button" disabled={!!busy} onClick={() => mutate('reindex')}>Re-index</button>
          {review && <button type="button" className="bb2-soft-button" disabled={!!busy} onClick={() => mutate('reextract')}>Re-extract original</button>}
          <button type="button" className="bb2-soft-button" disabled={!!busy} onClick={() => mutate('reject')}>Reject version</button>
          <button type="button" className="bb2-main-button" disabled={!!busy} onClick={() => mutate('approve')}>Approve version</button>
        </div>}
      </section>}
    </div>
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
  const [workspaceRole, setWorkspaceRole] = useState(null);
  const role = String(workspaceRole || user?.workspace_role || user?.current_workspace?.role || user?.role || user?.workspaces?.[0]?.role || '').toLowerCase();
  const readOnly = role === 'agent';
  useEffect(() => {
    let active = true;
    getCurrentWorkspace().then((data) => {
      if (active) setWorkspaceRole(data?.my_role || data?.role || null);
    }).catch(() => {});
    return () => { active = false; };
  }, []);


  const [overview, setOverview] = useState(null);
  const [overviewSource, setOverviewSource] = useState('knowledge');
  const [behaviourVersion, setBehaviourVersion] = useState(0);
  const [behaviourAvailable, setBehaviourAvailable] = useState(false);
  const [assistantSessionId, setAssistantSessionId] = useState('');
  const [assistantProposals, setAssistantProposals] = useState([]);
  const [assistantSessions, setAssistantSessions] = useState([]);
  const [testSessions, setTestSessions] = useState([]);
  const [proposalBusy, setProposalBusy] = useState('');
  const [testSessionId, setTestSessionId] = useState('');
  const [testSessionStatus, setTestSessionStatus] = useState('active');
  const [testSessionMine, setTestSessionMine] = useState(true);
  const [assistantSessionStatus, setAssistantSessionStatus] = useState('active');
  const [testExplanations, setTestExplanations] = useState({});
  const [assistantProgress, setAssistantProgress] = useState('');
  const [testProgress, setTestProgress] = useState('');
  const [selectedProposalIds, setSelectedProposalIds] = useState([]);
  const [sessionAction, setSessionAction] = useState('');
  const assistantPending = useRef(null);
  const testPending = useRef(null);
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
  const [websiteRefreshVersion, setWebsiteRefreshVersion] = useState(0);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [entries, setEntries] = useState([]);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState('');

  const [modal, setModal] = useState('');
  const [staffForm, setStaffForm] = useState(initialStaff);

  const [locationForm, setLocationForm] = useState(initialLocation);
  const [locationCustomHours, setLocationCustomHours] = useState(() => normaliseHours([]));


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
  const documentInputRef = useRef(null);
  const documentsProcessingRef = useRef(false);
  const documentRowsRef = useRef([]);
  const documentsFollowupPollsRef = useRef(0);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [reviewDocumentTarget, setReviewDocumentTarget] = useState(null);
  const [documentEditingId, setDocumentEditingId] = useState(null);
  const [documentEditForm, setDocumentEditForm] = useState({ title: '', description: '', allow_whatsapp_share: false });

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

  const applyDocuments = useCallback((response) => {
    const rows = records(response, 'documents');
    documentsProcessingRef.current = rows.some(isDocumentProcessing);
    documentRowsRef.current = rows;
    setDocuments(rows);
    return rows;
  }, []);

  const fetchDocuments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setDocumentsLoading(true);
    try {
      const response = await knowledgeApi.list('Documents');
      applyDocuments(response);
      setErrors((old) => ({ ...old, documents: '' }));
      return response;
    } catch (error) {
      setErrors((old) => ({ ...old, documents: getError(error) }));
      throw error;
    } finally {
      if (!silent) setDocumentsLoading(false);
    }
  }, [applyDocuments]);

  // Knowledge documents are processed asynchronously. Poll only while the
  // documents tab is visible AND a document is still processing. A status such
  // as needs_review is terminal until the owner acts, so don't poll forever.
  useEffect(() => {
    if (tab !== 'knowledge' || knowledgeSection !== 'Documents' || notApplicable.Documents) {
      return undefined;
    }
    let active = true;
    let inFlight = false;
    const load = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const pending = documentRowsRef.current.filter(isDocumentProcessing);
        if (pending.length) {
          // New Phase 7 endpoint: poll only pending document IDs, not the entire list.
          const changes = await Promise.all(pending.map((row) =>
            knowledgeApi.getDocument(row.id || row.document_id)
          ));
          if (!active) return;
          const indexed = new Map(changes.map((row) => [row.id || row.document_id, row]));
          const nextRows = documentRowsRef.current.map((row) => indexed.get(row.id || row.document_id) || row);
          documentRowsRef.current = nextRows;
          documentsProcessingRef.current = nextRows.some(isDocumentProcessing);
          setDocuments(nextRows);
          setErrors((old) => ({ ...old, documents: '' }));
        } else {
          await fetchDocuments({ silent: true });
        }
      } catch {
        // If the new detail route is not deployed yet, the existing list
        // endpoint is still a safe fallback. Keep the visible error if both fail.
        try { await fetchDocuments({ silent: true }); }
        catch { /* Existing list error is displayed in the library. */ }
      } finally { inFlight = false; }
    };
    load();
    const interval = setInterval(() => {
      // A newly uploaded record may take a few moments to appear in a list.
      // Keep a short follow-up window even if the immediate GET is empty.
      const followup = documentsFollowupPollsRef.current > 0;
      if (followup) documentsFollowupPollsRef.current -= 1;
      if (documentsProcessingRef.current || followup) load();
    }, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [tab, knowledgeSection, notApplicable.Documents, fetchDocuments]);

  useEffect(() => {
    if (tab !== 'what-ai-knows' || readOnly) return undefined;
    let active = true;
    Promise.all([brainAssistantApi.sessions(),brainAssistantApi.proposals({status:'pending'})])
      .then(([sessions,proposals]) => {
        if (!active) return;
        const recent = sessions?.items || sessions?.sessions || [];
        setAssistantSessions(Array.isArray(recent) ? recent : []);
        const pending = proposals?.items || proposals?.proposals || [];
        setAssistantProposals((current) => {
          const map = new Map(current.map((item) => [item.id,item]));
          (Array.isArray(pending) ? pending : []).forEach((item) => map.set(item.id,item));
          return Array.from(map.values());
        });
      }).catch(() => {});
    return () => {active = false;};
  },[tab,readOnly]);

  useEffect(() => {
    if (tab !== 'test-ai') return undefined;
    let active = true;
    testAiApi.sessions().then((value) => {
      if (!active) return;
      const sessions = value?.items || value?.sessions || [];
      setTestSessions(Array.isArray(sessions) ? sessions : []);
    }).catch(() => {});
    return () => {active = false;};
  },[tab]);

  const resumeTestSession = async (sessionId) => {
    if (testSending) return;
    try {
      const response = await testAiApi.getSession(sessionId);
      const list = response?.messages?.items || response?.messages || [];
      setTestSessionId(sessionId);
      setTestSessionStatus(response?.status || 'active');
      setTestSessionMine(response?.is_mine !== false);
      setTestMessages((Array.isArray(list) ? list : []).map((item) => ({
        role:item.role === 'customer' || item.role === 'user' ? 'user' : 'assistant',
        text:item.content || item.text || '',id:item.id,answer_status:item.answer_status,
        request_preview: item.request_preview || item.reply?.request_preview || null,
      })));
      setTestExplanations({});
    } catch (failure) {showNotice(getError(failure),'error');}
  };

  const resumeAssistantSession = async (sessionId) => {
    if (assistantSending || readOnly) return;
    try {
      const response = await brainAssistantApi.getSession(sessionId);
      const list = response?.messages?.items || response?.messages || [];
      setAssistantSessionId(sessionId);
      setAssistantSessionStatus(response?.status || 'active');
      setAssistantMessages((Array.isArray(list) ? list : []).map((item) => ({
        role:item.role === 'customer' || item.role === 'user' ? 'user' : 'assistant',
        text:item.content || item.text || '',id:item.id,
      })));
      const sessionProposals = response?.proposals?.items || response?.proposals || [];
      if (Array.isArray(sessionProposals)) {
        setAssistantProposals((current) => {
          const merged = new Map(current.map((item) => [item.id, item]));
          sessionProposals.forEach((item) => merged.set(item.id, item));
          return Array.from(merged.values());
        });
      }
    } catch (failure) {showNotice(getError(failure),'error');}
  };


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
    // An unavailable Knowledge overview should not hide the separate advanced
    // AI Brain overview (and vice versa). Keep document totals distinct from
    // the count of files that may be SENT to WhatsApp customers.
    const [knowledgeResult, advancedResult] = await Promise.allSettled([
      knowledgeApi.overview(),
      brainOverviewApi.request(),
    ]);
    const summary = knowledgeResult.status === 'fulfilled' ? knowledgeResult.value : null;
    const advanced = advancedResult.status === 'fulfilled' ? advancedResult.value : null;

    if (summary) {
      setNotApplicable({
        FAQs: summary?.faqs?.is_applicable === false,
        Promotions: summary?.promotions?.is_applicable === false,
        Documents: summary?.documents?.is_applicable === false,
        Website: summary?.website?.is_applicable === false,
        'Chat Training': summary?.chat_training?.is_applicable === false,
      });
    }
    const fallback = {
      faqs_count: summary?.faqs?.count ?? null,
      promotions_count: summary?.promotions?.count ?? null,
      documents_count: summary?.documents?.count ?? null,
      website_count: !summary?.website ? null : summary.website.status === 'not_connected' ? 0 : 1,
      website_connected: Boolean(summary?.website?.url) ||
        (Boolean(summary?.website?.status) && summary.website.status !== 'not_connected'),
      chat_training_count: summary?.chat_training?.count ?? null,
    };
    if (advanced) {
      setOverviewSource('advanced');
      setOverview({
        ...fallback, ...advanced,
        business_description: advanced?.always_knows?.business_profile?.summary ?? '',
        services_count: advanced?.always_knows?.services?.count ?? null,
        products_count: advanced?.always_knows?.products?.count ?? null,
        // NEVER replace total uploaded documents with shareable documents.
        documents_count: fallback.documents_count,
        shareable_documents_count: advanced?.always_knows?.documents_it_can_send?.count ?? null,
        hours_configured: advanced?.always_knows?.opening_hours?.status === 'configured',
        ai_behaviour_summary: advanced?.always_knows?.personality_and_instructions?.agent_name || '',
        ai_behaviour_configured: advanced?.always_knows?.personality_and_instructions?.status === 'configured',
      });
    } else {
      setOverviewSource('knowledge');
      setOverview(summary ? fallback : null);
    }
    const errors = [
      knowledgeResult.status === 'rejected' ? knowledgeResult.reason : null,
      advancedResult.status === 'rejected' && advancedResult.reason?.status !== 404
        ? advancedResult.reason : null,
    ].filter(Boolean);
    if (errors.length) setOverviewError(errors.map(getError).join(' · '));
    setOverviewLoading(false);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab !== 'setup') return undefined;
    let active = true;
    brainConfigApi.get().then((value) => {
      if (!active) return;
      setBehaviourAvailable(true);
      setBehaviourVersion(value?.version ?? 0);
      setSetup((current) => ({
        ...current,
        agent_name: value?.agent_name ?? '',
        agent_gender: ({not_set:'Not set',female:'Female',male:'Male',neutral:'Neutral'})[value?.gender] || 'Not set',
        reply_language: ({automatic:'Automatic',en:'English',ur:'Urdu','ur-Latn':'Roman Urdu',customer_language:'Customer language'})[value?.reply_language] || 'Automatic',
        tone: value?.tone ? value.tone[0].toUpperCase() + value.tone.slice(1) : 'Friendly',
        reply_length: value?.reply_length ? value.reply_length[0].toUpperCase() + value.reply_length.slice(1) : 'Medium',
        custom_instructions: value?.custom_instructions || '',
        goodbye_message: value?.goodbye_message || '',
      }));
      setErrors((prev) => ({ ...prev, behaviour: '' }));
    }).catch((error) => {
      if (!active) return;
      setBehaviourAvailable(false);
      setErrors((prev) => ({...prev, behaviour: error.status === 404 ? 'AI Behaviour endpoint is not enabled on the backend yet.' : getError(error)}));
    });
    return () => { active = false; };
  }, [tab]);

  const saveBehaviour = async (event) => {
    event.preventDefault();
    if (readOnly || !behaviourAvailable || saving) return;
    const body = {
      agent_name: setup.agent_name.trim(),
      gender: ({'Not set':'not_set', Female:'female', Male:'male', Neutral:'neutral'})[setup.agent_gender] || 'not_set',
      reply_language: ({Automatic:'automatic', English:'en', Urdu:'ur', 'Roman Urdu':'ur-Latn', 'Customer language':'customer_language'})[setup.reply_language] || 'automatic',
      tone: setup.tone.toLowerCase(),
      reply_length: setup.reply_length.toLowerCase(),
      custom_instructions: setup.custom_instructions.trim() || null,
      goodbye_message: setup.goodbye_message.trim() || null,
    };
    if (!body.agent_name || body.agent_name.length > 60 || (body.custom_instructions?.length || 0) > 4000 || (body.goodbye_message?.length || 0) > 500) {
      showNotice('Check agent name (1–60), instructions (max 4,000), and goodbye message (max 500).', 'error');
      return;
    }
    setSaving('behaviour');
    try {
      const result = await brainConfigApi.update(body, behaviourVersion);
      setBehaviourVersion(result?.version ?? behaviourVersion + 1);
      showNotice('AI behaviour saved.');
      await loadOverview();
    } catch (error) {
      if (error.code === 'AI_CONFIG_409_STALE') {
        showNotice('Someone changed these settings. Reload the Setup tab before saving again.', 'error');
        setBehaviourAvailable(false);
      } else showNotice(getError(error), 'error');
    } finally { setSaving(''); }
  };


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

            // IMPORTANT: /setup and /ai-config load independently.
            // Merge ONLY business fields here; replacing the whole setup object
            // would reset the saved AI gender, language, tone and instructions.
            setSetup((current) => ({
              ...current,
              business_name: value.business_name ?? workspace?.name ?? '',
              industry: value.industry ?? '',
              business_description: value.business_description ?? '',
              whatsapp_number: value.business_phone ?? '',
              business_phone: value.business_phone ?? '',
              business_address: value.address ?? '',
              address: value.address ?? '',
              timezone: value.timezone ?? '',
            }));

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

  // Website crawl is asynchronous. Poll the existing GET website endpoint while
  // processing/retrying, and stop once the backend publishes a terminal state.
  // Snapshot only the response fields that matter for polling. Depending on the
  // entire websiteDetails object would restart the interval on every GET.
  const crawlerStatus = websiteDetails?.status;
  const crawlerStatusDetail = websiteDetails?.status_detail;
  const crawlerAiReady = websiteDetails?.ai_ready;
  const crawlerLastCrawledAt = websiteDetails?.last_crawled_at;
  const crawlerPagesCrawled = websiteDetails?.pages_crawled;
  const shouldPollWebsite = isWebsiteProcessing(websiteDetails);

  useEffect(() => {
    if (tab !== 'knowledge' || knowledgeSection !== 'Website' || !shouldPollWebsite || notApplicable.Website) return undefined;
    let alive = true;
    let inFlight = false;
    const timer = setInterval(async () => {
      if (!alive || inFlight) return;
      inFlight = true;
      try {
        const updated = await knowledgeApi.website();
        if (!alive) return;
        const changed = updated?.status !== crawlerStatus ||
          updated?.ai_ready !== crawlerAiReady ||
          updated?.last_crawled_at !== crawlerLastCrawledAt ||
          updated?.pages_crawled !== crawlerPagesCrawled ||
          updated?.status_detail !== crawlerStatusDetail;
        setWebsiteDetails(updated);
        if (changed) {
          setWebsiteRefreshVersion((current) => current + 1);
          loadOverview().catch(() => {});
          fetchDocuments({silent:true}).catch(() => {});
        }
      } catch (error) {
        if (alive) setErrors((current) => ({...current, entries: getError(error)}));
      } finally { inFlight = false; }
    }, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [tab, knowledgeSection, shouldPollWebsite, crawlerStatus, crawlerStatusDetail,
    crawlerAiReady, crawlerLastCrawledAt, crawlerPagesCrawled,
    notApplicable.Website, loadOverview, fetchDocuments]);

  const refreshKnowledgeList = async () => {
    if (knowledgeSection === 'Website') {
      const result = await knowledgeApi.website();
      setWebsiteDetails(result);
      setWebsiteRefreshVersion((current) => current + 1);
      setEditor((current) => ({ ...current, website_url: result?.url || '' }));
    } else if (knowledgeSection === 'Documents') {
      await fetchDocuments();
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
    } catch (error) { showNotice(getError(error), 'error'); }
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
      showNotice(getError(error), 'error');
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
    } catch (error) { showNotice(getError(error), 'error'); }
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
    } catch (error) { showNotice(getError(error), 'error'); }
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
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const disconnectWebsite = async () => {
    if (readOnly || !window.confirm('Disconnect this website? PDFs imported from this website will also be deleted, and the AI will stop using them.')) return;
    setSaving('website-delete');
    try {
      await knowledgeApi.removeWebsite();
      await refreshKnowledgeList();
      setEditor((current) => ({ ...current, website_url: '' }));
      setWebsiteRefreshVersion((current) => current + 1);
      try { await fetchDocuments({ silent: true }); } catch { /* existing Documents error UI handles this */ }
      showNotice('Website disconnected. Imported website PDFs were also removed.');
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const changePromotionStatus = async (item) => {
    if (readOnly) return;
    setSaving('promotion-toggle');
    try {
      await knowledgeApi.update('Promotions', item.id, { is_active: !item.is_active });
      await refreshKnowledgeList();
      showNotice('Promotion updated.');
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const sendAssistant = async (event) => {
    event.preventDefault();
    const typedText = assistantText.trim();
    const selectedFile = assistantFile;
    const message = typedText || (selectedFile
      ? 'Please review the attached file. Describe only what you can reliably read. If anything is unclear or unverified, ask me to clarify. Do not save any changes without my approval.'
      : '');
    if (!message || assistantSending || readOnly || sessionAction) return;
    if (assistantSessionStatus === 'closed') { showNotice('This assistant conversation is closed. Choose New conversation.', 'error'); return; }
    if (message.length > 4000) {
      showNotice('Brain Assistant messages must be 4000 characters or fewer.', 'error');
      return;
    }
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
        showNotice('Attach a PDF, PNG, JPG, JPEG or WebP file.', 'error');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        showNotice('The attachment must be 10 MB or smaller.', 'error');
        return;
      }
    }
    setAssistantSending(true);
    setAssistantProgress('Connecting to Brain Assistant…');
    setAssistantText('');
    appendChatCustomer(setAssistantMessages, message);
    try {
      let sessionId = assistantSessionId;
      if (!sessionId) {
        const created = await brainAssistantApi.createSession();
        sessionId = created?.id;
        if (!sessionId) throw new Error('Brain Assistant did not return a session ID.');
        setAssistantSessionId(sessionId);
        setAssistantSessionStatus('active');
        brainAssistantApi.sessions().then((result) =>
          setAssistantSessions(result?.items || result?.sessions || [])
        ).catch(() => {});
      }

      const previous = assistantPending.current?.text === message &&
        assistantPending.current?.sessionId === sessionId
        ? assistantPending.current : null;
      let attachmentIds = previous?.attachmentIds || [];
      if (assistantFile) {
        setAssistantProgress('Uploading attachment…');
        const uploaded = await brainAssistantApi.uploadAttachment(sessionId, assistantFile);
        if (!uploaded?.id) throw new Error('Attachment upload did not return an ID.');
        let attachment = uploaded;
        for (let attempt = 0; attempt < 20 && ['pending', 'extracting'].includes(attachment.status); attempt += 1) {
          setAssistantProgress('Reading attachment…');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attachment = await brainAssistantApi.attachment(sessionId, uploaded.id);
        }
        // Per backend guide §18D.5, BOTH ready and needs_review attachments
        // may be sent to the assistant. For needs_review, the assistant must
        // ask for clarification instead of treating unverified OCR as fact.
        if (!['ready', 'needs_review'].includes(attachment.status)) {
          throw new Error(attachment.status === 'failed'
            ? `Attachment processing failed${attachment.error_code ? ` (${attachment.error_code})` : ''}. Try a clearer file.`
            : `Attachment is ${attachment.status || 'still processing'}. Please retry after processing finishes.`);
        }
        if (attachment.status === 'needs_review') {
          showNotice(
            `Image needs review${attachment.error_code ? ` (${attachment.error_code})` : ''}. The assistant may ask you to clarify unclear content.`,
            'warning'
          );
        }
        attachmentIds = [...new Set([...attachmentIds, uploaded.id])].slice(0, 10);
        setAssistantFile(null);
      }
      const clientId = previous?.id || crypto.randomUUID();
      assistantPending.current = { text: message, id: clientId, sessionId, attachmentIds };

      let response;
      try {
        response = await brainAssistantApi.streamMessage(
          sessionId, clientId, message, attachmentIds,
          (eventName) => setAssistantProgress(STREAM_PROGRESS[eventName] || 'Preparing your answer…'),
        );
      } catch (streamError) {
        if (!shouldRetryAsJson(streamError)) throw streamError;
        setAssistantProgress('Resuming the saved answer…');
        response = await recoverChatResult(
          () => brainAssistantApi.message(sessionId, clientId, message, attachmentIds),
          setAssistantProgress,
        );
      }
      if (!response?.reply) {
        response = await recoverChatResult(
          () => brainAssistantApi.message(sessionId, clientId, message, attachmentIds),
          setAssistantProgress,
        );
      }
      if (!response?.reply?.content) {
        throw new Error('Answer still processing. Retry with the same message to safely resume.');
      }
      assistantPending.current = null;
      setAssistantMessages((rows) => [
        ...rows.filter((row) => row.role !== 'error'),
        { role: 'assistant', text: response.reply.content, id: response.reply.id },
      ]);
      if (Array.isArray(response.proposals)) {
        setAssistantProposals((current) => [
          ...current.filter((item) => !response.proposals.some((next) => next.id === item.id)),
          ...response.proposals,
        ]);
      }
      await loadOverview();
    } catch (error) {
      setAssistantText(message);
      setAssistantMessages((rows) => [...rows.filter((row) => row.role !== 'error'), { role: 'error', text: getError(error) }]);
      showNotice(getError(error), 'error');
    } finally {
      setAssistantProgress('');
      setAssistantSending(false);
    }
  };

  const resetAssistant = async () => {
    if (assistantSending) return;
    try {
      if (assistantSessionId) {
        const result = await brainAssistantApi.reset(assistantSessionId);
        setAssistantSessionId(result?.session?.id || '');
        setAssistantSessionStatus('active');
        brainAssistantApi.sessions().then((value) =>
          setAssistantSessions(value?.items || value?.sessions || [])
        ).catch(() => {});
      }
      assistantPending.current = null;
      setAssistantMessages([]);
      setAssistantProposals([]);
      setSelectedProposalIds([]);
      setAssistantText('');
      setAssistantFile(null);
      showNotice('Brain Assistant conversation reset. Applied changes were kept.');
    } catch (error) { showNotice(getError(error),'error'); }
  };

  // Synchronise the Services screen after a confirmed server-side apply.
  // The Services page listens while mounted and already fetches on route entry.
  const notifyAppliedChanges = (changedProposals = []) => {
    if (!changedProposals.length) return;
    // Some AI proposals can update hours/knowledge instead of services;
    // a re-fetch is harmless and prevents stale service data after any apply.
    window.dispatchEvent(new CustomEvent('bellbee:services-catalog-updated', {
      detail: { source: 'brain-assistant', proposalIds: changedProposals.map((p) => p.id) },
    }));
    // Do not block the immediate Apply UI state on the overview request.
    void loadOverview().catch((error) => {
      showNotice(`Change applied, but overview refresh failed: ${getError(error)}`, 'warning');
    });
  };

  const decideProposal = async (proposal, action) => {
    if (readOnly || proposalBusy) return;
    setProposalBusy(proposal.id);
    try {
      const latest = await brainAssistantApi.getProposal(proposal.id);
      if (latest?.stale) throw new Error('This proposal is stale. Reload and review current settings.');
      const result = action === 'approve'
        ? await brainAssistantApi.approve(proposal.id)
        : await brainAssistantApi.reject(proposal.id);
      // Responses may put the updated status on `proposal.status`.
      // Never show an applied service on the basis of a successful HTTP status alone.
      let finalStatus = result?.proposal?.status || result?.status;
      if (!finalStatus) {
        const verified = await brainAssistantApi.getProposal(proposal.id);
        finalStatus = verified?.proposal?.status || verified?.status;
      }
      setAssistantProposals((list) => list.map((item) => item.id === proposal.id
        ? { ...item, ...(result?.proposal || {}), status: finalStatus || item.status } : item));
      if (finalStatus === 'applied' || finalStatus === 'rejected') {
        setSelectedProposalIds((ids) => ids.filter((id) => id !== proposal.id));
        showNotice(finalStatus === 'applied'
          ? 'Change applied successfully. Your Services page will show the latest data.'
          : 'Proposal rejected.', 'success');
        if (finalStatus === 'applied') notifyAppliedChanges([proposal]);
      } else {
        showNotice(result?.message || `Proposal status: ${finalStatus || 'unknown'}. Verify before retrying.`, 'warning');
      }
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setProposalBusy(''); }
  };

  const sendTestMessage = async (message) => {
    if (testSending || sessionAction) return;
    if (testSessionStatus === 'closed' || !testSessionMine) {
      showNotice('This session is read-only. Select New test to send a message.', 'error');
      return;
    }
    setTestText('');
    appendChatCustomer(setTestMessages, message);
    setTestSending(true);
    setTestProgress('Connecting to the Test AI sandbox…');
    try {
      let sessionId = testSessionId;
      if (!sessionId) {
        const created = await testAiApi.createSession();
        sessionId = created?.id;
        if (!sessionId) throw new Error('Test AI did not return a session ID.');
        setTestSessionId(sessionId);
        setTestSessionStatus('active');
        setTestSessionMine(true);
        testAiApi.sessions().then((value) =>
          setTestSessions(value?.items || value?.sessions || [])
        ).catch(() => {});
      }
      const previous = testPending.current?.text === message &&
        testPending.current?.sessionId === sessionId
        ? testPending.current : null;
      const clientId = previous?.id || crypto.randomUUID();
      testPending.current = { text: message, id: clientId, sessionId };
      let response;
      try {
        response = await testAiApi.streamMessage(
          sessionId, clientId, message,
          (eventName) => setTestProgress(STREAM_PROGRESS[eventName] || 'Preparing your answer…'),
        );
      } catch (streamError) {
        if (!shouldRetryAsJson(streamError)) throw streamError;
        setTestProgress('Resuming the saved answer…');
        response = await recoverChatResult(
          () => testAiApi.message(sessionId, clientId, message),
          setTestProgress,
        );
      }
      if (!response?.reply) {
        response = await recoverChatResult(
          () => testAiApi.message(sessionId, clientId, message),
          setTestProgress,
        );
      }
      if (!response?.reply?.content) {
        throw new Error('Answer still processing. Retry the same message to safely resume.');
      }
      testPending.current = null;
      setTestMessages((rows) => [
        ...rows.filter((row) => row.role !== 'error'),
        {
          role: 'assistant', text: response.reply.content,
          id: response.reply.id, answer_status: response.reply.answer_status,
          request_preview: response.reply.request_preview || null,
        },
      ]);
    } catch (error) {
      setTestText(message);
      setTestMessages((rows) => [...rows.filter((row) => row.role !== 'error'), { role: 'error', text: getError(error) }]);
      showNotice(getError(error), 'error');
    } finally {
      setTestProgress('');
      setTestSending(false);
    }
  };

  const resetTest = async () => {
    if (testSending || !testSessionMine || testSessionStatus === 'closed') return;
    try {
      if (testSessionId) {
        const result = await testAiApi.reset(testSessionId);
        setTestSessionId(result?.session?.id || '');
        setTestSessionStatus('active');
        setTestSessionMine(true);
        testAiApi.sessions().then((value) =>
          setTestSessions(value?.items || value?.sessions || [])
        ).catch(() => {});
      }
      testPending.current = null;
      setTestMessages([]);
      setTestExplanations({});
      setTestText('');
      showNotice('Test session reset. No real booking or order was made.');
    } catch (error) { showNotice(getError(error), 'error'); }
  };

  const deleteTestSession = async () => {
    if (!testSessionId || testSending || sessionAction || readOnly) return;
    if (!window.confirm('Permanently delete this Test AI session and all its messages?')) return;
    setSessionAction('test-delete');
    try {
      await testAiApi.remove(testSessionId);
      setTestSessions((rows) => rows.filter((item) => item.id !== testSessionId));
      testPending.current = null;
      setTestSessionId('');
      setTestSessionStatus('active');
      setTestSessionMine(true);
      setTestMessages([]);
      setTestExplanations({});
      setTestText('');
      showNotice('Test AI session deleted.');
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSessionAction(''); }
  };

  const deleteAssistantSession = async () => {
    if (!assistantSessionId || assistantSending || sessionAction || readOnly) return;
    if (!window.confirm('Permanently delete this Brain Assistant conversation? Pending proposals will be cancelled; applied changes remain.')) return;
    setSessionAction('assistant-delete');
    try {
      await brainAssistantApi.remove(assistantSessionId);
      setAssistantSessions((rows) => rows.filter((item) => item.id !== assistantSessionId));
      assistantPending.current = null;
      setAssistantSessionId('');
      setAssistantSessionStatus('active');
      setAssistantMessages([]);
      setAssistantText('');
      setAssistantFile(null);
      setSelectedProposalIds([]);
      // Keep decisions from other sessions; drop proposals belonging to the deleted session.
      setAssistantProposals((rows) => rows.filter((proposal) => proposal.session_id !== assistantSessionId));
      showNotice('Brain Assistant conversation deleted. Applied changes remain.');
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSessionAction(''); }
  };

  const toggleProposalSelection = (id, selected) => {
    setSelectedProposalIds((current) => selected
      ? [...new Set([...current, id])]
      : current.filter((value) => value !== id));
  };

  const approveSelectedProposals = async () => {
    if (readOnly || proposalBusy || sessionAction) return;
    const eligible = assistantProposals.filter((item) =>
      item.status === 'pending' && selectedProposalIds.includes(item.id));
    if (!eligible.length) return;
    if (!window.confirm(`Approve ${eligible.length} selected AI proposals? Changes will be saved to your actual business settings.`)) return;
    setProposalBusy('batch');
    const appliedIds = new Set();
    const unappliedIds = new Set();
    try {
      const proposalIds = eligible.map((item) => item.id);
      for (let offset = 0; offset < proposalIds.length; offset += 30) {
        const ids = proposalIds.slice(offset, offset + 30);
        const response = await brainAssistantApi.approveMany(ids);
        const outcomes = Array.isArray(response?.outcomes) ? response.outcomes : [];
        const resultById = new Map(outcomes.map((item) => [item.proposal_id || item.id, item]));
        // If the batch API did not enumerate all outcomes, ask the existing
        // proposal GET endpoint; do not guess that unreported items applied.
        const missing = ids.filter((id) => !resultById.has(id));
        if (missing.length) {
          const verified = await Promise.allSettled(missing.map((id) => brainAssistantApi.getProposal(id)));
          verified.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const item = result.value?.proposal || result.value;
              resultById.set(missing[index], { ...item, proposal: item, proposal_id: missing[index] });
            }
          });
        }
        setAssistantProposals((current) => current.map((item) => {
          const outcome = resultById.get(item.id);
          if (!outcome) return item;
          const finalStatus = outcome.proposal?.status || outcome.status || item.status;
          return {
            ...item,
            ...(outcome.proposal || {}),
            status: finalStatus,
            error_code: outcome.error_code ?? item.error_code,
          };
        }));
        ids.forEach((id) => {
          const result = resultById.get(id);
          const finalStatus = result?.proposal?.status || result?.status;
          if (finalStatus === 'applied') appliedIds.add(id);
          else unappliedIds.add(id);
        });
        setSelectedProposalIds((current) => current.filter((id) => !appliedIds.has(id)));
        // Update the frontend immediately after each successful batch, without
        // waiting for unrelated overview/service GET calls to finish.
        const justApplied = eligible.filter((item) => ids.includes(item.id) && appliedIds.has(item.id));
        if (justApplied.length) notifyAppliedChanges(justApplied);
      }
      showNotice(`${appliedIds.size} proposals applied. ${unappliedIds.size} not confirmed as applied${unappliedIds.size ? ' — review their status' : ''}.`, unappliedIds.size ? 'warning' : 'success');
    } catch (error) {
      showNotice(`${appliedIds.size ? `${appliedIds.size} proposals applied before the error. ` : ''}${getError(error)}`, 'error');
    } finally { setProposalBusy(''); }
  };

  const explainTestReply = async (message) => {
    if (!testSessionId || !message.id || readOnly) return;
    try {
      const explanation = await testAiApi.explain(testSessionId,message.id);
      setTestExplanations((current) => ({...current,[message.id]:explanation}));
    } catch (error) { showNotice(getError(error),'error'); }
  };

  const submitTest = (event) => {
    event.preventDefault();
    const message = testText.trim();
    if (!message || testSending || message.length > 2000) return;
    if (freePlanStatusApi.isConfigured()) {
      if (checkingPlan || !isStatusKnown) {
        showNotice('Free Plan status could not be verified.', 'error');
        return;
      }
      if (!isStarted) { openFreePlan(() => sendTestMessage(message)); return; }
    }
    sendTestMessage(message);
  };

  const checkKnowledge = async (event) => {
    event.preventDefault();
    const question = lookup.question.trim();
    if (!question || saving === 'lookup') return;
    if (question.length > 500) { showNotice('Question must be 500 characters or fewer.', 'error'); return; }
    setSaving('lookup');
    try {
      const result = await knowledgeApi.testRetrieval(question);
      const matches = result?.results || [];
      const display = matches.length
        ? matches.map((item, index) => `${index+1}. ${item.title || item.source_type}\n${item.content || ''}`).join('\n\n')
        : 'No relevant knowledge found for this question.';
      setLookup((current) => ({...current,result:display}));
      if (result?.degraded) showNotice(`Keyword-only search: ${result?.degraded_reason || 'semantic search unavailable'}`, 'info');
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const submitKnowledge = async (event) => {
    event.preventDefault();
    if (readOnly) { showNotice('Agent role has read-only access.'); return; }
    setSaving('knowledge');
    try {
      if (knowledgeSection === 'Website') {
        await knowledgeApi.saveWebsite(editor.website_url.trim());
        showNotice('Website submitted. Crawling/processing status will update in Knowledge Explorer.');
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
    } catch (error) { showNotice(getError(error), 'error'); }
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
      documentsFollowupPollsRef.current = 12;
      setDocumentFile(null);
      if (documentInputRef.current) documentInputRef.current.value = '';
      setEditor((current) => ({ ...current, document_title: '', document_description: '', share_on_whatsapp: false }));
      showNotice('Document uploaded. Backend extraction/indexing is now processing it.');
      // Refresh errors must not be mistaken for a failed upload.
      try { await refreshKnowledgeList(); }
      catch (error) { showNotice(`Upload succeeded, but refreshing the list failed: ${getError(error)}`, 'warning'); }
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const downloadDocument = (documentId) => {
    // Obtain a new short-lived signed link for every download.
    openPrivateDocument(
      () => knowledgeApi.downloadDocument(documentId),
      (error) => showNotice(getError(error), 'error')
    );
  };

  const reviewDocumentInExplorer = (item) => {
    setReviewDocumentTarget({
      id: item.id || item.document_id,
      knowledge_item_id: item.knowledge_item_id,
      source_type: 'document',
      title: item.title || item.file_name || 'Document',
    });
    changeTab('what-ai-knows', 'bb2-brain-knowledge-explorer');
  };

  const saveDocumentDetails = async (event) => {
    event.preventDefault();
    if (!documentEditingId || readOnly) return;
    if (!documentEditForm.title.trim()) {
      showNotice('A document title is required.', 'error');
      return;
    }
    setSaving('document-details');
    try {
      await knowledgeApi.update('Documents', documentEditingId, {
        title: documentEditForm.title.trim(),
        description: documentEditForm.description.trim() || null,
        allow_whatsapp_share: documentEditForm.allow_whatsapp_share,
      });
      setDocumentEditingId(null);
      showNotice('Document details saved.');
      try { await refreshKnowledgeList(); }
      catch (error) { showNotice(`Saved, but list refresh failed: ${getError(error)}`, 'warning'); }
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };
  const beginDocumentEdit = (item) => {
    setDocumentEditingId(item.id || item.document_id);
    setDocumentEditForm({
      title: item.title || '',
      description: item.description || '',
      allow_whatsapp_share: Boolean(item.allow_whatsapp_share),
    });
  };

  const deleteDocument = async (item) => {
    if (readOnly || !window.confirm(item.source_url
      ? `Delete ${item.title || item.file_name}? This PDF came from your website. The AI will stop using it and it will not be imported again automatically.`
      : `Delete ${item.title || item.file_name}?`)) return;
    setSaving('delete-document');
    try {
      await knowledgeApi.remove('Documents', item.id || item.document_id);
      showNotice('Document deleted.');
      try { await refreshKnowledgeList(); }
      catch (error) { showNotice(`Deleted, but list refresh failed: ${getError(error)}`, 'warning'); }
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const updateDocumentSharing = async (item, allowed) => {
    if (readOnly) return;
    setSaving(`document-${item.id || item.document_id}`);
    try {
      await knowledgeApi.update('Documents', item.id || item.document_id, { allow_whatsapp_share: allowed });
      showNotice('File-sharing preference updated.');
      try { await refreshKnowledgeList(); }
      catch (error) { showNotice(`Saved, but list refresh failed: ${getError(error)}`, 'warning'); }
    } catch (error) { showNotice(getError(error), 'error'); }
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
    const specified = item.target_tab;
    if (specified === 'hours') { changeTab('hours-staff'); return; }
    if (specified === 'ai_behaviour') { changeTab('setup','ai-behaviour'); return; }
    if (specified === 'knowledge') {
      if (String(item.key || '').startsWith('website_')) setKnowledgeSection('Website');
      changeTab('knowledge'); return;
    }
    if (specified === 'setup') { changeTab('setup'); return; }
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

  const fixWithAssistant = (item) => {
    if (readOnly || !item?.assistant_prompt) return;
    // The server chooses the safe, relevant correction. The owner must review
    // and click Send; never auto-send or auto-approve a proposal.
    setAssistantText(item.assistant_prompt);
    window.requestAnimationFrame(() => {
      document.getElementById('bb2-brain-assistant-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
      document.querySelector('#bb2-brain-assistant-panel .bb2-chat-compose input')?.focus({preventScroll:true});
    });
  };

  const reviewWebsiteInExplorer = (item) => {
    setReviewDocumentTarget({
      knowledge_item_id: item.id || item.item_id,
      source_type: 'website',
      title: item.title || 'Business website',
    });
    changeTab('what-ai-knows', 'bb2-brain-knowledge-explorer');
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
      detail: 'Total uploaded documents; only approved, AI-ready versions can answer customer questions.',
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
    } catch (error) { showNotice(getError(error), 'error'); }
    finally { setSaving(''); }
  };

  const saveModal = async (event) => {
    event.preventDefault();
    if (readOnly) { showNotice('Agent role has read-only access.'); return; }
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
    } catch (error) { showNotice(getError(error), 'error'); }
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
            {overviewSource !== 'advanced' && <p className="bb2-phase1-notice">Detailed What AI Knows overview is not available; showing available knowledge counts.</p>}
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

                    {!readOnly && typeof item.assistant_prompt === 'string' && item.assistant_prompt.trim() &&
                      <button type="button" className="bb2-main-button"
                        onClick={() => fixWithAssistant(item)}>
                        <Icon name="Sparkles" size={14}/>
                        Fix with assistant
                      </button>}
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
                This information is read by your AI when the backend AI engine is enabled.
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
                Review indexed knowledge, processing status, and sources the AI may use.
              </p>

              <BrainKnowledgeExplorer
                readOnly={readOnly}
                notify={showNotice}
                reviewDocument={reviewDocumentTarget}
                onKnowledgeChanged={() => {
                  fetchDocuments({ silent: true }).catch(() => {});
                  loadOverview();
                }}
              />
            </section>

            <section className="bb2-section">
              <h2>Try a question</h2>
              <p className="bb2-muted">Shows relevant knowledge, not a generated answer.</p>

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
                  disabled={saving === 'lookup'}
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

          <div className="bb2-brain-phase1-panel" id="bb2-brain-assistant-panel">
            {readOnly && <p className="bb2-phase1-notice">Agents can read AI Brain but cannot use configuration assistant proposals.</p>}
            {assistantSessions.length > 0 && <label className="bb2-field">My assistant conversations
              <select className="bb2-control" value={assistantSessionId} onChange={(e) => { if (e.target.value) resumeAssistantSession(e.target.value); else {setAssistantSessionId(''); setAssistantSessionStatus('active'); setAssistantMessages([]);} }}>
                <option value="">New conversation</option>
                {assistantSessions.map((item) => <option key={item.id} value={item.id}>{item.title || `Conversation ${item.id.slice(0,8)}`}</option>)}
              </select>
            </label>}
          {assistantSessionId && !readOnly && (
            <div className="bb2-brain-session-toolbar">
              <button type="button" className="bb2-soft-button" onClick={deleteAssistantSession}
                disabled={assistantSending || Boolean(sessionAction)}>
                <Icon name="Trash2" size={15} /> {sessionAction === 'assistant-delete' ? 'Deleting…' : 'Delete conversation'}
              </button>
            </div>
          )}
          {assistantSessionId && assistantSessionStatus === 'closed' && (
            <p className="bb2-phase1-notice">This conversation is closed. Choose “New conversation” to continue.</p>
          )}
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
            progress={assistantProgress}
            text={assistantText}
            setText={setAssistantText}
            submit={sendAssistant}
            reset={resetAssistant}
            disabled={readOnly || assistantSessionStatus === 'closed'}
            tokenNotice={
              tokenBalance != null &&
              Number(tokenBalance) <= 0
                ? 'You are out of AI tokens, so the assistant cannot reply.'
                : ''
            }
            attachment={assistantFile}
            onAttachment={setAssistantFile}
          />
          {assistantProposals.length > 0 && (
            <section className="bb2-brain-advanced-proposals">
              {assistantProposals.some((proposal) => proposal.status === 'pending') && <>
                <h3>Pending proposals — review before applying</h3>
                <p className="bb2-muted">Changes appear in your business settings only after the backend confirms they are applied.</p>
                {!readOnly && (
                  <div className="bb2-brain-batch-toolbar">
                    <label className="bb2-brain-select-label">
                      <input type="checkbox"
                        checked={assistantProposals.filter((item) => item.status === 'pending').every((item) => selectedProposalIds.includes(item.id))}
                        onChange={(event) => setSelectedProposalIds(event.target.checked
                          ? assistantProposals.filter((item) => item.status === 'pending').map((item) => item.id)
                          : [])}
                        disabled={Boolean(proposalBusy)} />
                      Select all pending
                    </label>
                    <button type="button" className="bb2-main-button"
                      disabled={Boolean(proposalBusy) || !assistantProposals.some((item) => item.status === 'pending' && selectedProposalIds.includes(item.id))}
                      onClick={approveSelectedProposals}>
                      <Icon name="CheckCheck" size={16} />
                      {proposalBusy === 'batch' ? 'Approving…' : `Approve selected (${assistantProposals.filter((item) => item.status === 'pending' && selectedProposalIds.includes(item.id)).length})`}
                    </button>
                  </div>
                )}
                {assistantProposals.filter((proposal) => proposal.status === 'pending').map((proposal) => (
                  <article key={proposal.id} className="bb2-brain-advanced-card">
                    {!readOnly && (
                      <label className="bb2-brain-select-label">
                        <input type="checkbox" checked={selectedProposalIds.includes(proposal.id)}
                          disabled={Boolean(proposalBusy)}
                          onChange={(event) => toggleProposalSelection(proposal.id, event.target.checked)} />
                        Select this proposal
                      </label>
                    )}
                    <strong>{proposal.summary || proposal.action}</strong>
                    <span className="bb2-muted">Pending approval</span>
                    <div className="bb2-brain-proposal-preview">
                      <div><small>Previous value</small><pre>{JSON.stringify(proposal.previous_value, null, 2)}</pre></div>
                      <div><small>Proposed value</small><pre>{JSON.stringify(proposal.proposed_value, null, 2)}</pre></div>
                    </div>
                    {!readOnly && (
                      <div className="bb2-brain-advanced-actions">
                        <button className="bb2-main-button" type="button" disabled={!!proposalBusy} onClick={() => decideProposal(proposal, 'approve')}>Approve</button>
                        <button className="bb2-soft-button" type="button" disabled={!!proposalBusy} onClick={() => decideProposal(proposal, 'reject')}>Reject</button>
                      </div>
                    )}
                  </article>
                ))}
              </>}
              {assistantProposals.some((proposal) => proposal.status !== 'pending') && (
                <details className="bb2-brain-proposal-history">
                  <summary>Applied, rejected and other proposal statuses ({assistantProposals.filter((proposal) => proposal.status !== 'pending').length})</summary>
                  {assistantProposals.filter((proposal) => proposal.status !== 'pending').map((proposal) => (
                    <article key={proposal.id} className="bb2-brain-advanced-card">
                      <strong>{proposal.summary || proposal.action}</strong>
                      <span className="bb2-muted">{proposal.status || 'Unknown'}</span>
                      {proposal.status === 'applied' && /service/i.test([proposal.action, proposal.summary, proposal.resource_type, proposal.entity_type].filter(Boolean).join(' ')) && (
                        <button type="button" className="bb2-soft-button" onClick={() => navigate('/dashboard/services')}>
                          View Services <Icon name="ArrowUpRight" size={14} />
                        </button>
                      )}
                      {proposal.status !== 'applied' && proposal.error_code && <p className="bb2-error">{proposal.error_code}</p>}
                    </article>
                  ))}
                </details>
              )}
            </section>
          )}
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

          <section className="bb2-section bb2-divider-section" id="ai-behaviour">
            <h2>AI behaviour</h2>
            {errors.behaviour && <p className="bb2-error" role="status">{errors.behaviour}</p>}

            <p className="bb2-muted">
              Control how your AI agent communicates
              with customers.
            </p>

            <div className="bb2-form-with-help">
              <form
                className="bb2-form-grid"
                onSubmit={saveBehaviour}
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
                  disabled={readOnly || !behaviourAvailable || saving === 'behaviour'}
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
                        showNotice(getError(error), 'error');
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
              Knowledge sources are processed by the backend. Only approved, AI-ready versions are usable.
            </p>

            <p className="bb2-muted">
              {knowledgeSection === 'FAQs'
                ? 'Manage FAQs. The backend indexes saved questions and answers for retrieval.'
                : knowledgeSection === 'Promotions'
                  ? 'Manage promotions. Only active, valid and AI-ready offers are available to the assistant.'
                  : knowledgeSection === 'Documents'
                    ? 'Upload private documents. A background worker extracts and indexes text; some files may need review.'
                    : knowledgeSection === 'Website'
                      ? 'Add a public website. Crawling and indexing run on the backend; review any uncertain pages.'
                      : 'Save chat training notes for search and retrieval after processing.'}
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
                  <div className="bb2-brain-doc-main">
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
                        ref={documentInputRef}
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

                    </form>
                    <section className="bb2-brain-document-library" aria-label="Uploaded documents">
                      <div className="bb2-brain-document-toolbar">
                        <strong>Uploaded documents</strong>
                        <button type="button" className="bb2-soft-button"
                          disabled={documentsLoading}
                          onClick={async () => {
                            try {
                              await fetchDocuments();
                              await loadOverview();
                            } catch (error) {
                              showNotice(getError(error), 'error');
                            }
                          }}>
                          <Icon name="RefreshCcw" size={15} />
                          {documentsLoading ? 'Refreshing…' : 'Refresh status'}
                        </button>
                      </div>
                      <small className="bb2-muted">Processing documents update automatically while this tab is open. Needs-review files require your action in What AI Knows.</small>
                      {errors.documents && <p className="bb2-error" role="alert">{errors.documents}</p>}
                      {documents.length === 0 && !documentsLoading && !errors.documents && (
                        <p className="bb2-muted">No documents uploaded yet.</p>
                      )}
                      {documents.map((item) => (
                        <div className="bb2-saved-row bb2-brain-document-row" key={item.id || item.document_id || item.title}>
                          <div className="bb2-brain-document-details">
                            <strong>{item.title || item.file_name}</strong>
                            <small>{item.file_name || ''} · {describeDocumentStatus(item)}</small>
                            {item.source_url && <div className="bb2-crawler-imported">
                              <span className="bb2-crawler-badge"><Icon name="Globe" size={12}/> From your website</span>
                              <SafeSource url={item.source_url}>View original PDF source</SafeSource>
                            </div>}
                            <label className="bb2-checkbox">
                              <input type="checkbox" disabled={readOnly || Boolean(saving)}
                                checked={Boolean(item.allow_whatsapp_share)}
                                onChange={(event) => updateDocumentSharing(item, event.target.checked)} />
                              Allow WhatsApp file sharing
                            </label>
                          </div>
                          <div className="bb2-brain-row-actions">
                            <button type="button" onClick={() => downloadDocument(item.id || item.document_id)}>Download</button>
                            {!item.ai_ready && (['needs_review', 'failed'].includes(item.status) || item.error_code) &&
                              <button type="button" onClick={() => reviewDocumentInExplorer(item)}>Review extraction</button>}
                            {!readOnly && <button type="button" disabled={Boolean(saving)} onClick={() => beginDocumentEdit(item)}>Edit</button>}
                            {!readOnly && <button type="button" disabled={Boolean(saving)} onClick={() => deleteDocument(item)}>Delete</button>}
                          </div>
                        </div>
                      ))}
                    </section>
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
                  </div>

                  <InfoCard title="Document processing">
                    Files become available to AI only after extraction, indexing and approval. Review items marked needs_review in What AI Knows.
                  </InfoCard>
                </div>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'Website' && (
                <>
                <div className="bb2-form-with-help">
                  <form
                    className="bb2-knowledge-form"
                    onSubmit={submitKnowledge}
                  >
                    <p className="bb2-muted">
                      The backend crawls and indexes the website after submission. Check the status before relying on it.
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

                  <div className="bb2-brain-website-details">
                    <div className="bb2-brain-website-status" role="status">
                      <div className="bb2-crawler-section-heading">
                        <strong>Website status: {websiteStatusText(websiteDetails)}</strong>
                        <button type="button" className="bb2-soft-button" disabled={saving === 'website-refresh'}
                          onClick={async () => {
                            setSaving('website-refresh');
                            try { await refreshKnowledgeList(); showNotice('Website status refreshed.'); }
                            catch (error) { showNotice(getError(error),'error'); }
                            finally { setSaving(''); }
                          }}><Icon name="RefreshCcw" size={15}/> Refresh status</button>
                      </div>
                      {isWebsiteProcessing(websiteDetails) && <span className="bb2-crawler-processing"><Icon name="LoaderCircle" size={16}/>{websiteDetails?.ai_ready ? 'Website refreshing — AI is still using the previous approved version. Checking every 5 seconds…' : 'Processing website; checking every 5 seconds…'}</span>}
                      {websiteDetails?.url && <small><SafeSource url={websiteDetails.url}>{websiteDetails.url}</SafeSource></small>}
                      {websiteDetails?.url && <div className="bb2-crawler-metrics">
                        <div className="bb2-crawler-stat"><strong>{websiteDetails.pages_crawled ?? 0}</strong><small>Pages crawled</small></div>
                        <div className="bb2-crawler-stat"><strong>{readableDate(websiteDetails.last_crawled_at)}</strong><small>Last crawled</small></div>
                      </div>}
                      {websiteDetails?.status_detail && websiteDetails?.status_detail !== websiteDetails?.status &&
                        <p className="bb2-muted">Status detail: {websiteDetails.status_detail.replaceAll('_',' ')}</p>}
                      {websiteDetails?.error_message && <p className="bb2-crawler-alert" role="alert">{websiteDetails.error_message}</p>}
                      {websiteDetails?.url && !readOnly && (
                        <button type="button" className="bb2-soft-button" disabled={Boolean(saving)} onClick={disconnectWebsite}>Disconnect website</button>
                      )}
                    </div>
                    <InfoCard title="Website processing">
                      The crawler reads up to 25 pages and may import linked PDFs to Documents. The AI uses only approved, AI-ready sources. Dashboard business settings take priority over website data.
                    </InfoCard>
                  </div>
                </div>
                <WebsiteCrawlerDetails website={websiteDetails} refreshVersion={websiteRefreshVersion}
                  notify={showNotice} onReview={reviewWebsiteInExplorer}/>
                </>
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

      {/* REQUEST TYPES — Phase 7 / 18E */}
      {tab === 'requests' && <RequestTypesPanel readOnly={readOnly} notify={showNotice} />}

      {/* TEST AI */}
      {tab === 'test-ai' && (
        <div className="bb2-test-area">
          <div className="bb2-test-head">
            <p>
              Chat with your business AI in a sandbox. Customer requests appear as previews only: no request is saved and no notification is sent.
            </p>

            <button
              type="button"
              className="bb2-soft-button"
              disabled={testSending || !testSessionMine || testSessionStatus === 'closed'}
              onClick={resetTest}
            >
              <Icon name="RotateCcw" size={15} />
              Reset
            </button>
          </div>

          {testSessions.length > 0 && <label className="bb2-field">Past test conversations
            <select className="bb2-control" value={testSessionId} onChange={(e) => { if (e.target.value) resumeTestSession(e.target.value); else {setTestSessionId(''); setTestSessionStatus('active'); setTestSessionMine(true); setTestMessages([]);} }}>
              <option value="">New test</option>
              {testSessions.map((item) => <option key={item.id} value={item.id}>{item.title || `Test ${item.id.slice(0,8)}`}</option>)}
            </select>
          </label>}
          {testSessionId && !readOnly && (
            <div className="bb2-brain-session-toolbar">
              <button type="button" className="bb2-soft-button" onClick={deleteTestSession}
                disabled={testSending || Boolean(sessionAction)}>
                <Icon name="Trash2" size={15} /> {sessionAction === 'test-delete' ? 'Deleting…' : 'Delete selected test session'}
              </button>
            </div>
          )}
          {testSessionId && (testSessionStatus === 'closed' || !testSessionMine) && (
            <p className="bb2-phase1-notice">This session is read-only. Choose “New test” to send messages. Owners/Admins can still review or delete it.</p>
          )}
          <ChatPanel
            emptyText="Say hello to start testing your AI."
            messages={testMessages}
            sending={testSending}
            progress={testProgress}
            text={testText}
            setText={setTestText}
            submit={submitTest}
            reset={resetTest}
            disabled={testSessionStatus === 'closed' || !testSessionMine}
          />

          {!isConfigured(testAiApi) && (
            <p className="bb2-error">
              Test AI endpoint is not configured.
            </p>
          )}
          {!readOnly && testMessages.filter((item) => item.role === 'assistant' && item.id).map((item) => (
            <div key={item.id} className="bb2-brain-advanced-card">
              <div className="bb2-brain-advanced-actions">
                <strong>Test AI response · {item.answer_status || 'answered'}</strong>
                <button type="button" className="bb2-soft-button" onClick={() => explainTestReply(item)}>Why this answer?</button>
              </div>
              {testExplanations[item.id] && <div className="bb2-brain-evidence">
                {(testExplanations[item.id].sources || []).map((source, i) => (
                  <p key={i}><strong>{source.label || source.evidence_id}</strong> — {source.excerpt_used || source.current_status || 'Source details unavailable'}</p>
                ))}
                {!testExplanations[item.id].sources?.length && <p>No cited sources returned for this answer.</p>}
              </div>}
            </div>
          ))}
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
                : 'Add location'
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
                disabled={readOnly || Boolean(saving)}
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
                : [
                    ['name', 'Location name'],
                    ['address', 'Address'],
                    ['phone', 'Phone'],
                    ['notes', 'Notes'],
                  ]
            ).map(([key, title]) => {
              const current =
                modal === 'staff'
                  ? staffForm
                  : locationForm;

              const setCurrent =
                modal === 'staff'
                  ? setStaffForm
                  : setLocationForm;

              return (
                <Field key={key} title={title}>
                  <input
                    className="bb2-control"
                    required={modal === 'staff' ? ['name', 'role'].includes(key) : ['name', 'address'].includes(key)}
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