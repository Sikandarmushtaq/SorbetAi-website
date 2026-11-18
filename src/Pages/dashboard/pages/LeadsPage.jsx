import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, MoreHorizontal, Target } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const leadTabs = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'In progress', value: 'in-progress' },
];

function listFrom(response, key) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.[key] || [];
}

// Loads lead request types and customer enquiries from the configured dashboard API.
export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotice, Notice } = useNotice();
  const requestedStatus = searchParams.get('status') || 'new';
  const activeStatus = leadTabs.some((tab) => tab.value === requestedStatus) ? requestedStatus : 'new';
  const [requestTypes, setRequestTypes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isResourceConfigured('requestTypes')) {
      setTypesLoaded(true);
      return () => { active = false; };
    }
    setTypesLoaded(false);
    resourceRequest('requestTypes')
      .then((response) => { if (active) setRequestTypes(listFrom(response, 'request_types')); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setTypesLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadError('');
    setLeadsLoaded(false);
    setLeads([]);
    if (!isResourceConfigured('leads')) {
      setLeadsLoaded(true);
      return () => { active = false; };
    }
    resourceRequest('leads', { query: { status: activeStatus } })
      .then((response) => { if (active) setLeads(listFrom(response, 'leads')); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLeadsLoaded(true); });
    return () => { active = false; };
  }, [activeStatus]);

  const visibleLeads = useMemo(() => leads.filter((lead) => (lead.status || 'new') === activeStatus), [leads, activeStatus]);

  const selectTab = (label) => {
    const next = leadTabs.find((tab) => tab.label === label)?.value || 'new';
    const params = new URLSearchParams(searchParams);
    if (next === 'new') params.delete('status');
    else params.set('status', next);
    setSearchParams(params, { replace: true });
  };

  const updateStatus = async (lead, status) => {
    const id = lead.id || lead.lead_id;
    try {
      await resourceRequest('leads', { method: 'PATCH', id, body: { status } });
      setLeads((current) => current.map((item) => String(item.id || item.lead_id) === String(id) ? { ...item, status } : item));
      showNotice(`Lead moved to ${leadTabs.find((tab) => tab.value === status)?.label || status}.`);
    } catch (error) {
      showNotice(error.message);
    }
  };

  const tabLabel = leadTabs.find((tab) => tab.value === activeStatus)?.label || 'New';
  const needsSetup = isResourceConfigured('requestTypes') && typesLoaded && requestTypes.length === 0 && !loadError;
  const apisMissing = !isResourceConfigured('requestTypes') || !isResourceConfigured('leads');

  return (
    <>
      <PageHeader title="Leads" description="Enquiries your AI collected for you to follow up" />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel className="dp-leads-panel">
        <Tabs items={leadTabs.map((tab) => tab.label)} active={tabLabel} onChange={selectTab} />
        {needsSetup ? (
          <EmptyState
            icon={Target}
            title="Tell your AI what to collect"
            description="Set up the kinds of enquiry you follow up personally. Your AI collects the details and adds a lead here."
            buttonText="Set up requests"
            onAction={() => navigate('/dashboard/brain?tab=requests')}
          />
        ) : apisMissing ? (
          <div className="dp-api-empty-state"><Target size={22} /><strong>Leads are ready to connect</strong><p>Connect the request types and leads API endpoints to load the enquiries collected by your AI.</p><button type="button" className="dp-text-button" onClick={() => navigate('/dashboard/brain?tab=requests')}>Open AI Brain Requests <ArrowRight size={14} /></button></div>
        ) : leadsLoaded && visibleLeads.length === 0 ? (
          <EmptyState icon={Target} title="No leads here yet" description={`No ${tabLabel.toLowerCase()} enquiries are available.`} />
        ) : !leadsLoaded ? (
          <div className="dp-api-empty-state">Loading leads…</div>
        ) : (
          <div className="dp-leads-list">
            <div className="dp-leads-table-head"><span>Customer</span><span>Enquiry type</span><span>Collected details</span><span>Date</span><span>Actions</span></div>
            {visibleLeads.map((lead) => (
              <article className="dp-lead-row" key={lead.id || lead.lead_id}>
                <div><strong>{lead.customer_name || lead.name || 'Customer'}</strong><small>{lead.phone || lead.email || ''}</small></div>
                <span>{lead.request_type_name || lead.request_type || '—'}</span>
                <span className="dp-lead-details">{formatDetails(lead.collected_details || lead.details)}</span>
                <time>{formatLeadDate(lead.created_at || lead.date)}</time>
                <div className="dp-lead-actions">
                  <select aria-label="Update lead status" value={lead.status || 'new'} onChange={(event) => updateStatus(lead, event.target.value)}>
                    {leadTabs.map((tab) => <option key={tab.value} value={tab.value}>{tab.label}</option>)}
                  </select>
                  {activeStatus !== 'contacted' && <button type="button" className="dp-icon-action" aria-label="Mark contacted" onClick={() => updateStatus(lead, 'contacted')}><Check size={14} /></button>}
                  <button type="button" className="dp-icon-action" aria-label="More lead actions" onClick={() => showNotice('Choose a status from the dropdown to move this lead.')}><MoreHorizontal size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function formatDetails(value) {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  return Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(' · ');
}

function formatLeadDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
