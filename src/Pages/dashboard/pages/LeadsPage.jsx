
import { leadsApi } from '../../../services/dashboard/leads.api.js';
import { requestTypesApi } from '../../../services/dashboard/request-types.api.js';
import './LeadsPage.css';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, MoreHorizontal, Plus, Target } from 'lucide-react';

import {
  EmptyState,
  PageHeader,
  Panel,
  Tabs,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

const leadTabs = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'In progress', value: 'in-progress' },
];

function listFrom(response, key) {
  if (Array.isArray(response)) return response;

  const value =
    response?.items ||
    response?.results ||
    response?.[key] ||
    [];

  return Array.isArray(value) ? value : [];
}

function formatDetails(value) {
  if (!value) return '—';
  if (typeof value === 'string') return value;

  return Object.entries(value)
    .map(([key, item]) => `${key}: ${item}`)
    .join(' · ');
}

function formatLeadDate(value) {
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

export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotice, Notice } = useNotice();

  const requestedStatus = searchParams.get('status') || 'new';

  const activeStatus = leadTabs.some(
    (tab) => tab.value === requestedStatus
  )
    ? requestedStatus
    : 'new';

  const [requestTypes, setRequestTypes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Same destination for the button on every tab.
  const openSetupRequests = () => {
    navigate('/dashboard/brain?tab=requests');
  };

  useEffect(() => {
    let active = true;

    if (!requestTypesApi.isConfigured()) {
      setTypesLoaded(true);
      return () => {
        active = false;
      };
    }

    setTypesLoaded(false);

    requestTypesApi.request()
      .then((response) => {
        if (active) {
          setRequestTypes(listFrom(response, 'request_types'));
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setTypesLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setLoadError('');
    setLeadsLoaded(false);
    setLeads([]);

    if (!leadsApi.isConfigured()) {
      setLeadsLoaded(true);
      return () => {
        active = false;
      };
    }

    leadsApi.request({
      query: { status: activeStatus },
    })
      .then((response) => {
        if (active) {
          setLeads(listFrom(response, 'leads'));
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLeadsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [activeStatus]);

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const status = String(lead.status || 'new')
        .toLowerCase()
        .replaceAll('_', '-')
        .replaceAll(' ', '-');

      return status === activeStatus;
    });
  }, [leads, activeStatus]);

  const selectTab = (label) => {
    const next =
      leadTabs.find((tab) => tab.label === label)?.value || 'new';

    const params = new URLSearchParams(searchParams);

    if (next === 'new') {
      params.delete('status');
    } else {
      params.set('status', next);
    }

    setSearchParams(params, { replace: true });
  };

  const updateStatus = async (lead, status) => {
    const id = lead.id || lead.lead_id;

    try {
      await leadsApi.request({
        method: 'PATCH',
        id,
        body: { status },
      });

      setLeads((current) =>
        current.map((item) =>
          String(item.id || item.lead_id) === String(id)
            ? { ...item, status }
            : item
        )
      );

      showNotice(
        `Lead moved to ${
          leadTabs.find((tab) => tab.value === status)?.label || status
        }.`
      );
    } catch (error) {
      showNotice(error.message);
    }
  };

  const tabLabel =
    leadTabs.find((tab) => tab.value === activeStatus)?.label || 'New';

  const needsSetup =
    requestTypesApi.isConfigured() &&
    typesLoaded &&
    requestTypes.length === 0 &&
    !loadError;

  const apisMissing =
    !requestTypesApi.isConfigured() ||
    !leadsApi.isConfigured();

  return (
    <>
      <PageHeader
        title="Leads"
        description="Enquiries your AI collected for you to follow up"
        actions={
          <button
            type="button"
            className="dp-primary-button"
            onClick={openSetupRequests}
          >
            <Plus size={15} />
            Set up requests
          </button>
        }
      />

      {Notice}

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error"
          role="status"
        >
          {loadError}
        </div>
      )}

      <Panel className="dp-leads-panel">
        <Tabs
          items={leadTabs.map((tab) => tab.label)}
          active={tabLabel}
          onChange={selectTab}
        />

        {needsSetup ? (
          <EmptyState
            icon={Target}
            title="Tell your AI what to collect"
            description="Set up the kinds of enquiry you follow up personally. Your AI collects the details and adds a lead here."
            buttonText="Set up requests"
            onAction={openSetupRequests}
          />
        ) : apisMissing ? (
          <div className="dp-api-empty-state">
            <Target size={22} />

            <strong>Tell your AI what to collect</strong>

            <p>
              Set up the kinds of enquiry you follow up
              personally. Your AI collects the details
              and adds a lead here.
            </p>

            <button
              type="button"
              className="dp-primary-button"
              onClick={openSetupRequests}
            >
              <Plus size={15} />
              Set up requests
            </button>
          </div>
        ) : !leadsLoaded ? (
          <div className="dp-api-empty-state">
            Loading leads…
          </div>
        ) : visibleLeads.length === 0 ? (
          <EmptyState
            icon={Target}
            title={
              requestTypes.length === 0
                ? 'Tell your AI what to collect'
                : 'No leads here yet'
            }
            description={
              requestTypes.length === 0
                ? 'Set up the kinds of enquiry you follow up personally. Your AI collects the details and adds a lead here.'
                : `No ${tabLabel.toLowerCase()} enquiries are available. You can manage the enquiry types your AI collects.`
            }
            buttonText="Set up requests"
            onAction={openSetupRequests}
          />
        ) : (
          <div className="dp-leads-list">
            <div className="dp-leads-table-head">
              <span>Customer</span>
              <span>Enquiry type</span>
              <span>Collected details</span>
              <span>Date</span>
              <span>Actions</span>
            </div>

            {visibleLeads.map((lead) => (
              <article
                className="dp-lead-row"
                key={lead.id || lead.lead_id}
              >
                <div>
                  <strong>
                    {lead.customer_name || lead.name || 'Customer'}
                  </strong>

                  <small>
                    {lead.phone || lead.email || ''}
                  </small>
                </div>

                <span>
                  {lead.request_type_name ||
                    lead.request_type ||
                    '—'}
                </span>

                <span className="dp-lead-details">
                  {formatDetails(
                    lead.collected_details || lead.details
                  )}
                </span>

                <time>
                  {formatLeadDate(
                    lead.created_at || lead.date
                  )}
                </time>

                <div className="dp-lead-actions">
                  <select
                    aria-label="Update lead status"
                    value={lead.status || 'new'}
                    onChange={(event) =>
                      updateStatus(lead, event.target.value)
                    }
                  >
                    {leadTabs.map((tab) => (
                      <option
                        key={tab.value}
                        value={tab.value}
                      >
                        {tab.label}
                      </option>
                    ))}
                  </select>

                  {activeStatus !== 'contacted' && (
                    <button
                      type="button"
                      className="dp-icon-action"
                      aria-label="Mark contacted"
                      onClick={() =>
                        updateStatus(lead, 'contacted')
                      }
                    >
                      <Check size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="dp-icon-action"
                    aria-label="More lead actions"
                    onClick={() =>
                      showNotice(
                        'Choose a status from the dropdown to move this lead.'
                      )
                    }
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
