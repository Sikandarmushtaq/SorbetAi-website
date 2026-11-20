
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

import { brainOverviewApi } from '../../../services/dashboard/brain-overview.api.js';
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
  start_time: '',
  end_time: '',
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
};

function isConfigured(api) {
  return typeof api?.isConfigured !== 'function'
    || api.isConfigured();
}

function getError(error) {
  return error?.message || 'The request could not be completed.';
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
        String(item.day || item.name).toLowerCase()
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

function SelectField({ value, onChange, choices }) {
  return (
    <select
      className="bb2-control"
      value={value ?? ''}
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
  const [documents, setDocuments] = useState([]);
  const [entries, setEntries] = useState([]);
  const [requests, setRequests] = useState([]);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState('');

  const [modal, setModal] = useState('');
  const [staffForm, setStaffForm] = useState(initialStaff);

  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    phone: '',
    notes: '',
  });

  const [requestForm, setRequestForm] =
    useState(initialRequest);

  const [dateForm, setDateForm] = useState({
    date: '',
    day_type: 'Closed all day',
    reason: '',
  });

  const [knowledgeSection, setKnowledgeSection] =
    useState('FAQs');

  const [notApplicable, setNotApplicable] =
    useState({});

  const [editor, setEditor] = useState(initialEditor);
  const [documentFile, setDocumentFile] = useState(null);

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
      if (!isConfigured(brainOverviewApi)) {
        throw new Error(
          'AI Brain overview API is not configured.'
        );
      }

      const result = await brainOverviewApi.request();

      setOverview(
        result?.overview || result || null
      );
    } catch (error) {
      setOverviewError(getError(error));
    } finally {
      setOverviewLoading(false);
    }
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

    async function loadResource(api, key, update) {
      if (!isConfigured(api)) {
        setError(key, 'API is not configured.');
        return;
      }

      try {
        const response = await api.request();

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
              business_name:
                value.business_name ||
                workspace?.name ||
                '',
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
        businessHoursApi,
        'hours',
        (response) =>
          setHours(normaliseHours(response))
      );

      loadResource(
        bookingRulesApi,
        'rules',
        (response) =>
          setRules({
            ...initialRules,
            ...(response?.rules || response),
          })
      );

      loadResource(
        closedDatesApi,
        'dates',
        (response) =>
          setClosedDates(records(response, 'dates'))
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
      loadResource(
        knowledgeApi,
        'documents',
        (response) =>
          setDocuments(records(response, 'documents'))
      );
    }

    if (tab === 'requests') {
      loadResource(
        requestTypesApi,
        'requests',
        (response) =>
          setRequests(records(response, 'request_types'))
      );
    }

    return () => {
      active = false;
    };
  }, [tab]);

  // Load the selected Knowledge subsection.
  useEffect(() => {
    if (
      tab !== 'knowledge' ||
      knowledgeSection === 'Documents' ||
      !isConfigured(knowledgeApi)
    ) {
      return undefined;
    }

    let active = true;

    const type =
      knowledgeSection === 'FAQs'
        ? 'faq'
        : knowledgeSection
            .toLowerCase()
            .replace(/\s/g, '_');

    knowledgeApi
      .request({ query: { type } })
      .then((response) => {
        if (!active) return;

        const results = records(response, 'entries');

        setEntries(
          results.filter(
            (item) =>
              !item.type ||
              String(item.type).toLowerCase() === type
          )
        );

        setErrors((current) => ({
          ...current,
          entries: '',
        }));
      })
      .catch((error) => {
        if (active) {
          setErrors((current) => ({
            ...current,
            entries: getError(error),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [tab, knowledgeSection]);

  // Save through existing backend resource APIs.
  const saveResource = async (
    key,
    api,
    method,
    body,
    onSuccess
  ) => {
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

  const checkKnowledge = async (event) => {
    event.preventDefault();

    if (!lookup.question.trim()) return;

    if (!isConfigured(knowledgeApi)) {
      showNotice('Knowledge API is not configured.');
      return;
    }

    setSaving('lookup');

    try {
      const response = await knowledgeApi.request({
        method: 'POST',
        action: 'search',
        body: {
          query: lookup.question.trim(),
        },
      });

      setLookup((current) => ({
        ...current,
        result:
          response?.answer ||
          response?.result ||
          response?.message ||
          'No matching knowledge found.',
      }));
    } catch (error) {
      setLookup((current) => ({
        ...current,
        result: getError(error),
      }));
    } finally {
      setSaving('');
    }
  };

  const submitKnowledge = (event) => {
    event.preventDefault();

    const type =
      knowledgeSection === 'FAQs'
        ? 'faq'
        : knowledgeSection
            .toLowerCase()
            .replace(/\s/g, '_');

    let body;

    if (type === 'faq') {
      body = {
        type: 'faq',
        question: editor.question.trim(),
        answer: editor.answer.trim(),
      };
    } else if (type === 'website') {
      body = {
        type: 'website',
        url: editor.website_url.trim(),
      };
    } else if (type === 'promotions') {
      body = {
        type: 'promotion',
        title: editor.title.trim(),
        details: editor.content.trim(),
        valid_until: editor.valid_until || null,
      };
    } else {
      body = {
        type,
        title: editor.title.trim(),
        content: editor.content.trim(),
      };
    }

    saveResource(
      'knowledge',
      knowledgeApi,
      'POST',
      body,
      async (response) => {
        const created =
          response?.entry ||
          response?.knowledge ||
          response;

        if (
          created &&
          (created.id || created.title || created.question)
        ) {
          setEntries((current) => [
            created,
            ...current,
          ]);
        }

        setEditor((current) => ({
          ...current,
          question: '',
          answer: '',
          title: '',
          content: '',
          website_url: '',
          valid_until: '',
        }));
      }
    );
  };

  const uploadDocument = (event) => {
    event.preventDefault();

    if (!documentFile) {
      showNotice('Select a PDF or image first.');
      return;
    }

    if (documentFile.size > 10 * 1024 * 1024) {
      showNotice('Maximum file size is 10 MB.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
    ];

    if (!allowedTypes.includes(documentFile.type)) {
      showNotice('Only PDF, PNG and JPG files are allowed.');
      return;
    }

    const formData = new FormData();

    formData.append('file', documentFile);
    formData.append(
      'title',
      editor.document_title.trim()
    );
    formData.append(
      'description',
      editor.document_description.trim()
    );
    formData.append(
      'share_on_whatsapp',
      String(editor.share_on_whatsapp)
    );

    saveResource(
      'document',
      knowledgeApi,
      'POST',
      formData,
      (response) => {
        const created =
          response?.document || response;

        if (
          created?.id ||
          created?.document_id
        ) {
          setDocuments((current) => [
            created,
            ...current,
          ]);
        }

        setDocumentFile(null);

        setEditor((current) => ({
          ...current,
          document_title: '',
          document_description: '',
          share_on_whatsapp: false,
        }));
      }
    );
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
      value:
        overview?.business_profile_summary ||
        (overview?.business_profile_complete
          ? 'Configured'
          : 'Nothing here yet'),
      detail:
        overview?.business_description ||
        'Your business description and details.',
      action: () => changeTab('setup'),
    },
    {
      title: 'Opening hours',
      icon: 'Clock3',
      value:
        overview?.hours_summary ||
        (overview?.hours_configured
          ? 'Configured'
          : 'Not configured'),
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
      title: 'Documents it can send',
      icon: 'FileText',
      value: overview?.documents_count ?? '—',
      detail: 'Files, menus and price lists.',
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
    setStaffForm(initialStaff);
    setRequestForm(initialRequest);
    setLocationForm({
      name: '',
      address: '',
      phone: '',
      notes: '',
    });
  };

  const saveModal = (event) => {
    event.preventDefault();

    if (modal === 'staff') {
      saveResource(
        'staff',
        staffApi,
        'POST',
        staffForm,
        (response) => {
          const created =
            response?.staff_member || response;

          if (created?.id || created?.staff_id) {
            setStaff((current) => [
              created,
              ...current,
            ]);
          }

          closeModal();
        }
      );
    }

    if (modal === 'location') {
      saveResource(
        'location',
        locationsApi,
        'POST',
        locationForm,
        (response) => {
          const created =
            response?.location || response;

          if (created?.id || created?.location_id) {
            setLocations((current) => [
              created,
              ...current,
            ]);
          }

          closeModal();
        }
      );
    }

    if (modal === 'request') {
      saveResource(
        'request',
        requestTypesApi,
        'POST',
        {
          name: requestForm.name,
          details_to_collect:
            requestForm.detailsToCollect,
          what_happens_next:
            requestForm.whatHappensNext,
          collect_phone_from_whatsapp: true,
        },
        (response) => {
          const created =
            response?.request_type || response;

          if (
            created?.id ||
            created?.request_type_id
          ) {
            setRequests((current) => [
              created,
              ...current,
            ]);
          }

          closeModal();
        }
      );
    }
  };

  return (
    <div className="bb2-brain">
      <PageHeader
        title="AI Brain"
        description="See what your AI knows, teach it, and test it live"
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
            <h2>
              Your AI knows{' '}
              {overview?.known_items_count ??
                overview?.things_count ??
                '—'}{' '}
              things about{' '}
              {overview?.business_name ||
                setup.business_name ||
                'your business'}
            </h2>

            <p className="bb2-muted">
              {overview?.always_known_count ?? '—'}{' '}
              sections it sees in every conversation,
              and{' '}
              {overview?.reference_material_count ?? '—'}{' '}
              items it looks up when customers ask about
              them.
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
                Your AI sees this in every conversation,
                exactly as shown.
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
                Your AI searches this when a customer
                asks something related.
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
                  Add FAQs, documents or promotions,
                  or ask the assistant to help.
                </p>
              </div>
            </section>

            <section className="bb2-section">
              <h2>Try a question</h2>

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
            disabled={
              tokenBalance != null &&
              Number(tokenBalance) <= 0
            }
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
                    'setup',
                    brainSetupApi,
                    'PATCH',
                    setup
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
                    value={setup.whatsapp_number || ''}
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

                    {setup.business_address ||
                      'Not set yet'}

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/dashboard/profile')
                      }
                    >
                      Edit in Profile
                    </button>
                  </div>
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
                  disabled={saving === 'setup'}
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

            <p className="bb2-muted">
              Control how your AI agent communicates
              with customers.
            </p>

            <div className="bb2-form-with-help">
              <form
                className="bb2-form-grid"
                onSubmit={(event) => {
                  event.preventDefault();

                  saveResource(
                    'behaviour',
                    brainSetupApi,
                    'PATCH',
                    setup
                  );
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
                  disabled={saving === 'behaviour'}
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
                  disabled={saving === 'hours'}
                  onClick={() =>
                    saveResource(
                      'hours',
                      businessHoursApi,
                      'PUT',
                      { days: hours }
                    )
                  }
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
                disabled={saving === 'rules'}
                onClick={() =>
                  saveResource(
                    'rules',
                    bookingRulesApi,
                    'PUT',
                    rules
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
                    {item.reason ||
                      item.day_type ||
                      'Closed'}
                  </span>

                  <button
                    type="button"
                    disabled={saving === 'delete-date'}
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
                onSubmit={(event) => {
                  event.preventDefault();

                  saveResource(
                    'date',
                    closedDatesApi,
                    'POST',
                    dateForm,
                    (response) => {
                      const created =
                        response?.date || response;

                      if (
                        created?.id ||
                        created?.date
                      ) {
                        setClosedDates((current) => [
                          ...current,
                          created,
                        ]);
                      }

                      setDateForm({
                        date: '',
                        day_type: 'Closed all day',
                        reason: '',
                      });
                    }
                  );
                }}
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
                  disabled={saving === 'date'}
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
                onClick={() => setModal('staff')}
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
                  </span>
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
                  onClick={() => setModal('staff')}
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
              onClick={() => setModal('location')}
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
                onClick={() => setModal('location')}
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

            <p className="bb2-muted">
              {knowledgeSection === 'FAQs'
                ? 'Frequently asked questions the AI will answer directly from its knowledge base.'
                : knowledgeSection === 'Promotions'
                  ? 'Active offers your AI mentions when customers ask about pricing or discounts.'
                  : knowledgeSection === 'Documents'
                    ? 'Upload PDFs or images. Your AI reads the content and can send files to customers on request.'
                    : knowledgeSection === 'Website'
                      ? 'Connect your website so the AI can answer questions from its content.'
                      : 'Teach the AI from customer conversations and corrections.'}
            </p>

            <button
              type="button"
              className="bb2-text-link"
              onClick={() => {
                setNotApplicable((current) => ({
                  ...current,
                  [knowledgeSection]:
                    !current[knowledgeSection],
                }));

                showNotice(
                  'This preference is local until a backend setting is available.'
                );
              }}
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
                    className="bb2-knowledge-form"
                    onSubmit={submitKnowledge}
                  >
                    <Field title="Question *">
                      <input
                        className="bb2-control"
                        required
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
                      disabled={saving === 'knowledge'}
                    >
                      <Icon name="Plus" size={16} />
                      Save FAQ
                    </button>
                  </form>

                  <div className="bb2-knowledge-list">
                    {entries.map((item) => (
                      <div key={item.id || item.question}>
                        <strong>
                          {item.question || item.title}
                        </strong>

                        <p>
                          {item.answer || item.content}
                        </p>
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
                <form
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

                  <button
                    className="bb2-main-button"
                    disabled={saving === 'knowledge'}
                  >
                    <Icon name="Plus" size={16} />
                    Add promotion
                  </button>
                </form>
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
                        accept=".pdf,.png,.jpg,.jpeg"
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
                      disabled={saving === 'document'}
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
                      <p
                        className="bb2-saved-row"
                        key={
                          item.id ||
                          item.document_id ||
                          item.title
                        }
                      >
                        {item.title || item.file_name}
                      </p>
                    ))}
                  </form>

                  <InfoCard title="How documents work">
                    Uploaded files are indexed so
                    your AI can answer questions from
                    menus, price lists and catalogues.
                    Sharing a file through WhatsApp
                    requires backend support.
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
                      Your AI can read website pages
                      and index the content after
                      crawling succeeds.
                    </p>

                    <Field title="Website URL *">
                      <input
                        type="url"
                        required
                        className="bb2-control"
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
                      disabled={saving === 'knowledge'}
                    >
                      <Icon name="Globe" size={16} />
                      Crawl website
                    </button>
                  </form>

                  <InfoCard title="Website crawling">
                    Page limits and crawling behavior
                    depend on your backend. Re-crawl
                    whenever website content changes.
                  </InfoCard>
                </div>
              )}

            {!notApplicable[knowledgeSection] &&
              knowledgeSection === 'Chat Training' && (
                <form
                  className="bb2-knowledge-form"
                  onSubmit={submitKnowledge}
                >
                  <Field title="Training title *">
                    <input
                      className="bb2-control"
                      required
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
                      value={editor.content}
                      onChange={(event) =>
                        updateEditor(
                          'content',
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <button
                    className="bb2-main-button"
                    disabled={saving === 'knowledge'}
                  >
                    Save training
                  </button>
                </form>
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
                Tell your AI which details to collect
                when customers make an enquiry.
              </p>
            </div>

            <button
              type="button"
              className="bb2-main-button"
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
                Your AI will collect the information
                you specify when a customer sends a
                request.
              </p>

              <button
                type="button"
                className="bb2-main-button"
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
              A test conversation with your AI.
              Nothing is sent over WhatsApp.
              Test orders and appointments should not
              trigger real couriers or payments.
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
            disabled={checkingPlan}
          />

          {!isConfigured(testAiApi) && (
            <p className="bb2-error">
              Test AI API is not configured.
            </p>
          )}
        </div>
      )}

      {/* ADD STAFF / LOCATION / REQUEST MODAL */}
      {modal && (
        <Modal
          title={
            modal === 'staff'
              ? 'Add staff member'
              : modal === 'location'
                ? 'Add location'
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
                disabled={Boolean(saving)}
              >
                {saving ? 'Saving…' : 'Save'}
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
                    required={
                      key !== 'phone' &&
                      key !== 'notes'
                    }
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

            {modal === 'staff' && (
              <Field title="Working hours">
                <SelectField
                  value={staffForm.hours_mode}
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
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
