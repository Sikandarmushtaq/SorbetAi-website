import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { AdminPageHeader, AdminFeedback, AdminStatus, InfoItem, useAdminResource, formatDate, getName, valueOrDash } from '../../components/admin/AdminUI';
import { unwrapRecord, normalizeRows } from '../../services/admin/adminApi';
import { isAdminPreviewEnabled } from '../../services/admin/adminPreviewData';

const TYPES = {
  businesses: { title: 'Business details', back: '/admin/businesses', key: 'businesses', recordKey: 'business' },
  leads: { title: 'Website lead details', back: '/admin/website-leads', key: 'leads', recordKey: 'lead' },
  conversations: { title: 'Website conversation', back: '/admin/website-conversations', key: 'conversations', recordKey: 'conversation' },
};

export default function AdminRecordPage({ type }) {
  const { recordId } = useParams();
  const meta = TYPES[type];
  const { data, loading, error, reload } = useAdminResource(meta.key, { id: recordId, list: false });
  const record = unwrapRecord(data, meta.recordKey);
  const messages = normalizeRows(record?.messages || [], 'messages');
  const notes = normalizeRows(record?.notes || [], 'notes');
  const isLead = type === 'leads';
  const isConversation = type === 'conversations';
  const person = isConversation ? record?.visitor || record?.lead || record : record;
  const fields = type === 'businesses' ? [
    ['Business name', record?.name || record?.business_name],
    ['Owner', record?.owner?.email || record?.owner_email],
    ['Plan', record?.subscription?.plan?.name || record?.plan?.name || record?.plan_name],
    ['Onboarding', record?.onboarding_status],
    ['Registered', formatDate(record?.created_at)],
    ['Status', record?.status],
  ] : [
    ['Name', getName(person)], ['Email', person?.email], ['Phone', person?.phone],
    ['Source', record?.source || 'Landing chatbot'],
    ['Interest', record?.interest || record?.topic],
    ['Status', record?.status],
    ['Assigned to', record?.assigned_to?.name || record?.assigned_to],
    ['Created', formatDate(record?.started_at || record?.created_at)],
    ['Last activity', formatDate(record?.last_message_at || record?.updated_at)],
  ];

  return <>
    <div className="bb-admin-breadcrumb"><Link to={meta.back}><ArrowLeft size={15}/> Back to {type === 'leads' ? 'Website Leads' : type === 'conversations' ? 'Website Chats' : 'Businesses'}</Link><span>/</span><strong>Details</strong></div>
    <AdminPageHeader title={meta.title} description={isAdminPreviewEnabled ? "Local UI demo with fictional information. No backend request is made." : "Record retrieved from a backend-authorized admin endpoint."}>
      <button type="button" className="bb-admin-btn bb-admin-btn-light" onClick={reload}><RefreshCw size={15}/> Refresh</button>
    </AdminPageHeader>
    <AdminFeedback loading={loading} error={error} onRetry={reload} empty={!record} emptyTitle="Record unavailable" emptyDescription="Check your platform admin API or resource identifier."/>
    {!loading && !error && record && <div className="bb-admin-detail-columns">
      <div><section className="dp-panel bb-admin-panel"><div className="bb-admin-panel-heading"><h2>{isConversation ? 'Visitor & conversation' : isLead ? 'Lead profile' : 'Workspace profile'}</h2><AdminStatus value={record.status}/></div>
        <div className="bb-admin-details-grid">{fields.map(([label, value]) => <InfoItem key={label} label={label} value={value}/>)}</div>
      </section>
      {(isConversation || messages.length > 0) && <section className="dp-panel bb-admin-panel"><div className="bb-admin-panel-heading"><h2>Conversation history</h2></div>
        {messages.length === 0 ? <p className="bb-admin-soft-empty">No messages returned by the admin endpoint.</p> : <div className="bb-admin-message-list">{messages.map((m, i) => <div className={`bb-admin-message ${['user','customer','visitor'].includes(m.sender || m.role) ? 'visitor' : ''}`} key={m.id || i}>
          <small>{valueOrDash(m.sender || m.role)} · {formatDate(m.created_at || m.timestamp)}</small><p>{valueOrDash(m.text || m.content || m.message)}</p>
        </div>)}</div>}
      </section>}
      {notes.length > 0 && <section className="dp-panel bb-admin-panel"><h2>Internal notes</h2>{notes.map((n, i) => <p className="bb-admin-note" key={n.id || i}>{valueOrDash(n.text || n.note || n.content)}</p>)}</section>}
      </div>
      <div><section className="bb-admin-safety"><ShieldCheck size={25}/><strong>Admin privacy boundary</strong><p>Only Bellbee's official landing enquiries belong here. Business-owned customer chats require separate, explicitly authorized support access.</p></section></div>
    </div>}
  </>;
}
