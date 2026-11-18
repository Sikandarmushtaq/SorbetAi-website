import { useCallback, useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Plus, Ticket } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { resourceRequest } from '../../../services/dashboardApi';

const emptyForm = { subject: '', category: 'General', message: '' };
const ticketStatuses = ['All statuses', 'Open', 'In progress', 'Resolved'];

function ticketRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.tickets || [];
}

// Loads saved support tickets and submits new requests with validated optional attachments.
export default function SupportPage() {
  const [status, setStatus] = useState('All statuses');
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { showNotice, Notice } = useNotice();

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await resourceRequest('supportTickets');
      setTickets(ticketRecords(response));
    } catch (error) {
      setTickets([]);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const visible = useMemo(() => tickets.filter((ticket) => status === 'All statuses' || String(ticket.status || 'Open').toLowerCase() === status.toLowerCase()), [tickets, status]);
  const selectedTicket = tickets.find((ticket) => String(ticket.id || ticket.ticket_id) === selectedId) || null;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const chooseFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const accepted = selected.filter((file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) && file.size <= 3 * 1024 * 1024);
    if (selected.length > 5 || accepted.length !== selected.length) {
      showNotice('Choose up to 5 PDF, JPG or PNG files. Each file must be 3 MB or smaller.');
      event.target.value = '';
      return;
    }
    setFiles(accepted);
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('subject', form.subject.trim());
      payload.append('category', form.category.toLowerCase().replaceAll(' ', '_'));
      payload.append('message', form.message.trim());
      files.forEach((file) => payload.append('attachments', file));
      await resourceRequest('supportTickets', { method: 'POST', body: payload });
      setForm(emptyForm);
      setFiles([]);
      setIsOpen(false);
      showNotice('Support ticket submitted.');
      await loadTickets();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="SYSTEM" title="Support" description="View your support requests or send a message to the Bellbee team." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> New support ticket</button>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel>
        <div className="dp-toolbar dp-toolbar-between"><select value={status} onChange={(event) => setStatus(event.target.value)}>{ticketStatuses.map((item) => <option key={item}>{item}</option>)}</select><span className="dp-muted">{visible.length} tickets</span></div>
        {isLoading ? <div className="dp-api-empty-state">Loading support tickets…</div> : loadError ? <div className="dp-api-empty-state"><LifeBuoy size={22} /><strong>Support is ready to connect</strong><p>Connect the support tickets API to load and submit saved requests.</p></div> : (
          <div className="dp-support-grid">
            <div>{visible.length ? <div className="dp-ticket-list">{visible.map((ticket) => {
              const id = String(ticket.id || ticket.ticket_id);
              return <button type="button" key={id} className={`dp-ticket-row ${selectedId === id ? 'active' : ''}`} onClick={() => setSelectedId(id)}><Ticket size={17} /><span><strong>{ticket.subject || 'Support request'}</strong><small>{ticket.category || 'General'} · {ticket.status || 'Open'}</small></span></button>;
            })}</div> : <EmptyState icon={LifeBuoy} title="No tickets yet" description="Submit a ticket and our team will get back to you." buttonText="Submit a ticket" onAction={() => setIsOpen(true)} />}</div>
            <div className="dp-ticket-preview">{selectedTicket ? <><span className={`dp-status-pill ${String(selectedTicket.status).toLowerCase() === 'resolved' ? 'success' : 'warning'}`}>{selectedTicket.status || 'Open'}</span><h3>{selectedTicket.subject}</h3><p>{selectedTicket.message || selectedTicket.description || 'No message content.'}</p><small>{selectedTicket.category || 'General'} · {formatTicketDate(selectedTicket.created_at)}</small>{Array.isArray(selectedTicket.replies) && selectedTicket.replies.map((reply) => <article className="dp-ticket-reply" key={reply.id || reply.created_at}><strong>{reply.author_name || reply.author || 'Support'}</strong><p>{reply.message || reply.body}</p><small>{formatTicketDate(reply.created_at)}</small></article>)}</> : <><LifeBuoy size={26} /><h3>Select a ticket</h3><p>Choose a ticket from the list to view its details and replies.</p></>}</div>
          </div>
        )}
      </Panel>

      {isOpen && <Modal title="New support ticket" description="Tell the Bellbee team how we can help." onClose={() => !isSaving && setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</button><button type="submit" form="support-form" className="dp-primary-button" disabled={isSaving}>{isSaving ? 'Submitting…' : 'Submit ticket'} <Plus size={14} /></button></>}>
        <form id="support-form" className="dp-form-grid" onSubmit={submitTicket}>
          <FormField label="Subject" className="dp-form-full"><FieldInput value={form.subject} onChange={(event) => update('subject', event.target.value)} required maxLength={150} /></FormField>
          <FormField label="Category"><FieldSelect value={form.category} onChange={(event) => update('category', event.target.value)}><option>General</option><option>Billing</option><option>Technical issue</option><option>Feature request</option><option>Account</option></FieldSelect></FormField>
          <FormField label="Attachments" hint="PDF, JPG or PNG · Maximum 3 MB each · Up to 5 files"><FieldInput type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={chooseFiles} /></FormField>
          {files.length > 0 && <p className="dp-form-note dp-form-full">{files.map((file) => file.name).join(', ')}</p>}
          <FormField label="Message" className="dp-form-full"><FieldTextarea rows={5} value={form.message} onChange={(event) => update('message', event.target.value)} required maxLength={5000} /></FormField>
        </form>
      </Modal>}
    </>
  );
}

function formatTicketDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
