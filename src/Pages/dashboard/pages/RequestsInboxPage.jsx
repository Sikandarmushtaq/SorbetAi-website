import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, MessageSquareText, RefreshCw, Search } from 'lucide-react';
import { PageHeader, Modal, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useAuth } from '../../../context/AuthContext';
import { getCurrentWorkspace } from '../../../services/dashboardApi';
import { requestsApi } from '../../../services/dashboard/requests.api.js';

const STATUS_TABS = [
  ['new', 'New'], ['assigned', 'Assigned'], ['in_progress', 'In progress'],
  ['awaiting_customer', 'Awaiting customer'], ['resolved', 'Resolved'],
  ['closed', 'Closed'], ['cancelled', 'Cancelled'],
];
const statusLabel = (name = '') => STATUS_TABS.find(([value]) => value === name)?.[1] || name.replaceAll('_', ' ');
const listRows = (response) => Array.isArray(response) ? response : (response?.items || []);
const errorMessage = (error) => (error?.errors?.map?.((item) => `${item.field ? `${item.field}: ` : ''}${item.message}`).join(' · ')) || error?.message || 'Request failed.';
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const dateTime = (value) => value ? new Date(value).toLocaleString() : '—';
const errorFields = (failure) => Object.fromEntries((Array.isArray(failure?.errors) ? failure.errors : [])
  .filter((entry) => entry && entry.field && entry.message)
  .map((entry) => [String(entry.field), String(entry.message)]));
const hasFieldError = (fields, field) => fields?.[field] || fields?.[`body.${field}`] || '';


// Assignment API expects a USER UUID belonging to the current workspace,
// not a workspace UUID, staff ID, or membership record UUID.
const assignedUserId = (request) => {
  const assigned = request?.assigned_to;
  if (typeof assigned === 'string') return assigned;
  return assigned?.user_id || assigned?.id || request?.assigned_to_id || '';
};

const memberDisplayName = (person) => {
  if (!person) return 'Team member';
  const name = person.full_name || person.name || person.display_name ||
    [person.first_name, person.last_name].filter(Boolean).join(' ') || person.email;
  return name || 'Team member';
};

