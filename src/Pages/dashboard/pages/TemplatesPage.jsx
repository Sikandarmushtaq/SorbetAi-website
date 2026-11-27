
import './TemplatesPage.css';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  FileText,
  Info,
  Plus,
  RefreshCw,
  X,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

import { templatesApi } from '../../../services/dashboard/templates.api.js';

import { useNotice } from '../../../components/dashboard/common/DashboardUI';

const createInitialForm = () => ({
  name: '',
  category: 'Utility',
  language: 'en_US',
  headerType: 'None',
  header: '',
  body: '',
  footer: '',
  buttons: [],
});

const languages = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

const buttonTypes = [
  { value: 'quick_reply', label: 'QUICK REPLY' },
  { value: 'url', label: 'URL' },
  { value: 'phone_number', label: 'PHONE NUMBER' },
  { value: 'copy_code', label: 'COPY CODE' },
];

function extractTemplates(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.templates)) return data.templates;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function getTemplateId(template) {
  return template?.id ?? template?.template_id;
}

function statusClass(status) {
  const value = String(status || 'pending').toLowerCase();

  if (value === 'approved') return 'approved';
  if (value === 'rejected') return 'rejected';

  return 'pending';
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' ||
      url.protocol === 'http:'
    );
  } catch {
    return false;
  }
}

