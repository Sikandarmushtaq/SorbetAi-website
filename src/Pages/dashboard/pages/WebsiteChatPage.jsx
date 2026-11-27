
import './WebsiteChatPage.css';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BarChart3,
  // Check,
  Copy,
  ImagePlus,
  Info,
  KeyRound,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  // ShieldCheck,
  Trash2,
  Upload,
  // X,
} from 'lucide-react';

import { websiteChatApi } from '../../../services/dashboard/website-chat.api.js';

import {
  Modal,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

const UPLOAD_ACTION =
  process.env.REACT_APP_API_WEBSITE_CHAT_UPLOAD_ACTION || '';

const ROTATE_ACTION =
  process.env.REACT_APP_API_WEBSITE_CHAT_ROTATE_ACTION || '';

const INITIAL_SETTINGS = {
  allowedDomains: '',
  greeting: '',
  replyTime: '',
  brandColor: '#FF7A59',
  quickReplies: [],
  accent: 'coral',
  position: 'right',
};

const INSTALLATION_GUIDES = {
  WordPress: [
    'In your WordPress dashboard, go to Plugins > Add New.',
    'Search for "Insert Headers and Footers" (or a similar free plugin) and install it.',
    'Open the plugin settings and find the "Footer" box.',
    'Paste the snippet above into that box and click Save.',
  ],
  Shopify: [
    'Open your Shopify admin and go to Online Store > Themes.',
    'Open the theme menu and choose Edit code.',
    'Find the main theme.liquid layout file.',
    'Paste the snippet immediately before the closing </body> tag, then save.',
  ],
  Wix: [
    'Open your Wix site dashboard and locate Settings > Custom Code.',
    'Choose Add Custom Code and paste the snippet.',
    'Apply it to all relevant pages and select the Body - end placement.',
    'Save, publish your website, and test the chat widget.',
  ],
  Squarespace: [
    'Open your Squarespace website settings.',
    'Find Code Injection, if available on your plan.',
    'Paste the installation snippet into the Footer section.',
    'Save your changes and test the widget on your published website.',
  ],
  'Custom / Developer': [
    'Open the shared HTML layout or template used by your website.',
    'Copy the website-specific embed snippet shown above.',
    'Paste it immediately before the closing </body> tag.',
    'Deploy your changes and test on an allowed domain.',
  ],
};

function firstValue(...values) {
  return values.find(
    (value) => value !== null &&
      value !== undefined &&
      value !== ''
  );
}

function extractWidget(response) {
  return (
    response?.widget ||
    response?.settings ||
    response?.data?.widget ||
    response?.data?.settings ||
    response?.data ||
    response ||
    {}
  );
}

function normalizeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ''))
    ? value
    : '#FF7A59';
}

function readQuickReplies(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) =>
      typeof item === 'string'
        ? item
        : item?.text || item?.label || ''
    )
    .filter(Boolean);
}

function settingsFromServer(value) {
  const domains = firstValue(
    value.allowed_domains,
    value.allowedDomains,
    value.domains
  );

  const fallbackDomain =
    value.domain || value.website_url || '';

  const allowedDomains = Array.isArray(domains)
    ? domains.join(', ')
    : domains || fallbackDomain;

  const accent = value.accent || 'coral';

  const defaultColor =
    accent === 'green'
      ? '#10372A'
      : accent === 'lavender'
        ? '#CDBDFF'
        : '#FF7A59';

  return {
    allowedDomains: String(allowedDomains || ''),
    greeting: String(
      firstValue(
        value.greeting,
        value.welcome_message
      ) || ''
    ),
    replyTime: String(
      firstValue(
        value.expected_reply_time,
        value.reply_time,
        value.response_time_text
      ) || ''
    ),
    brandColor: normalizeColor(
      firstValue(
        value.brand_color,
        value.widget_color,
        value.primary_color,
        defaultColor
      )
    ),
    quickReplies: readQuickReplies(
      firstValue(
        value.quick_replies,
        value.suggested_replies,
        value.suggestions
      )
    ),
    accent,
    position: value.position || 'right',
  };
}