export default function RequestsInboxPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { Notice, showNotice } = useNotice();
  const [workspaceRole, setWorkspaceRole] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const role = String(workspaceRole || user?.workspace_role || user?.role || '').toLowerCase();
  const isManager = ['owner', 'admin'].includes(role);
  const [status, setStatus] = useState('new');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [assignee, setAssignee] = useState('');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsCursor, setEventsCursor] = useState(null);
  const [draft, setDraft] = useState({});
  const [note, setNote] = useState('');
  const summaryRef = useRef(null);
  const detailFetchVersion = useRef(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [transitionDialog, setTransitionDialog] = useState(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionError, setTransitionError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentWorkspace().then((ws) => {
      if (!active) return;
      setWorkspaceRole(ws?.my_role || ws?.workspace?.my_role || ws?.role || '');
      // Some deployments include members in /workspaces/current; this is optional.
      // We never guess a new members endpoint or use AI Brain staff as assignees.
      const members = ws?.members || ws?.workspace?.members;
      setWorkspaceMembers(Array.isArray(members) ? members : []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const memberOptions = useMemo(() => {
    const options = new Map();
    const myId = String(user?.id || '');
    if (isUuid(myId)) {
      const name = memberDisplayName(user);
      const myRole = workspaceRole || user?.workspace_role || user?.role || '';
      options.set(myId, {
        id: myId,
        label: `${name} (You${myRole ? ` · ${myRole}` : ''})`,
      });
    }
    workspaceMembers.forEach((membership) => {
      if (membership?.is_active === false || ['removed', 'inactive', 'invited', 'pending'].includes(String(membership?.status || '').toLowerCase())) return;
      const person = membership?.user || membership;
      // Membership row 'id' may NOT be a user ID; use user_id or user.id only.
      const userId = String(membership?.user_id || membership?.user?.id || '');
      if (!isUuid(userId) || options.has(userId)) return;
      options.set(userId, {
        id: userId,
        label: `${memberDisplayName(person)}${membership?.role ? ` (${membership.role})` : ''}`,
      });
    });
    return [...options.values()];
  }, [user, workspaceRole, workspaceMembers]);
  useEffect(() => { const id = setTimeout(() => setQuery(q.trim()), 300); return () => clearTimeout(id); }, [q]);

  const reloadList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await requestsApi.list({ status, q: query, assignee: assignee || undefined, limit: 25 });
      setItems(listRows(result));
      setCursor(result?.next_cursor || null);
      setError('');
      return true;
    } catch (failure) { setError(errorMessage(failure)); return false; }
    finally { setLoading(false); }
  }, [status, query, assignee]);

  const reloadSummary = useCallback(async () => {
    const result = await requestsApi.summary();
    const last = summaryRef.current;
    summaryRef.current = result;
    setSummary(result);
    if (last && JSON.stringify(last?.by_status) !== JSON.stringify(result?.by_status)) return true;
    return false;
  }, []);

  useEffect(() => { reloadList(); }, [reloadList]);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try { const changed = await reloadSummary(); if (alive && changed) await reloadList(); }
      catch (failure) { if (alive) setError(errorMessage(failure)); }
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, [reloadSummary, reloadList]);

  const openDetail = useCallback(async (id) => {
    const fetchVersion = ++detailFetchVersion.current;
    if (!id) { setDetail(null); return null; }
    try {
      const [requestData, timelineData] = await Promise.all([
        requestsApi.get(id), requestsApi.events(id, { limit: 50 }),
      ]);
      // Discard stale responses after selecting another request.
      if (fetchVersion !== detailFetchVersion.current) return null;
      const request = requestData?.request || requestData;
      if (!request?.id) throw new Error('The server did not return request details.');
      setDetail(request);
      setEvents(listRows(timelineData));
      setEventsCursor(timelineData?.next_cursor || null);
      setDraft({
        priority: request.priority || 'normal', summary: request.summary || '',
        assigned_to_id: assignedUserId(request),
        fields: Object.fromEntries((request.fields || []).map((field) => [field.key, field.value ?? ''])),
      });
      setFieldErrors({});
      setError('');
      return request;
    } catch (failure) {
      if (fetchVersion !== detailFetchVersion.current) return null;
      setError(errorMessage(failure));
      if (failure?.status === 404) {
        setDetail(null);
        navigate('/dashboard/requests', { replace: true });
      }
      return null;
    }
  }, [navigate]);

  useEffect(() => { if (requestId) openDetail(requestId); else setDetail(null); }, [requestId, openDetail]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await requestsApi.list({ status, q: query, assignee: assignee || undefined, limit: 25, cursor });
      setItems((old) => {
        const map = new Map(old.map((item) => [item.id, item]));
        listRows(response).forEach((item) => map.set(item.id, item));
        return [...map.values()];
      });
      setCursor(response?.next_cursor || null);
    } catch (failure) { showNotice(errorMessage(failure), 'error'); }
    finally { setLoadingMore(false); }
  };

  const reloadAll = async () => {
    await Promise.all([reloadList(), reloadSummary()]);
    if (requestId) await openDetail(requestId);
  };
  const afterChange = async (updated, requestIdToReload) => {
    // Immediately reflect the server-confirmed result while reloading.
    const entity = updated?.request || updated;
    if (entity?.id === requestIdToReload && entity?.status) {
      setDetail((old) => old?.id === entity.id ? { ...old, ...entity } : old);
      setItems((old) => old.map((item) => item.id === entity.id ? { ...item, ...entity } : item));
    }
    const fresh = await openDetail(requestIdToReload);
    // Request moved to another status: open its correct inbox tab without a browser reload.
    if (fresh?.status && fresh.status !== status) {
      setStatus(fresh.status);
      // A filter for the previous tab should not hide the newly updated request.
      setAssignee('');
      setQ('');
    }
    const results = await Promise.allSettled([
      reloadSummary(),
      fresh?.status && fresh.status !== status ? Promise.resolve() : reloadList(),
    ]);
    const failed = results.find((item) => item.status === 'rejected' || item.value === false);
    if (!fresh || failed) {
      showNotice('Change saved, but the inbox could not fully refresh. Use Refresh to retry.', 'warning');
    }
  };

  const withMutation = async (perform, success, { fromDialog = false } = {}) => {
    if (!detail || busy) return false;
    const currentId = detail.id;
    setBusy(true);
    setFieldErrors({});
    if (fromDialog) setTransitionError('');
    try {
      const updated = await perform();
      if (fromDialog) {
        setTransitionDialog(null);
        setTransitionReason('');
      }
      showNotice(success, 'success');
      try { await afterChange(updated, currentId); }
      catch (refreshFailure) {
        showNotice(`Change saved, but reload failed: ${errorMessage(refreshFailure)}`, 'warning');
      }
      return true;
    } catch (failure) {
      const stale = failure?.code === 'REQUEST_409_STALE' || failure?.code === 'REQUEST_409_TRANSITION';
      if (stale) {
        await openDetail(currentId);
        const message = 'This request changed on the server. Latest details loaded; check them and retry.';
        if (fromDialog) {
          // Old transition permissions/version are invalid. User must reselect a permitted action.
          setTransitionDialog(null);
          setTransitionReason('');
        }
        setError(message);
        showNotice(message, 'error');
      } else {
        const message = errorMessage(failure);
        if (fromDialog) setTransitionError(message);
        else setFieldErrors(errorFields(failure));
        showNotice(message, 'error');
      }
      return false;
    } finally { setBusy(false); }
  };

  const saveDetails = () => {
    if (!detail || !isManager || busy) return;
    const memberId = String(draft.assigned_to_id || '').trim();
    if (memberId && !isUuid(memberId)) { showNotice('The selected member ID is invalid. Refresh and try again.', 'error'); return; }
    // Send only changed fields: untouched confirmed customer details remain intact.
    const body = { expected_version: detail.version };
    const originalAssignee = assignedUserId(detail);
    if (memberId !== originalAssignee && memberId && !memberOptions.some((member) => member.id === memberId)) {
      showNotice('Choose an available workspace member from the list.', 'error');
      return;
    }
    if (memberId !== originalAssignee) body.assigned_to_id = memberId || null;
    if (draft.priority !== detail.priority) body.priority = draft.priority;
    if (draft.summary.trim() !== (detail.summary || '')) body.summary = draft.summary.trim();
    const changedFields = Object.fromEntries((detail.fields || [])
      .filter((field) => String(draft.fields?.[field.key] ?? '') !== String(field.value ?? ''))
      .map((field) => [field.key, String(draft.fields[field.key])]));
    if (Object.keys(changedFields).length) body.fields = changedFields;
    if (Object.keys(body).length === 1) { showNotice('No changes to save.'); return; }
    withMutation(() => requestsApi.update(detail.id, body), 'Request updated.');
  };

  const addNote = () => {
    const text = note.trim();
    if (!detail || !text || text.length > 2000) return;
    withMutation(async () => {
      const result = await requestsApi.addNote(detail.id, text);
      setNote('');
      return result;
    }, 'Private note saved.');
  };

  const changeStatus = (next) => {
    if (!detail || busy || !(detail.allowed_transitions || []).some((entry) =>
      (typeof entry === 'string' ? entry : entry.to_status || entry.status) === next)) return;
    setTransitionDialog({ from: detail.status, to: next });
    setTransitionReason('');
    setTransitionError('');
  };

  const closeTransitionDialog = () => {
    if (busy) return;
    setTransitionDialog(null);
    setTransitionReason('');
    setTransitionError('');
  };

  const submitTransition = () => {
    if (!transitionDialog || !detail || busy) return;
    const reason = transitionReason.trim();
    if (transitionDialog.to === 'cancelled' && !reason) {
      setTransitionError('A cancellation reason is required.');
      return;
    }
    const needsReasonField = transitionDialog.to === 'cancelled'
      || transitionDialog.to === 'resolved'
      || (transitionDialog.from === 'resolved' && transitionDialog.to === 'in_progress');
    const maxLength = transitionDialog.to === 'resolved' ? 2000 : 500;
    if (reason.length > maxLength) {
      setTransitionError(`Reason must be ${maxLength} characters or fewer.`);
      return;
    }
    const toStatus = transitionDialog.to;
    withMutation(() => requestsApi.transition(detail.id, {
      expected_version: detail.version,
      to_status: toStatus,
      ...(needsReasonField && reason ? { reason } : {}),
    }), `Request moved to ${statusLabel(toStatus)}.`, { fromDialog: true });
  };

  const fetchMoreEvents = async () => {
    if (!eventsCursor || !detail || busy) return;
    try {
      const response = await requestsApi.events(detail.id, { cursor: eventsCursor, limit: 50 });
      setEvents((old) => [...old, ...listRows(response)]);
      setEventsCursor(response?.next_cursor || null);
    } catch (failure) { showNotice(errorMessage(failure), 'error'); }
  };

  const transitions = useMemo(() => (detail?.allowed_transitions || []).map((entry) => typeof entry === 'string' ? entry : entry.to_status || entry.status).filter(Boolean), [detail]);
  const total = summary?.by_status || {};

  return (
    <main className="kr-inbox">
      <PageHeader title="Requests Inbox" description="Customer-confirmed requests saved by your AI. Test AI previews never appear here."
        actions={<button type="button" className="kr-secondary" onClick={reloadAll} disabled={loading || busy}><RefreshCw size={16} /> Refresh</button>} />
      {Notice}
      {error && <div role="alert" className="kr-error">{error}</div>}
      <div className="kr-summary">
        <div><strong>{summary?.open ?? '—'}</strong><span>Open</span></div>
        <div><strong>{summary?.mine ?? '—'}</strong><span>Mine</span></div>
        {isManager && <div><strong>{summary?.unassigned ?? '—'}</strong><span>Unassigned</span></div>}
        <div><strong>{summary?.total ?? '—'}</strong><span>All requests</span></div>
      </div>
      <div className="kr-status-tabs" role="tablist" aria-label="Filter requests by status">
        {STATUS_TABS.map(([value, title]) => <button key={value} type="button" role="tab" aria-selected={status === value}
          className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{title} <span>{total[value] ?? 0}</span></button>)}
      </div>
      <div className="kr-tools kr-filters">
        <label className="kr-search"><Search size={16}/><input type="search" maxLength={100} value={q} placeholder="Search reference, name or contact" onChange={(e) => setQ(e.target.value)} /></label>
        <select aria-label="Assignee filter" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">All accessible requests</option><option value="me">Assigned to me</option>{isManager && <option value="unassigned">Unassigned</option>}
        </select>
      </div>
      <div className="kr-workspace">
        <section className="kr-list" aria-label="Customer requests">
          {loading && <p className="kr-muted">Loading…</p>}
          {!loading && !items.length && <p className="kr-muted">No requests in this view.</p>}
          {items.map((item) => <button type="button" key={item.id} disabled={busy} onClick={() => navigate(`/dashboard/requests/${item.id}`)}
            className={`kr-request-row ${item.id === requestId ? 'selected' : ''}`}>
            <span className="kr-row-top"><strong>{item.reference || 'Request'}</strong><span className="kr-chip">{statusLabel(item.status)}</span></span>
            <span>{item.customer_name || 'Unknown customer'} · {item.request_type?.name || 'Request'}</span>
            <small>{item.summary || 'No summary'} · {dateTime(item.created_at)}</small>
          </button>)}
          {cursor && <button type="button" className="kr-secondary kr-load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</button>}
        </section>
        <section className="kr-detail" aria-label="Request detail">
          {!requestId && <div className="kr-empty"><MessageSquareText size={30}/><strong>Select a customer request</strong><span>View confirmed fields, internal notes and event history.</span></div>}
          {requestId && !detail && <p className="kr-muted">Loading request…</p>}
          {detail && <>
            <div className="kr-toolbar"><div><button type="button" className="kr-text" onClick={() => navigate('/dashboard/requests')}><ArrowLeft size={14}/> Back</button><h2>{detail.reference || 'Request'} <span className="kr-chip">{statusLabel(detail.status)}</span></h2><p className="kr-muted">{detail.request_type?.name || 'Customer request'} · {dateTime(detail.created_at)}</p></div><CheckCircle2 className="kr-check" size={22}/></div>
            <p>{detail.summary || 'No summary.'}</p>
            <p className="kr-muted">Customer: {detail.customer_name || '—'} · Contact: {detail.customer_contact || '—'} · Channel: {detail.source_channel || '—'}</p>
            {detail.next_step_text && <p><b>Customer was told:</b> {detail.next_step_text}</p>}
            <h3>Confirmed details</h3>
            {(detail.fields || []).map((field) => <label key={field.key} className="kr-label">{field.label || field.key}
              <input value={draft.fields?.[field.key] ?? ''} disabled={!isManager || busy}
                onChange={(e) => setDraft((d) => ({...d, fields: {...d.fields, [field.key]: e.target.value}}))} />
              {hasFieldError(fieldErrors, `fields.${field.key}`) && <small role="alert" className="kr-error">{hasFieldError(fieldErrors, `fields.${field.key}`)}</small>}</label>)}
            {isManager && <>
              <h3>Manage request</h3>
              <div className="kr-edit-grid">
                <label className="kr-label">Priority <select value={draft.priority || 'normal'} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>{hasFieldError(fieldErrors, 'priority') && <small className="kr-error" role="alert">{hasFieldError(fieldErrors, 'priority')}</small>}</label>
                <label className="kr-label">Assign to
                  <select
                    aria-label="Assign request to team member"
                    value={draft.assigned_to_id || ''}
                    disabled={busy}
                    onChange={(e) => setDraft((d) => ({ ...d, assigned_to_id: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {memberOptions.map((member) => (
                      <option key={member.id} value={member.id}>{member.label}</option>
                    ))}
                    {draft.assigned_to_id && !memberOptions.some((member) => member.id === draft.assigned_to_id) && (
                      <option value={draft.assigned_to_id}>
                        Current assignee ({detail.assigned_to?.name || detail.assigned_to?.full_name || 'not listed'})
                      </option>
                    )}
                  </select>
                  {hasFieldError(fieldErrors, 'assigned_to_id') && <small className="kr-error" role="alert">{hasFieldError(fieldErrors, 'assigned_to_id')}</small>}
                </label>
              </div>
              <label className="kr-label">Summary <textarea rows={2} maxLength={2000} value={draft.summary || ''} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}/></label>
              {hasFieldError(fieldErrors, 'summary') && <small className="kr-error" role="alert">{hasFieldError(fieldErrors, 'summary')}</small>}
              <button type="button" className="kr-primary" onClick={saveDetails} disabled={busy}>{busy ? 'Saving…' : 'Save request updates'}</button>
            </>}
            {!!transitions.length && <><h3>Allowed next actions</h3><div className="kr-tools">{transitions.map((next) => <button type="button" key={next} className="kr-secondary" disabled={busy} onClick={() => changeStatus(next)}>{statusLabel(next)}</button>)}</div></>}
            <h3>Private team notes</h3>
            <textarea rows={3} value={note} maxLength={2000} placeholder="Only your team can see these notes" onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="kr-secondary" disabled={busy || !note.trim()} onClick={addNote}>Add internal note</button>
            {Array.isArray(detail.source_excerpt) && detail.source_excerpt.length > 0 && <details><summary>Customer conversation excerpt</summary>{detail.source_excerpt.map((entry, index) => <p key={index}><strong>{entry.role}:</strong> {entry.text}</p>)}</details>}
            <h3><Clock3 size={15}/> Activity timeline</h3>
            <div className="kr-timeline">{events.map((entry) => <article key={entry.id}><strong>{(entry.action || 'Event').replaceAll('_', ' ')}</strong><small>{dateTime(entry.created_at)}</small>{entry.payload?.text && <p>{entry.payload.text}</p>}{entry.payload?.reason && <p>{entry.payload.reason}</p>}</article>)}{!events.length && <p className="kr-muted">No activity yet.</p>}</div>
            {eventsCursor && <button type="button" className="kr-secondary" onClick={fetchMoreEvents}>Load earlier events</button>}
          </>}
        </section>
      </div>
      {transitionDialog && (
        <Modal
          title={`Move request to ${statusLabel(transitionDialog.to)}`}
          description={`${detail?.reference || 'Request'} — confirm this status change.`}
          onClose={closeTransitionDialog}
          error={transitionError}
          footer={<>
            <button type="button" className="kr-secondary" onClick={closeTransitionDialog} disabled={busy}>Go back</button>
            <button type="button" className="kr-primary" onClick={submitTransition} disabled={busy}>
              {busy ? 'Saving…' : `Confirm ${statusLabel(transitionDialog.to)}`}
            </button>
          </>}
        >
          {transitionDialog.to === 'cancelled' ? (
            <p>This will cancel the request. Add a reason for the team timeline.</p>
          ) : transitionDialog.to === 'resolved' ? (
            <p>Mark as resolved only after the team has completed the customer’s request.</p>
          ) : (
            <p>Only the permitted status change will be sent. The backend will validate your permissions.</p>
          )}
          {(transitionDialog.to === 'cancelled'
            || transitionDialog.to === 'resolved'
            || (transitionDialog.from === 'resolved' && transitionDialog.to === 'in_progress')) && (
            <label className="dp-form-field">
              <span>{transitionDialog.to === 'cancelled' ? 'Cancellation reason (required)' : 'Resolution / reopening note (optional)'}</span>
              <textarea
                className="dp-field-control dp-field-textarea"
                rows={4}
                maxLength={transitionDialog.to === 'resolved' ? 2000 : 500}
                value={transitionReason}
                disabled={busy}
                placeholder={transitionDialog.to === 'cancelled' ? 'Why is this request being cancelled?' : 'Describe the action taken for the customer…'}
                onChange={(event) => { setTransitionReason(event.target.value); setTransitionError(''); }}
              />
            </label>
          )}
        </Modal>
      )}
    </main>
  );
}