function newButton() {
  return {
    type: 'quick_reply',
    text: '',
    url: '',
    phone_number: '',
    coupon_code: '',
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(createInitialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [refreshingId, setRefreshingId] = useState('');
  const [loadError, setLoadError] = useState('');

  const { showNotice, Notice } = useNotice();

  /* =========================================
     FETCH TEMPLATES
  ========================================= */

  const loadTemplates = useCallback(async (refresh = false) => {
    if (!templatesApi.isConfigured()) {
      setTemplates([]);
      setLoadError(
        'Templates API is not configured yet.'
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const response = await templatesApi.request({
        query: refresh
          ? { refresh_meta_status: true }
          : undefined,
      });

      setTemplates(extractTemplates(response));
    } catch (error) {
      setLoadError(
        error.message || 'Unable to load templates.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /* =========================================
     MODAL BEHAVIOR
  ========================================= */

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSubmitting]);

  const openModal = () => {
    setForm(createInitialForm());
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsOpen(false);
    setForm(createInitialForm());
  };

  /* =========================================
     FORM UPDATES
  ========================================= */

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const addButton = () => {
    setForm((current) => {
      if (current.buttons.length >= 3) return current;

      return {
        ...current,
        buttons: [...current.buttons, newButton()],
      };
    });
  };

  const changeButton = (index, key, value) => {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.map((button, position) =>
        position === index
          ? {
              ...button,
              [key]: value,
            }
          : button
      ),
    }));
  };

  const removeButton = (index) => {
    setForm((current) => ({
      ...current,
      buttons: current.buttons.filter(
        (_, position) => position !== index
      ),
    }));
  };

  /* =========================================
     SUBMIT TEMPLATE
  ========================================= */

  const submitTemplate = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!templatesApi.isConfigured()) {
      showNotice(
        'Configure the templates API before submitting to Meta.'
      );
      return;
    }

    const name = form.name.trim();
    const body = form.body.trim();

    if (!/^[a-z0-9_]+$/.test(name)) {
      showNotice(
        'Template names must contain only lowercase letters, numbers and underscores.'
      );
      return;
    }

    if (!body) {
      showNotice('Body text is required.');
      return;
    }

    if (form.headerType !== 'None' && !form.header.trim()) {
      showNotice('Complete the selected header field.');
      return;
    }

    if (
      ['Image', 'Video', 'Document'].includes(form.headerType) &&
      !isValidHttpUrl(form.header)
    ) {
      showNotice(
        'Provide a valid HTTP or HTTPS media URL.'
      );
      return;
    }

    for (const button of form.buttons) {
      if (!button.text.trim()) {
        showNotice('Every button needs a label.');
        return;
      }

      if (
        button.type === 'url' &&
        !isValidHttpUrl(button.url)
      ) {
        showNotice('Enter a valid URL for the URL button.');
        return;
      }

      if (
        button.type === 'phone_number' &&
        !/^\+[1-9]\d{6,14}$/.test(
          button.phone_number.trim()
        )
      ) {
        showNotice(
          'Phone number must include country code, for example +923001234567.'
        );
        return;
      }

      if (
        button.type === 'copy_code' &&
        !button.coupon_code.trim()
      ) {
        showNotice('Enter a code for the Copy Code button.');
        return;
      }
    }

    const payload = {
      name,
      category: form.category,
      language: form.language,

      header:
        form.headerType === 'None'
          ? null
          : {
              type: form.headerType.toLowerCase(),
              value: form.header.trim(),
            },

      body,
      footer: form.footer.trim() || null,

      buttons: form.buttons.map((button) => {
        const result = {
          type: button.type,
          text: button.text.trim(),
        };

        if (button.type === 'url') {
          result.url = button.url.trim();
        }

        if (button.type === 'phone_number') {
          result.phone_number =
            button.phone_number.trim();
        }

        if (button.type === 'copy_code') {
          result.coupon_code =
            button.coupon_code.trim();
        }

        return result;
      }),
    };

    setIsSubmitting(true);

    try {
      const response = await templatesApi.request({
        method: 'POST',
        body: payload,
      });

      if (
        response?.success === false ||
        response?.data?.success === false
      ) {
        throw new Error(
          response?.message || 'Template submission failed.'
        );
      }

      setIsOpen(false);
      setForm(createInitialForm());

      showNotice(
        'Template submitted to the connected service. Its Meta review status will appear in the list.'
      );

      await loadTemplates();
    } catch (error) {
      showNotice(
        error.message || 'Unable to submit template.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================
     REFRESH INDIVIDUAL STATUS
  ========================================= */

  const refreshTemplate = async (template) => {
    const id = getTemplateId(template);

    if (id == null) {
      await loadTemplates(true);
      return;
    }

    setRefreshingId(String(id));

    try {
      const response = await templatesApi.request({
        id,
        query: {
          refresh_meta_status: true,
        },
      });

      const data = response?.data ?? response;
      const updated = data?.template ?? data;

      if (updated && typeof updated === 'object') {
        setTemplates((current) =>
          current.map((item) =>
            String(getTemplateId(item)) === String(id)
              ? { ...item, ...updated }
              : item
          )
        );
      }

      showNotice('Template status refresh completed.');
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setRefreshingId('');
    }
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="tp-page">
      {/* PAGE HEADER */}

      <div className="tp-page-header">
        <div>
          <h1>Message Templates</h1>

          <p>
            Create and manage WhatsApp Business message
            templates. Meta reviews each submission
            (24–48 hrs).
          </p>
        </div>

        <div className="tp-page-actions">
          <button
            type="button"
            className="tp-secondary"
            onClick={() => loadTemplates(true)}
            disabled={isLoading}
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <button
            type="button"
            className="tp-primary"
            onClick={openModal}
          >
            <Plus size={15} />
            New Template
          </button>
        </div>
      </div>

      {Notice}

      {loadError && (
        <div className="tp-api-warning" role="status">
          {loadError}
        </div>
      )}

      {/* EMPTY STATE / TEMPLATE LIST */}

      {isLoading ? (
        <div className="tp-empty">
          <FileText size={30} />
          <p>Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="tp-empty">
          <FileText
            size={30}
            strokeWidth={1.7}
          />

          <strong>No templates yet</strong>

          <p>
            Templates let you message customers outside
            the 24-hour window.
          </p>
        </div>
      ) : (
        <div className="tp-template-list">
          {templates.map((template, index) => {
            const id =
              getTemplateId(template) ??
              template.name ??
              index;

            return (
              <div
                className="tp-template-row"
                key={id}
              >
                <div className="tp-template-row-icon">
                  <FileText size={19} />
                </div>

                <div className="tp-template-details">
                  <strong>
                    {template.name || 'Unnamed template'}
                  </strong>

                  <small>
                    {template.category || '—'} ·{' '}
                    {template.language || '—'}
                  </small>

                  {String(
                    template.status || ''
                  ).toLowerCase() === 'rejected' &&
                    template.rejection_reason && (
                      <p className="tp-rejection">
                        {template.rejection_reason}
                      </p>
                    )}
                </div>

                <span
                  className={`tp-status tp-status-${statusClass(
                    template.status
                  )}`}
                >
                  {template.status || 'Pending'}
                </span>

                <button
                  type="button"
                  className="tp-icon-button"
                  aria-label={`Refresh status for ${
                    template.name || 'template'
                  }`}
                  title="Refresh status"
                  disabled={
                    refreshingId === String(id)
                  }
                  onClick={() =>
                    refreshTemplate(template)
                  }
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* META REVIEW INFORMATION */}

      <div className="tp-meta-info">
        <div className="tp-meta-info-icon">
          <Info size={17} />
        </div>

        <div>
          <strong>
            About the Meta review process
          </strong>

          <p>
            Submit a template and Meta reviews it
            (usually 24–48 hrs). Once{' '}
            <b>Approved</b>, use it in campaigns to
            message customers who haven't contacted
            you in the last 24 hours. Use{' '}
            <code>{'{{1}}'}</code> for dynamic
            variables. Click the refresh icon to
            request the latest status from your
            connected service.
          </p>
        </div>
      </div>

      {/* CREATE TEMPLATE MODAL */}

      {isOpen && (
        <div
          className="tp-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="tp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tp-modal-title"
          >
            {/* FIXED MODAL HEADER */}

            <header className="tp-dialog-header">
              <div>
                <h2 id="tp-modal-title">
                  Create Template
                </h2>

                <p>
                  See exactly what your customer gets,
                  live, as you build it below.
                </p>
              </div>

              <button
                type="button"
                className="tp-close"
                onClick={closeModal}
                disabled={isSubmitting}
                aria-label="Close template dialog"
              >
                <X size={19} />
              </button>
            </header>

            {/* SCROLLABLE CONTENT */}

            <div className="tp-modal-scroll">
              {/* STICKY LIVE PREVIEW */}

              <div className="tp-live-preview">
                <span className="tp-preview-caption">
                  LIVE PREVIEW
                </span>

                <div className="tp-preview-phone">
                  <div className="tp-preview-bar">
                    PREVIEW
                  </div>

                  <div className="tp-preview-content">
                    {form.headerType === 'Text' &&
                      form.header && (
                        <strong className="tp-preview-heading">
                          {form.header}
                        </strong>
                      )}

                    {form.headerType === 'Image' &&
                      isValidHttpUrl(form.header) && (
                        <img
                          className="tp-preview-image"
                          src={form.header}
                          alt="Template header preview"
                        />
                      )}

                    {['Video', 'Document'].includes(
                      form.headerType
                    ) &&
                      form.header && (
                        <div className="tp-preview-media">
                          <ImageIcon size={17} />
                          {form.headerType} attached
                        </div>
                      )}

                    <div className="tp-preview-message">
                      {form.body ? (
                        <p>{form.body}</p>
                      ) : (
                        <p className="tp-preview-placeholder">
                          Your message will appear here
                          as you fill in the form.
                        </p>
                      )}

                      {form.footer && (
                        <small>{form.footer}</small>
                      )}
                    </div>

                    {form.buttons.map(
                      (button, index) => (
                        <div
                          className="tp-preview-button"
                          key={index}
                        >
                          {button.text ||
                            'Button text'}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* FORM */}

              <form
                id="tp-template-form"
                onSubmit={submitTemplate}
              >
                {/* NAME / CATEGORY / LANGUAGE */}

                <div className="tp-form-section">
                  <div className="tp-three-columns">
                    <label className="tp-field">
                      <span>
                        Template Name <b>*</b>
                      </span>

                      <input
                        type="text"
                        required
                        maxLength={512}
                        placeholder="e.g. order_confirmation"
                        value={form.name}
                        onChange={(event) =>
                          updateField(
                            'name',
                            event.target.value
                              .toLowerCase()
                              .replace(
                                /[^a-z0-9_]/g,
                                '_'
                              )
                          )
                        }
                      />

                      <small>
                        Internal label only.
                        Customers never see this.
                        Lowercase, numbers,
                        underscores.
                      </small>
                    </label>

                    <label className="tp-field">
                      <span>
                        Category <b>*</b>
                      </span>

                      <select
                        value={form.category}
                        onChange={(event) =>
                          updateField(
                            'category',
                            event.target.value
                          )
                        }
                      >
                        <option value="Utility">
                          Utility
                        </option>

                        <option value="Marketing">
                          Marketing
                        </option>
                      </select>

                      <small>
                        Utility is for updates
                        customers expect. Marketing
                        is for promotions.
                      </small>
                    </label>

                    <label className="tp-field">
                      <span>
                        Language <b>*</b>
                      </span>

                      <select
                        value={form.language}
                        onChange={(event) =>
                          updateField(
                            'language',
                            event.target.value
                          )
                        }
                      >
                        {languages.map(
                          (language) => (
                            <option
                              key={language.value}
                              value={language.value}
                            >
                              {language.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                </div>

                {/* HEADER */}

                <div className="tp-form-section">
                  <label className="tp-field">
                    <span>
                      Header{' '}
                      <em>(optional)</em>
                    </span>

                    <select
                      value={form.headerType}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          headerType:
                            event.target.value,
                          header: '',
                        }));
                      }}
                    >
                      <option value="None">
                        None
                      </option>

                      <option value="Text">
                        Text
                      </option>

                      <option value="Image">
                        Image
                      </option>

                      <option value="Video">
                        Video
                      </option>

                      <option value="Document">
                        Document
                      </option>
                    </select>

                    <small>
                      An image, video, file, or bold
                      title line shown at the very top
                      of the message.
                    </small>
                  </label>

                  {form.headerType !== 'None' && (
                    <label className="tp-field tp-subfield">
                      <span>
                        {form.headerType === 'Text'
                          ? 'Header Text'
                          : `${form.headerType} URL`}
                        <b> *</b>
                      </span>

                      <input
                        type={
                          form.headerType === 'Text'
                            ? 'text'
                            : 'url'
                        }
                        required
                        maxLength={
                          form.headerType === 'Text'
                            ? 60
                            : 2048
                        }
                        placeholder={
                          form.headerType === 'Text'
                            ? 'Enter header title'
                            : 'https://example.com/media'
                        }
                        value={form.header}
                        onChange={(event) =>
                          updateField(
                            'header',
                            event.target.value
                          )
                        }
                      />

                      {form.headerType !== 'Text' && (
                        <small>
                          Use a publicly accessible
                          HTTPS media URL supported
                          by your backend and Meta.
                        </small>
                      )}
                    </label>
                  )}
                </div>

                {/* BODY TEXT */}

                <div className="tp-form-section">
                  <label className="tp-field">
                    <span>
                      Body Text <b>*</b>
                    </span>

                    <textarea
                      rows={5}
                      required
                      maxLength={1024}
                      placeholder="Hello {{1}}, your order {{2}} is confirmed and will arrive by {{3}}."
                      value={form.body}
                      onChange={(event) =>
                        updateField(
                          'body',
                          event.target.value
                        )
                      }
                    />

                    <small>
                      Type {'{{1}}'}, {'{{2}}'} etc.
                      anywhere you want real info
                      filled in automatically: the
                      customer's name, an order
                      number, a date. Each gets
                      swapped for the real value when
                      the AI actually sends the message.
                      {' '}
                      {1024 - form.body.length} chars
                      remaining.
                    </small>
                  </label>
                </div>

                {/* FOOTER */}

                <div className="tp-form-section">
                  <label className="tp-field">
                    <span>
                      Footer{' '}
                      <em>
                        (optional, max 60 chars)
                      </em>
                    </span>

                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. Reply STOP to unsubscribe"
                      value={form.footer}
                      onChange={(event) =>
                        updateField(
                          'footer',
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                {/* BUTTONS */}

                <div className="tp-form-section">
                  <div className="tp-buttons-heading">
                    <span>
                      Buttons{' '}
                      <em>(optional, max 3)</em>
                    </span>

                    <button
                      type="button"
                      className="tp-add-button"
                      onClick={addButton}
                      disabled={
                        form.buttons.length >= 3
                      }
                    >
                      <Plus size={13} />
                      Add Button
                    </button>
                  </div>

                  {form.buttons.map(
                    (button, index) => (
                      <div
                        className="tp-button-editor"
                        key={index}
                      >
                        <div className="tp-button-main">
                          <select
                            aria-label={`Button ${
                              index + 1
                            } type`}
                            value={button.type}
                            onChange={(event) => {
                              setForm((current) => ({
                                ...current,
                                buttons:
                                  current.buttons.map(
                                    (item, position) =>
                                      position === index
                                        ? {
                                            ...newButton(),
                                            type:
                                              event.target
                                                .value,
                                          }
                                        : item
                                  ),
                              }));
                            }}
                          >
                            {buttonTypes.map(
                              (type) => (
                                <option
                                  key={type.value}
                                  value={type.value}
                                >
                                  {type.label}
                                </option>
                              )
                            )}
                          </select>

                          <input
                            type="text"
                            required
                            maxLength={25}
                            aria-label={`Button ${
                              index + 1
                            } label`}
                            placeholder="Button label (max 25)"
                            value={button.text}
                            onChange={(event) =>
                              changeButton(
                                index,
                                'text',
                                event.target.value
                              )
                            }
                          />

                          <button
                            type="button"
                            className="tp-remove-button"
                            onClick={() =>
                              removeButton(index)
                            }
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>

                        {button.type === 'url' && (
                          <input
                            className="tp-button-detail"
                            type="url"
                            required
                            placeholder="https://yourwebsite.com"
                            value={button.url}
                            onChange={(event) =>
                              changeButton(
                                index,
                                'url',
                                event.target.value
                              )
                            }
                          />
                        )}

                        {button.type ===
                          'phone_number' && (
                          <input
                            className="tp-button-detail"
                            type="tel"
                            required
                            placeholder="+923001234567"
                            value={
                              button.phone_number
                            }
                            onChange={(event) =>
                              changeButton(
                                index,
                                'phone_number',
                                event.target.value
                              )
                            }
                          />
                        )}

                        {button.type ===
                          'copy_code' && (
                          <input
                            className="tp-button-detail"
                            type="text"
                            required
                            placeholder="Coupon code, e.g. SAVE20"
                            value={
                              button.coupon_code
                            }
                            onChange={(event) =>
                              changeButton(
                                index,
                                'coupon_code',
                                event.target.value
                              )
                            }
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              </form>
            </div>

            {/* FIXED FOOTER */}

            <footer className="tp-dialog-footer">
              <p>
                Meta (WhatsApp's parent company)
                reviews every new template before it
                can be used, usually within 24 to
                48 hours. Its approval status is
                provided by your connected service.
              </p>

              <div className="tp-footer-actions">
                <button
                  type="button"
                  className="tp-secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="tp-template-form"
                  className="tp-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : 'Submit to Meta'}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}