function parseDomains(raw) {
  return [
    ...new Set(
      String(raw || '')
        .split(/[,\n]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .map((item) => {
          const withoutProtocol = item.replace(
            /^https?:\/\//,
            ''
          );

          return withoutProtocol.replace(/\/$/, '');
        })
    ),
  ];
}

function invalidDomain(domain) {
  if (domain === 'localhost') return false;

  return !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i
    .test(domain);
}

function serverEnabled(value, fallback = false) {
  return Boolean(
    firstValue(
      value?.enabled,
      value?.is_enabled,
      fallback
    )
  );
}

export default function WebsiteChatPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { showNotice, Notice } = useNotice();

  const configured = websiteChatApi.isConfigured();

  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [enabled, setEnabled] = useState(false);

  const [embedCode, setEmbedCode] = useState('');
  const [widgetKey, setWidgetKey] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [localIconPreview, setLocalIconPreview] = useState('');

  const [platform, setPlatform] = useState('WordPress');
  const [newReply, setNewReply] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rotating, setRotating] = useState(false);

  const [rotateOpen, setRotateOpen] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyServerWidget = useCallback((response) => {
    const value = extractWidget(response);

    setSettings(settingsFromServer(value));
    setEnabled(serverEnabled(value));

    setEmbedCode(String(
      firstValue(
        value.embed_code,
        value.install_snippet,
        value.snippet,
        response?.embed_code
      ) || ''
    ));

    setWidgetKey(String(
      firstValue(
        value.widget_key,
        value.public_key,
        value.site_key,
        response?.widget_key
      ) || ''
    ));

    setIconUrl(String(
      firstValue(
        value.icon_url,
        value.logo_url,
        value.bubble_icon_url,
        response?.icon_url
      ) || ''
    ));
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!configured) {
      setError(
        'Website Chat API is not configured. Set REACT_APP_API_WEBSITE_CHAT_PATH.'
      );
      setLoading(false);
      return;
    }

    try {
      const response = await websiteChatApi.request();
      applyServerWidget(response);
    } catch (requestError) {
      setError(
        requestError?.message ||
        'Unable to load website chat settings.'
      );
    } finally {
      setLoading(false);
    }
  }, [configured, applyServerWidget]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalIconPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalIconPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const toggleWidget = async (event) => {
    const nextEnabled = event.target.checked;

    if (!configured) {
      showNotice(
        'Connect the Website Chat API before enabling the widget.'
      );
      return;
    }

    if (nextEnabled) {
      const domains = parseDomains(settings.allowedDomains);

      if (
        domains.length === 0 ||
        domains.some(invalidDomain)
      ) {
        showNotice(
          'Add and save at least one valid allowed domain before enabling the widget.'
        );
        return;
      }
    }

    setToggling(true);

    try {
      const response = await websiteChatApi.request({
        method: 'PATCH',
        body: { enabled: nextEnabled },
      });

      const value = extractWidget(response);

      setEnabled(serverEnabled(value, nextEnabled));

      showNotice(
        nextEnabled
          ? 'Widget enable request accepted.'
          : 'Widget disable request accepted.'
      );
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to update widget status.'
      );
    } finally {
      setToggling(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();

    if (!configured || saving) {
      if (!configured) {
        showNotice('Website Chat API is not configured.');
      }
      return;
    }

    const domains = parseDomains(settings.allowedDomains);

    if (
      domains.length === 0 ||
      domains.some(invalidDomain)
    ) {
      showNotice(
        'Enter valid allowed domains, separated by commas. Example: example.com, shop.example.com'
      );
      return;
    }

    const quickReplies = settings.quickReplies
      .map((reply) => reply.trim())
      .filter(Boolean);

    setSaving(true);

    try {
      // Includes legacy fields to keep compatibility
      // with the existing website-chat settings form.
      const payload = {
        domain: `https://${domains[0]}`,
        allowed_domains: domains,
        greeting: settings.greeting.trim(),
        expected_reply_time: settings.replyTime.trim(),
        brand_color: settings.brandColor,
        quick_replies: quickReplies,
        accent: settings.accent,
        position: settings.position,
        enabled,
      };

      const response = await websiteChatApi.request({
        method: 'PATCH',
        body: payload,
      });

      const value = extractWidget(response);

      const newSnippet = firstValue(
        value.embed_code,
        value.install_snippet,
        response?.embed_code
      );

      const newKey = firstValue(
        value.widget_key,
        value.public_key,
        response?.widget_key
      );

      if (newSnippet !== undefined) {
        setEmbedCode(String(newSnippet));
      }

      if (newKey !== undefined) {
        setWidgetKey(String(newKey));
      }

      setSettings((current) => ({
        ...current,
        allowedDomains: domains.join(', '),
        quickReplies,
      }));

      showNotice('Widget settings saved.');
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to save website chat settings.'
      );
    } finally {
      setSaving(false);
    }
  };

  const chooseIcon = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const acceptedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!acceptedTypes.includes(file.type)) {
      showNotice('Choose a PNG, JPG or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotice('Icon image must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const uploadIcon = async () => {
    if (!selectedFile || uploading) return;

    if (!configured || !UPLOAD_ACTION) {
      showNotice(
        'Icon upload backend action is not configured. Set REACT_APP_API_WEBSITE_CHAT_UPLOAD_ACTION to your actual API action.'
      );
      return;
    }

    setUploading(true);

    try {
      const payload = new FormData();
      payload.append('icon', selectedFile);

      const response = await websiteChatApi.request({
        method: 'POST',
        action: UPLOAD_ACTION,
        body: payload,
      });

      const value = extractWidget(response);

      const uploadedUrl = firstValue(
        value.icon_url,
        value.logo_url,
        value.bubble_icon_url,
        response?.url
      );

      if (uploadedUrl) {
        setIconUrl(String(uploadedUrl));
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      showNotice(
        uploadedUrl
          ? 'Chat bubble icon uploaded.'
          : 'Upload request completed. Refresh to confirm the saved icon.'
      );
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to upload the icon.'
      );
    } finally {
      setUploading(false);
    }
  };

  const copySnippet = async () => {
    if (!embedCode) {
      showNotice(
        'The backend has not provided an embed snippet yet.'
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(embedCode);
      showNotice('Embed snippet copied.');
    } catch {
      showNotice('Clipboard access is unavailable.');
    }
  };

  const rotateWidgetKey = async () => {
    if (rotating) return;

    if (!configured || !ROTATE_ACTION) {
      showNotice(
        'Key rotation backend action is not configured. Set REACT_APP_API_WEBSITE_CHAT_ROTATE_ACTION.'
      );
      return;
    }

    setRotating(true);

    try {
      const response = await websiteChatApi.request({
        method: 'POST',
        action: ROTATE_ACTION,
        body: {},
      });

      const value = extractWidget(response);

      const nextKey = firstValue(
        value.widget_key,
        value.public_key,
        value.site_key
      );

      const nextSnippet = firstValue(
        value.embed_code,
        value.install_snippet,
        value.snippet
      );

      if (!nextKey && !nextSnippet) {
        throw new Error(
          'The backend did not return a new key or installation snippet. Refresh and verify the rotation before updating your site.'
        );
      }

      if (nextKey) setWidgetKey(String(nextKey));
      if (nextSnippet) setEmbedCode(String(nextSnippet));

      setRotateOpen(false);

      showNotice(
        'Key rotation processed. Replace the old embed snippet on your website.'
      );
    } catch (requestError) {
      showNotice(
        requestError?.message ||
        'Unable to rotate widget key.'
      );
    } finally {
      setRotating(false);
    }
  };

  const addQuickReply = () => {
    const text = newReply.trim();

    if (!text) return;

    if (text.length > 100) {
      showNotice('Quick replies must be 100 characters or less.');
      return;
    }

    if (settings.quickReplies.length >= 6) {
      showNotice('You can add up to 6 quick replies.');
      return;
    }

    if (
      settings.quickReplies.some(
        (item) => item.toLowerCase() === text.toLowerCase()
      )
    ) {
      showNotice('This quick reply already exists.');
      return;
    }

    update('quickReplies', [...settings.quickReplies, text]);
    setNewReply('');
  };

  const removeQuickReply = (index) => {
    update(
      'quickReplies',
      settings.quickReplies.filter((_, i) => i !== index)
    );
  };

  const displayIcon = localIconPreview || iconUrl;
  const guide = INSTALLATION_GUIDES[platform] || [];

  return (
    <div className="wc-page">
      {Notice}

      <div className="wc-page-top">
        <button
          type="button"
          className="wc-back"
          onClick={() => navigate('/dashboard/channels')}
        >
          <ArrowLeft size={15} />
          Back to Channels
        </button>
      </div>

      <header className="wc-page-header">
        <div>
          <h1>Website Chat</h1>
          <p>
            Embed the same AI assistant that answers your
            WhatsApp customers directly on your website.
          </p>
        </div>

        <button
          type="button"
          className="wc-outline-button"
          onClick={() => navigate('/dashboard/analytics')}
        >
          <BarChart3 size={15} />
          View Analytics
        </button>
      </header>

      {error && (
        <div className="wc-error" role="status">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="wc-loading" role="status">
          Loading website chat settings…
        </div>
      )}

      <div className="wc-layout">
        <div className="wc-left-column">
          {/* ENABLE WIDGET */}
          <section className="wc-panel wc-enable-panel">
            <div className="wc-enable-copy">
              <h2>Enable widget</h2>
              <p>
                Turn this off any time to immediately stop
                the embed script from responding on your site.
              </p>
            </div>

            <label className="wc-enable-control">
              <input
                type="checkbox"
                checked={enabled}
                onChange={toggleWidget}
                disabled={!configured || loading || toggling}
                aria-label="Enable website chat widget"
              />
              <span className={`wc-state ${enabled ? 'on' : ''}`}>
                {toggling
                  ? 'Saving…'
                  : enabled
                    ? 'Enabled'
                    : 'Disabled'}
              </span>
            </label>
          </section>

          {/* CHAT BUBBLE ICON */}
          <section className="wc-panel">
            <h2>Chat bubble icon</h2>
            <p className="wc-help-text">
              Upload your own logo to replace the default
              Bellbee icon on your chat bubble.
            </p>

            <div className="wc-icon-upload-row">
              <span className="wc-icon-preview">
                {displayIcon ? (
                  <img
                    src={displayIcon}
                    alt="Chat bubble icon preview"
                  />
                ) : (
                  <ImagePlus size={23} />
                )}
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={chooseIcon}
                className="wc-hidden-file"
                aria-label="Choose chat icon image"
              />

              <button
                type="button"
                className="wc-outline-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={14} />
                Choose icon
              </button>

              {selectedFile && (
                <button
                  type="button"
                  className="wc-primary-button"
                  onClick={uploadIcon}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload icon'}
                </button>
              )}
            </div>

            {selectedFile && (
              <p className="wc-file-hint">
                Selected: {selectedFile.name} — not uploaded yet
              </p>
            )}

            <p className="wc-file-hint">
              PNG, JPG or WebP · Maximum 2 MB
            </p>
          </section>

          {/* EMBED SNIPPET */}
          <section className="wc-panel">
            <h2>Embed snippet</h2>
            <p className="wc-help-text">
              Copy this code, then follow the steps below
              for how your website was built.
            </p>

            <div className="wc-snippet-row">
              <code className="wc-snippet-code">
                {embedCode ||
                  'Your website-specific embed snippet will appear here when provided by the backend.'}
              </code>

              <button
                type="button"
                className="wc-outline-button"
                onClick={copySnippet}
                disabled={!embedCode}
              >
                <Copy size={14} />
                Copy
              </button>
            </div>

            <div className="wc-key-footer">
              <span>
                Widget key:{' '}
                <strong>{widgetKey || 'Not available'}</strong>
              </span>

              <button
                type="button"
                className="wc-danger-link"
                onClick={() => setRotateOpen(true)}
                disabled={!configured || !widgetKey || rotating}
              >
                <KeyRound size={14} />
                Rotate key
              </button>
            </div>
          </section>

          {/* INSTALLATION GUIDE */}
          <section className="wc-panel wc-install-panel">
            <h2>Where do I add this?</h2>
            <p className="wc-help-text">
              Pick how your website was built to see exact steps.
            </p>

            <div
              className="wc-platform-tabs"
              role="tablist"
              aria-label="Website platform"
            >
              {Object.keys(INSTALLATION_GUIDES).map((name) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={platform === name}
                  key={name}
                  className={platform === name ? 'active' : ''}
                  onClick={() => setPlatform(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <ol className="wc-instruction-list">
              {guide.map((instruction, index) => (
                <li key={`${platform}-${index}`}>
                  {instruction}
                </li>
              ))}
            </ol>

            <p className="wc-support-help">
              Don't see your website platform listed, or not
              sure how to do this yourself?{' '}
              <button
                type="button"
                onClick={() => navigate('/dashboard/support')}
              >
                Contact support
              </button>
              {' '}and we'll help you get it installed.
            </p>
          </section>
        </div>

        <aside className="wc-right-column">
          {/* CONFIGURATION */}
          <form
            className="wc-panel wc-configuration"
            onSubmit={saveSettings}
          >
            <h2>Configuration</h2>

            <div className="wc-form-field">
              <label htmlFor="wc-domains">
                Allowed domains <b>*</b>
              </label>

              <input
                id="wc-domains"
                type="text"
                value={settings.allowedDomains}
                onChange={(event) =>
                  update('allowedDomains', event.target.value)
                }
                placeholder="example.com, shop.example.com"
                required
              />

              <small>
                Comma-separated. The widget only responds
                when embedded on these domains. Required
                before it will go live.
              </small>
            </div>

            <div className="wc-form-field">
              <label htmlFor="wc-greeting">
                Greeting message
              </label>

              <input
                id="wc-greeting"
                type="text"
                maxLength={300}
                value={settings.greeting}
                onChange={(event) =>
                  update('greeting', event.target.value)
                }
                placeholder="Hi! How can we help you today?"
              />
            </div>

            <div className="wc-form-field">
              <label htmlFor="wc-reply-time">
                Expected reply time
              </label>

              <input
                id="wc-reply-time"
                type="text"
                maxLength={120}
                value={settings.replyTime}
                onChange={(event) =>
                  update('replyTime', event.target.value)
                }
                placeholder="e.g. We typically reply within a few minutes"
              />

              <small>
                Shown on the pre-chat form to set
                expectations before a visitor starts chatting.
                Leave blank to hide it.
              </small>
            </div>

            <div className="wc-form-field">
              <label htmlFor="wc-brand-color">
                Brand color
              </label>

              <div className="wc-color-row">
                <input
                  id="wc-brand-color"
                  type="color"
                  value={settings.brandColor}
                  onChange={(event) =>
                    update('brandColor', event.target.value)
                  }
                  aria-label="Choose widget brand color"
                />

                <span>
                  Shown on your chat bubble and header only.
                </span>
              </div>
            </div>

            <div className="wc-form-field">
              <label>Quick reply suggestions</label>

              <small>
                Short tappable prompts shown when a chat
                starts, before the visitor types anything.
              </small>

              {settings.quickReplies.length > 0 && (
                <div className="wc-quick-reply-list">
                  {settings.quickReplies.map((reply, index) => (
                    <div
                      key={`${reply}-${index}`}
                      className="wc-quick-reply-row"
                    >
                      <span>{reply}</span>

                      <button
                        type="button"
                        onClick={() => removeQuickReply(index)}
                        aria-label={`Remove ${reply}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {settings.quickReplies.length < 6 && (
                <div className="wc-add-reply">
                  <input
                    type="text"
                    maxLength={100}
                    value={newReply}
                    onChange={(event) =>
                      setNewReply(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addQuickReply();
                      }
                    }}
                    placeholder="e.g. What are your opening hours?"
                  />

                  <button
                    type="button"
                    onClick={addQuickReply}
                    disabled={!newReply.trim()}
                    aria-label="Add quick reply"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              )}
            </div>

            <div className="wc-save-row">
              <button
                type="submit"
                className="wc-primary-button"
                disabled={!configured || saving || loading}
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* LIVE PREVIEW */}
          <section className="wc-panel wc-preview-panel">
            <h2>Preview</h2>

            <div className="wc-chat-preview">
              <div
                className="wc-chat-preview-header"
                style={{
                  backgroundColor: settings.brandColor,
                }}
              >
                {displayIcon ? (
                  <img src={displayIcon} alt="" />
                ) : (
                  <MessageCircle size={17} />
                )}

                <strong>Bellbee Assistant</strong>
              </div>

              <div className="wc-chat-preview-body">
                <div
                  className="wc-chat-bubble"
                  style={{
                    backgroundColor: settings.brandColor,
                  }}
                >
                  {settings.greeting ||
                    'Hi! How can we help you today?'}
                </div>

                {settings.replyTime && (
                  <small className="wc-preview-reply-time">
                    {settings.replyTime}
                  </small>
                )}

                {settings.quickReplies.length > 0 && (
                  <div className="wc-preview-quick-replies">
                    {settings.quickReplies.map((reply, index) => (
                      <span key={`${reply}-${index}`}>
                        {reply}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="wc-preview-note">
              Reflects the icon, greeting message, brand
              color, quick replies, and reply time set above.
            </p>
          </section>

          {/* HOW IT WORKS */}
          <section className="wc-how-it-works">
            <p>
              <strong>How it works:</strong>{' '}
              Visitors can chat immediately without giving
              a phone number. If they check availability
              or place an order, the assistant may ask for
              contact details before finalising. The backend
              manages conversations and follow-ups.
            </p>
          </section>
        </aside>
      </div>

      {/* ROTATE KEY CONFIRMATION */}
      {rotateOpen && (
        <Modal
          title="Rotate widget key?"
          description="This will require you to update the embed snippet on your website."
          onClose={() => {
            if (!rotating) setRotateOpen(false);
          }}
          footer={
            <>
              <button
                type="button"
                className="wc-outline-button"
                onClick={() => setRotateOpen(false)}
                disabled={rotating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wc-danger-button"
                onClick={rotateWidgetKey}
                disabled={rotating || !ROTATE_ACTION}
              >
                <KeyRound size={15} />
                {rotating ? 'Rotating…' : 'Rotate key'}
              </button>
            </>
          }
        >
          <div className="wc-rotation-warning">
            <Info size={19} />
            <p>
              After rotation, your old embed snippet may stop
              working. Copy the new snippet and update every
              website where the widget is installed.
            </p>
          </div>

          {!ROTATE_ACTION && (
            <p className="wc-api-note">
              Set REACT_APP_API_WEBSITE_CHAT_ROTATE_ACTION
              to the actual backend key-rotation action.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}