
import './CampaignsPage.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Megaphone,
  Search,
  RefreshCw,
} from 'lucide-react';

import { campaignsApi } from '../../../services/dashboard/campaigns.api.js';
import { customersApi } from '../../../services/dashboard/customers.api.js';
import { templatesApi } from '../../../services/dashboard/templates.api.js';

import { useNotice } from '../../../components/dashboard/common/DashboardUI';

const makeEmptyDraft = () => ({
  name: '',
  message_type: 'text',
  message: '',
  template_id: '',
  audience_type: 'all',
  active_days: '30',
  customer_ids: [],
});

function getItems(response, key) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function getId(item) {
  return (
    item?.id ??
    item?.customer_id ??
    item?.campaign_id ??
    item?.template_id
  );
}

function displayDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function statusTone(value) {
  const status = String(value || 'draft').toLowerCase();

  if (
    ['sent', 'completed', 'delivered'].includes(status)
  ) {
    return 'success';
  }

  if (
    ['sending', 'processing', 'scheduled'].includes(status)
  ) {
    return 'pending';
  }

  if (
    ['failed', 'cancelled'].includes(status)
  ) {
    return 'danger';
  }

  return 'neutral';
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(makeEmptyDraft);

  const [searchCustomers, setSearchCustomers] =
    useState('');

  const [loading, setLoading] = useState(true);

  const [customersLoading, setCustomersLoading] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const { showNotice, Notice } = useNotice();

  /* =====================================
     LOAD CAMPAIGNS FROM BACKEND
  ===================================== */

  const loadCampaigns = useCallback(
    async (silent = false) => {
      if (!campaignsApi.isConfigured()) {
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);

      try {
        const response = await campaignsApi.request();

        setCampaigns(
          getItems(response, 'campaigns')
        );

        setLoadError('');
      } catch (error) {
        setLoadError(
          error.message || 'Unable to load campaigns.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCampaigns();

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadCampaigns(true);
      }
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadCampaigns]);

  /* =====================================
     LOAD CUSTOMERS AND TEMPLATES
  ===================================== */

  useEffect(() => {
    if (!editorOpen) return undefined;

    let active = true;

    const loadOptions = async () => {
      setCustomersLoading(true);

      const [customerResult, templateResult] =
        await Promise.allSettled([
          customersApi.isConfigured()
            ? customersApi.request()
            : Promise.resolve([]),

          templatesApi.isConfigured()
            ? templatesApi.request()
            : Promise.resolve([]),
        ]);

      if (!active) return;

      if (customerResult.status === 'fulfilled') {
        setCustomers(
          getItems(customerResult.value, 'customers')
        );
      }

      if (templateResult.status === 'fulfilled') {
        setTemplates(
          getItems(templateResult.value, 'templates')
        );
      }

      setCustomersLoading(false);
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, [editorOpen]);

  const approvedTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          String(template.status || '').toLowerCase() ===
          'approved'
      ),
    [templates]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const term = searchCustomers
          .trim()
          .toLowerCase();

        if (!term) return true;

        return `
          ${customer.name || ''}
          ${customer.full_name || ''}
          ${customer.phone || ''}
        `
          .toLowerCase()
          .includes(term);
      }),
    [customers, searchCustomers]
  );

  /* =====================================
     FORM STATE
  ===================================== */

  const setField = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const openEditor = () => {
    setDraft(makeEmptyDraft());
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;

    setEditorOpen(false);
    setDraft(makeEmptyDraft());
    setSearchCustomers('');
  };

  const toggleCustomer = (customerId, checked) => {
    const id = String(customerId);

    setDraft((current) => ({
      ...current,

      customer_ids: checked
        ? [...new Set([...current.customer_ids, id])]
        : current.customer_ids.filter(
            (value) => value !== id
          ),
    }));
  };

  /* =====================================
     CREATE CAMPAIGN AS DRAFT
  ===================================== */

  const saveDraft = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!campaignsApi.isConfigured()) {
      showNotice(
        'The campaigns API endpoint is not configured. Your draft has not been saved.'
      );
      return;
    }

    if (
      draft.message_type === 'template' &&
      !draft.template_id
    ) {
      showNotice(
        'Please choose an approved message template.'
      );
      return;
    }

    if (
      draft.audience_type === 'specific' &&
      draft.customer_ids.length === 0
    ) {
      showNotice('Choose at least one customer.');
      return;
    }

    const audience =
      draft.audience_type === 'active'
        ? {
            type: 'active_customers',
            last_days: Number(draft.active_days),
          }
        : draft.audience_type === 'specific'
        ? {
            type: 'specific_customers',
            customer_ids: draft.customer_ids,
          }
        : {
            type: 'all_customers',
          };

    const body = {
      name: draft.name.trim(),
      status: 'draft',
      message_type: draft.message_type,
      audience,

      ...(draft.message_type === 'template'
        ? {
            template_id: draft.template_id,
          }
        : {
            message: draft.message.trim(),
          }),
    };

    setSaving(true);

    try {
      await campaignsApi.request({
        method: 'POST',
        body,
      });

      showNotice(
        'Draft saved. This page has not triggered a broadcast.'
      );

      setEditorOpen(false);
      setDraft(makeEmptyDraft());
      setSearchCustomers('');

      await loadCampaigns(true);
    } catch (error) {
      showNotice(
        error.message ||
          'Unable to save the campaign draft.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================
     PAGE
  ===================================== */

  return (
    <div className="cp-page">
      {/* HEADER */}

      <header className="cp-header">
        <div>
          <h1>Campaigns</h1>

          <p>
            Broadcast WhatsApp messages to your
            customer segments.
          </p>
        </div>

        {!editorOpen && (
          <button
            type="button"
            className="cp-primary"
            onClick={openEditor}
          >
            New Campaign
          </button>
        )}
      </header>

      {Notice}

      {loadError && (
        <div className="cp-error" role="alert">
          <span>{loadError}</span>

          <button
            type="button"
            onClick={() => loadCampaigns()}
          >
            Retry
          </button>
        </div>
      )}

      {/* NEW CAMPAIGN INLINE FORM */}

      {editorOpen && (
        <section
          className="cp-editor"
          aria-label="New Campaign"
        >
          <h2>New Campaign</h2>

          <form onSubmit={saveDraft}>
            <div className="cp-form-grid">
              {/* NAME */}

              <label className="cp-field">
                <span>
                  Name <b>*</b>
                </span>

                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={120}
                  placeholder="Summer Sale Announcement"
                  value={draft.name}
                  onChange={(event) =>
                    setField('name', event.target.value)
                  }
                />
              </label>

              {/* MESSAGE TYPE */}

              <label className="cp-field">
                <span>Message Type</span>

                <select
                  value={draft.message_type}
                  onChange={(event) =>
                    setField(
                      'message_type',
                      event.target.value
                    )
                  }
                >
                  <option value="text">
                    Text
                  </option>

                  <option value="template">
                    Approved template
                  </option>
                </select>
              </label>

              {/* TEMPLATE OR MESSAGE */}

              {draft.message_type === 'template' ? (
                <label className="cp-field cp-full">
                  <span>
                    Approved WhatsApp template <b>*</b>
                  </span>

                  <select
                    value={draft.template_id}
                    onChange={(event) =>
                      setField(
                        'template_id',
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select an approved template
                    </option>

                    {approvedTemplates.map(
                      (template) => (
                        <option
                          key={getId(template)}
                          value={getId(template)}
                        >
                          {template.name}
                        </option>
                      )
                    )}
                  </select>

                  {!approvedTemplates.length && (
                    <small>
                      No approved templates are
                      available from your templates API.
                    </small>
                  )}
                </label>
              ) : (
                <label className="cp-field cp-full">
                  <span>
                    Message <b>*</b>
                  </span>

                  <textarea
                    rows={4}
                    required
                    maxLength={4096}
                    placeholder="Hi! We have an exciting offer for you..."
                    value={draft.message}
                    onChange={(event) =>
                      setField(
                        'message',
                        event.target.value
                      )
                    }
                  />
                </label>
              )}

              {/* AUDIENCE */}

              <label className="cp-field cp-audience-field">
                <span>Audience</span>

                <select
                  value={draft.audience_type}
                  onChange={(event) =>
                    setField(
                      'audience_type',
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All contacts
                  </option>

                  <option value="active">
                    Active contacts
                  </option>

                  <option value="specific">
                    Pick specific customers
                  </option>
                </select>
              </label>

              {/* ACTIVE CONTACTS FILTER */}

              {draft.audience_type === 'active' && (
                <label className="cp-field cp-audience-field">
                  <span>Active within last</span>

                  <select
                    value={draft.active_days}
                    onChange={(event) =>
                      setField(
                        'active_days',
                        event.target.value
                      )
                    }
                  >
                    <option value="7">
                      7 days
                    </option>

                    <option value="14">
                      14 days
                    </option>

                    <option value="30">
                      30 days
                    </option>

                    <option value="90">
                      90 days
                    </option>
                  </select>
                </label>
              )}

              {/* SPECIFIC CUSTOMERS */}

              {draft.audience_type === 'specific' && (
                <div className="cp-customer-picker cp-full">
                  <strong>Choose customers</strong>

                  <label className="cp-customer-search">
                    <Search size={15} />

                    <input
                      type="search"
                      placeholder="Search customers..."
                      value={searchCustomers}
                      onChange={(event) =>
                        setSearchCustomers(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <div className="cp-customer-results">
                    {customersLoading ? (
                      <p>Loading customers...</p>
                    ) : filteredCustomers.length ? (
                      filteredCustomers.map(
                        (customer) => {
                          const id = getId(customer);

                          if (id == null) return null;

                          return (
                            <label key={id}>
                              <input
                                type="checkbox"
                                checked={draft.customer_ids.includes(
                                  String(id)
                                )}
                                onChange={(event) =>
                                  toggleCustomer(
                                    id,
                                    event.target.checked
                                  )
                                }
                              />

                              <span>
                                {customer.name ||
                                  customer.full_name ||
                                  customer.phone ||
                                  `Customer ${id}`}
                              </span>
                            </label>
                          );
                        }
                      )
                    ) : (
                      <p>
                        {customersApi.isConfigured()
                          ? 'No matching customers found.'
                          : 'Configure the customers API to select customers.'}
                      </p>
                    )}
                  </div>

                  <small>
                    {draft.customer_ids.length} selected
                  </small>
                </div>
              )}
            </div>

            {/* FORM ACTION BUTTONS */}

            <div className="cp-form-actions">
              <button
                type="submit"
                className="cp-primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Create as Draft'}
              </button>

              <button
                type="button"
                className="cp-secondary"
                disabled={saving}
                onClick={closeEditor}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CAMPAIGN EMPTY STATE OR TABLE */}

      {loading ? (
        <div className="cp-empty">
          <span className="cp-empty-icon">
            <Megaphone size={21} />
          </span>

          <strong>Loading campaigns...</strong>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="cp-empty">
          <span className="cp-empty-icon">
            <Megaphone
              size={21}
              strokeWidth={1.7}
            />
          </span>

          <strong>No campaigns yet</strong>

          <p>
            Create a campaign to broadcast WhatsApp
            <br />
            messages to your contacts.
          </p>

          <button
            type="button"
            className="cp-primary"
            onClick={() => {
              if (!editorOpen) {
                openEditor();
              } else {
                document
                  .querySelector('.cp-editor input')
                  ?.focus();
              }
            }}
          >
            New Campaign
          </button>

          {!campaignsApi.isConfigured() && (
            <small>
              Connect the campaigns API to save drafts.
            </small>
          )}
        </div>
      ) : (
        <section className="cp-campaigns-section">
          <div className="cp-list-top">
            <h2>Campaigns</h2>

            <button
              type="button"
              className="cp-refresh"
              onClick={() => loadCampaigns()}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="cp-table-wrap">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>CAMPAIGN</th>
                  <th>MESSAGE TYPE</th>
                  <th>AUDIENCE</th>
                  <th>STATUS</th>
                  <th>SENT / DELIVERED</th>
                  <th>DATE</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign, index) => (
                  <tr
                    key={
                      getId(campaign) ?? index
                    }
                  >
                    <td>
                      <strong>
                        {campaign.name ||
                          'Unnamed campaign'}
                      </strong>
                    </td>

                    <td>
                      {campaign.template_name ||
                        campaign.message_type ||
                        '—'}
                    </td>

                    <td>
                      {campaign.audience_size ??
                        campaign.audience_count ??
                        campaign.audience?.type?.replaceAll(
                          '_',
                          ' '
                        ) ??
                        '—'}
                    </td>

                    <td>
                      <span
                        className={`cp-status cp-status-${statusTone(
                          campaign.status
                        )}`}
                      >
                        {campaign.status || 'Draft'}
                      </span>
                    </td>

                    <td>
                      {campaign.sent_count ?? '—'} /{' '}
                      {campaign.delivered_count ?? '—'}
                    </td>

                    <td>
                      {displayDate(
                        campaign.created_at ||
                          campaign.scheduled_at
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
