
import './SupportPage.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Check,
  ChevronDown,
  LifeBuoy,
  LoaderCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';

import { supportTicketsApi } from '../../../services/dashboard/support-tickets.api.js';

import {
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

/* =========================================
   CONSTANTS
========================================= */

const initialForm = {
  subject: '',
  category: 'General',
  message: '',
};

const categories = [
  'General',
  'Billing',
  'AI',
  'WhatsApp',
  'Bug Report',
];

const statuses = [
  'All statuses',
  'Open',
  'In progress',
  'Resolved',
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

/* =========================================
   HELPERS
========================================= */

function ticketList(response) {
  if (Array.isArray(response)) return response;

  const value = response?.data || response || {};

  if (Array.isArray(value)) return value;

  return (
    value.items ||
    value.results ||
    value.tickets ||
    []
  );
}

function ticketId(ticket, index) {
  return String(
    ticket.id ??
    ticket.ticket_id ??
    ticket.uuid ??
    `row-${index}`
  );
}

function normalizedStatus(status) {
  return String(status || 'Open')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();
}

function prettyStatus(status) {
  const value = normalizedStatus(status);

  if (value === 'in progress') return 'In progress';
  if (value === 'resolved') return 'Resolved';
  if (value === 'closed') return 'Closed';
  if (value === 'pending') return 'Pending';

  return 'Open';
}

function formatTicketDate(value) {
  if (!value) return '';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function validFile(file) {
  const allowedType = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ].includes(file.type);

  const allowedExtension =
    /\.(pdf|jpe?g|png)$/i.test(file.name);

  return (
    (allowedType || (!file.type && allowedExtension)) &&
    file.size <= MAX_FILE_SIZE
  );
}

/* =========================================
   SUPPORT PAGE
========================================= */

export default function SupportPage() {
  const { showNotice, Notice } = useNotice();

  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');

  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const subjectRef = useRef(null);
  const categoryRef = useRef(null);

  const configured = supportTicketsApi.isConfigured();

  /* =========================================
     LOAD TICKETS FROM BACKEND
  ========================================= */

  const loadTickets = useCallback(async (silent = false) => {
    if (!supportTicketsApi.isConfigured()) {
      setLoadError(
        'Support tickets API is not configured yet.'
      );
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);

    try {
      const response = await supportTicketsApi.request();

      const records = ticketList(response);

      setTickets(
        Array.isArray(records) ? records : []
      );

      setLoadError('');
    } catch (error) {
      if (!silent) {
        setLoadError(
          error?.message ||
          'Unable to load support tickets.'
        );
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();

    if (!configured) return undefined;

    // Periodic refresh; does not pretend to be a
    // websocket or live push connection.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadTickets(true);
      }
    }, 30000);

    const onFocus = () => loadTickets(true);

    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadTickets, configured]);

  /* =========================================
     FILTER TICKETS
  ========================================= */

  const visibleTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        status === 'All statuses' ||
        normalizedStatus(ticket.status) ===
          normalizedStatus(status);

      const searchable = [
        ticket.subject,
        ticket.category,
        ticket.status,
        ticket.ticket_number,
        ticket.id,
        ticket.ticket_id,
        ticket.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, status]);

  const selectedTicket = tickets.find(
    (ticket, index) =>
      ticketId(ticket, index) === selectedId
  ) || null;

  /* =========================================
     MODAL CONTROLS
  ========================================= */

  const openModal = () => {
    setForm(initialForm);
    setFiles([]);
    setDragging(false);
    setCategoryOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setCategoryOpen(false);
    setModalOpen(false);
  };

  useEffect(() => {
    if (!modalOpen) return undefined;

    subjectRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (categoryOpen) {
          setCategoryOpen(false);
        } else if (!isSaving) {
          setModalOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [modalOpen, categoryOpen, isSaving]);

  useEffect(() => {
    if (!categoryOpen) return undefined;

    const outsideClick = (event) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target)
      ) {
        setCategoryOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      outsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        outsideClick
      );
    };
  }, [categoryOpen]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =========================================
     FILE UPLOAD
  ========================================= */

  const addFiles = (newFiles) => {
    const incoming = Array.from(newFiles || []);

    if (!incoming.length) return;

    if (!incoming.every(validFile)) {
      showNotice(
        'Only PDF, JPG and PNG files are allowed. Maximum size is 3 MB per file.'
      );
      return;
    }

    const unique = incoming.filter(
      (file) =>
        !files.some(
          (saved) =>
            saved.name === file.name &&
            saved.size === file.size &&
            saved.lastModified === file.lastModified
        )
    );

    if (files.length + unique.length > MAX_FILES) {
      showNotice(
        'You can attach up to 5 files per support ticket.'
      );
      return;
    }

    setFiles((current) => [
      ...current,
      ...unique,
    ]);
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);

    // Allows selecting the same file again
    // after removing it.
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles((current) =>
      current.filter((_, position) => position !== index)
    );
  };

  /* =========================================
     SUBMIT SUPPORT TICKET
  ========================================= */

  const submitTicket = async (event) => {
    event.preventDefault();

    if (isSaving) return;

    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!subject || !message) {
      showNotice(
        'Subject and message are required.'
      );
      return;
    }

    if (!configured) {
      showNotice(
        'Support tickets API is not configured yet.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload = new FormData();

      payload.append('subject', subject);

      payload.append(
        'category',
        form.category
          .toLowerCase()
          .replace(/\s+/g, '_')
      );

      payload.append('message', message);

      files.forEach((file) => {
        payload.append('attachments', file);
      });

      const response = await supportTicketsApi.request({
        method: 'POST',
        body: payload,
      });

      const created =
        response?.ticket || response;

      const newId =
        created?.id ||
        created?.ticket_id ||
        created?.uuid;

      if (newId != null) {
        setSelectedId(String(newId));
      }

      setModalOpen(false);
      setForm(initialForm);
      setFiles([]);
      setCategoryOpen(false);

      showNotice(
        'Support ticket submitted successfully.'
      );

      await loadTickets(true);
    } catch (error) {
      showNotice(
        error?.message ||
        'Unable to submit support ticket.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="sp-page">
      {Notice}

      {/* PAGE HEADER */}

      <header className="sp-header">
        <div>
          <h1>Support</h1>
          <p>View and manage your support tickets</p>
        </div>

        <button
          type="button"
          className="sp-primary-button sp-header-new"
          onClick={openModal}
        >
          <Plus size={16} />
          New Ticket
        </button>
      </header>

      {/* API ERROR */}

      {loadError && (
        <div className="sp-api-error" role="status">
          <span>{loadError}</span>

          {configured && (
            <button
              type="button"
              onClick={() => loadTickets()}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* MAIN TWO-COLUMN PANEL */}

      <section className="sp-inbox">
        {/* LEFT SIDEBAR */}

        <aside className="sp-ticket-sidebar">
          <div className="sp-filters">
            <label className="sp-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search tickets..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                aria-label="Search support tickets"
              />
            </label>

            <div className="sp-status-select">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                aria-label="Filter ticket status"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* TICKET LIST */}

          <div className="sp-ticket-list">
            {isLoading ? (
              <div className="sp-loading">
                <LoaderCircle
                  size={23}
                  className="sp-spin"
                />
                <span>Loading tickets...</span>
              </div>
            ) : visibleTickets.length ? (
              visibleTickets.map((ticket) => {
                const index = tickets.indexOf(ticket);
                const id = ticketId(ticket, index);
                const active = selectedId === id;

                return (
                  <button
                    key={id}
                    type="button"
                    className={
                      `sp-ticket-item ${
                        active ? 'active' : ''
                      }`
                    }
                    onClick={() => setSelectedId(id)}
                  >
                    <span className="sp-ticket-item-icon">
                      <LifeBuoy size={17} />
                    </span>

                    <span className="sp-ticket-item-copy">
                      <strong>
                        {ticket.subject || 'Support request'}
                      </strong>

                      <small>
                        {ticket.category || 'General'}
                        {' · '}
                        {prettyStatus(ticket.status)}
                      </small>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="sp-empty-sidebar">
                <LifeBuoy size={32} />

                <h3>
                  {search || status !== 'All statuses'
                    ? 'No matching tickets'
                    : 'No tickets yet'}
                </h3>

                <p>
                  {search || status !== 'All statuses'
                    ? 'Try another search or status filter.'
                    : 'Submit a ticket and our team will get back to you.'}
                </p>

                <button
                  type="button"
                  className="sp-primary-button"
                  onClick={openModal}
                >
                  <Plus size={15} />
                  New Ticket
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT DETAILS AREA */}

        <main className="sp-ticket-content">
          {selectedTicket ? (
            <div className="sp-thread">
              <div className="sp-thread-header">
                <div>
                  <h2>{selectedTicket.subject}</h2>

                  <p>
                    {selectedTicket.category || 'General'}
                    {selectedTicket.created_at && (
                      <>
                        {' · '}
                        {formatTicketDate(
                          selectedTicket.created_at
                        )}
                      </>
                    )}
                  </p>
                </div>

                <span
                  className={
                    `sp-ticket-status ${
                      normalizedStatus(selectedTicket.status)
                    }`.replace(/\s+/g, '-')
                  }
                >
                  {prettyStatus(selectedTicket.status)}
                </span>
              </div>

              <div className="sp-thread-messages">
                <article className="sp-message sp-message-user">
                  <div className="sp-message-title">
                    <strong>Your message</strong>

                    <small>
                      {formatTicketDate(
                        selectedTicket.created_at
                      )}
                    </small>
                  </div>

                  <p>
                    {selectedTicket.message ||
                      selectedTicket.description ||
                      'No message provided.'}
                  </p>
                </article>

                {(
                  Array.isArray(selectedTicket.replies)
                    ? selectedTicket.replies
                    : Array.isArray(selectedTicket.messages)
                      ? selectedTicket.messages
                      : []
                ).map((reply, index) => (
                  <article
                    className="sp-message"
                    key={
                      reply.id ||
                      reply.created_at ||
                      index
                    }
                  >
                    <div className="sp-message-title">
                      <strong>
                        {reply.author_name ||
                          reply.author ||
                          'Support'}
                      </strong>

                      <small>
                        {formatTicketDate(
                          reply.created_at
                        )}
                      </small>
                    </div>

                    <p>
                      {reply.message ||
                        reply.body ||
                        ''}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="sp-empty-preview">
              <LifeBuoy size={39} />

              <h3>Select a ticket</h3>

              <p>
                Choose a ticket from the list
                to view the conversation thread.
              </p>
            </div>
          )}
        </main>
      </section>

      {/* =====================================
          NEW SUPPORT TICKET MODAL
      ===================================== */}

      {modalOpen && (
        <div
          className="sp-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="sp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sp-modal-title"
          >
            {/* MODAL HEADER */}

            <div className="sp-modal-header">
              <h2 id="sp-modal-title">
                New Support Ticket
              </h2>

              <button
                type="button"
                className="sp-close-button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}

            <form
              id="sp-support-form"
              onSubmit={submitTicket}
            >
              <div className="sp-modal-body">
                {/* SUBJECT */}

                <div className="sp-form-group">
                  <label htmlFor="sp-subject">
                    Subject <span>*</span>
                  </label>

                  <input
                    ref={subjectRef}
                    id="sp-subject"
                    type="text"
                    className="sp-control"
                    placeholder="Briefly describe your issue"
                    value={form.subject}
                    onChange={(event) =>
                      updateForm(
                        'subject',
                        event.target.value
                      )
                    }
                    maxLength={150}
                    required
                  />
                </div>

                {/* CATEGORY */}

                <div className="sp-form-group">
                  <label id="sp-category-label">
                    Category
                  </label>

                  <div
                    className="sp-category"
                    ref={categoryRef}
                  >
                    <button
                      type="button"
                      className={
                        `sp-category-trigger ${
                          categoryOpen ? 'open' : ''
                        }`
                      }
                      aria-labelledby="sp-category-label"
                      aria-haspopup="listbox"
                      aria-expanded={categoryOpen}
                      aria-controls="sp-category-options"
                      onClick={() =>
                        setCategoryOpen((current) => !current)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === 'ArrowDown' ||
                          event.key === 'ArrowUp'
                        ) {
                          event.preventDefault();

                          const current =
                            categories.indexOf(form.category);

                          const next =
                            event.key === 'ArrowDown'
                              ? Math.min(current + 1, categories.length - 1)
                              : Math.max(current - 1, 0);

                          updateForm(
                            'category',
                            categories[next]
                          );

                          setCategoryOpen(true);
                        }
                      }}
                    >
                      <span>{form.category}</span>

                      <ChevronDown
                        size={16}
                        className={
                          categoryOpen ? 'rotated' : ''
                        }
                      />
                    </button>

                    {categoryOpen && (
                      <div
                        id="sp-category-options"
                        className="sp-category-menu"
                        role="listbox"
                        aria-labelledby="sp-category-label"
                      >
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            role="option"
                            aria-selected={
                              category === form.category
                            }
                            className={
                              `sp-category-option ${
                                form.category === category
                                  ? 'selected'
                                  : ''
                              }`
                            }
                            onClick={() => {
                              updateForm(
                                'category',
                                category
                              );

                              setCategoryOpen(false);
                            }}
                          >
                            {category}

                            {form.category === category && (
                              <Check size={16} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* MESSAGE */}

                <div className="sp-form-group">
                  <label htmlFor="sp-message">
                    Message <span>*</span>
                  </label>

                  <textarea
                    id="sp-message"
                    className="sp-control sp-textarea"
                    placeholder="Describe your issue in detail..."
                    value={form.message}
                    onChange={(event) =>
                      updateForm(
                        'message',
                        event.target.value
                      )
                    }
                    maxLength={5000}
                    rows={5}
                    required
                  />
                </div>

                {/* ATTACHMENTS */}

                <div className="sp-attachments">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="sp-hidden-file"
                    onChange={handleFileChange}
                    aria-label="Attach support ticket files"
                  />

                  <div
                    className={
                      `sp-upload-area ${
                        dragging ? 'dragging' : ''
                      }`
                    }
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setDragging(false);
                    }}
                    onDrop={handleDrop}
                  >
                    <button
                      type="button"
                      className="sp-upload-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={files.length >= MAX_FILES}
                    >
                      <Paperclip size={16} />
                      Attach files, or drag and drop
                    </button>

                    <span className="sp-file-counter">
                      ({files.length}/{MAX_FILES})
                    </span>
                  </div>

                  <p className="sp-upload-hint">
                    PDF, JPG, PNG, max 3 MB each,
                    up to 5 files
                  </p>

                  {files.length > 0 && (
                    <div className="sp-selected-files">
                      {files.map((file, index) => (
                        <div
                          className="sp-file-item"
                          key={
                            `${file.name}-${file.lastModified}-${index}`
                          }
                        >
                          <Paperclip size={14} />

                          <span title={file.name}>
                            {file.name}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeFile(index)
                            }
                            aria-label={
                              `Remove ${file.name}`
                            }
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MODAL FOOTER */}

              <footer className="sp-modal-footer">
                <button
                  type="submit"
                  className="sp-primary-button"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle
                        size={15}
                        className="sp-spin"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit Ticket
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="sp-cancel-button"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}