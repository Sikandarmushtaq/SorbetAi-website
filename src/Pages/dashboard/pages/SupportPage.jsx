import { useState } from 'react';
import { LifeBuoy, Plus, Ticket } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';

// Creates local support-ticket entries while keeping attachment submission clearly marked as pending integration.
export default function SupportPage() {
  const [status, setStatus] = useState('All statuses');
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', category: 'General', message: '' });
  const { showNotice, Notice } = useNotice();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const ticket = { ...form, id: Date.now(), status: 'Open' };
    setTickets((current) => [ticket, ...current]);
    setSelectedTicket(ticket);
    setForm({ subject: '', category: 'General', message: '' });
    setIsOpen(false);
    showNotice('Support ticket added to this local preview.');
  };
  const visible = tickets.filter((ticket) => status === 'All statuses' || ticket.status === status);
  return <>
    <PageHeader eyebrow="SYSTEM" title="Support" description="View your support requests or send a message to the Bellbee team." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> New support ticket</button>} />
    {Notice}
    <Panel><div className="dp-toolbar"><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Open</option><option>In progress</option><option>Resolved</option></select></div>
      <div className="dp-support-grid"><div>{visible.length ? <div className="dp-ticket-list">{visible.map((ticket) => <button type="button" key={ticket.id} className={`dp-ticket-row ${selectedTicket?.id === ticket.id ? 'active' : ''}`} onClick={() => setSelectedTicket(ticket)}><Ticket size={17} /><span><strong>{ticket.subject}</strong><small>{ticket.category} · {ticket.status}</small></span></button>)}</div> : <EmptyState icon={LifeBuoy} title="No tickets yet" description="Submit a ticket and our team will get back to you." buttonText="Submit a ticket" onAction={() => setIsOpen(true)} />}</div>
        <div className="dp-ticket-preview">{selectedTicket ? <><span className="dp-status-pill warning">{selectedTicket.status}</span><h3>{selectedTicket.subject}</h3><p>{selectedTicket.message}</p><small>{selectedTicket.category}</small></> : <><LifeBuoy size={26} /><h3>Select a ticket</h3><p>Choose a ticket from the list to view its details and replies.</p></>}</div>
      </div>
    </Panel>
    {isOpen && <Modal title="New support ticket" description="Tell the Bellbee team how we can help." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="support-form" className="dp-primary-button">Submit ticket <Plus size={14} /></button></>}>
      <form id="support-form" className="dp-form-grid" onSubmit={submit}><FormField label="Subject" className="dp-form-full"><FieldInput value={form.subject} onChange={(event) => update('subject', event.target.value)} required /></FormField><FormField label="Category"><FieldSelect value={form.category} onChange={(event) => update('category', event.target.value)}><option>General</option><option>Billing</option><option>Technical issue</option><option>Feature request</option><option>Account</option></FieldSelect></FormField><FormField label="Attachments" hint="PDF, JPG or PNG · Maximum 3 MB each · Up to 5 files"><FieldInput type="file" accept=".pdf,.jpg,.jpeg,.png" multiple /></FormField><FormField label="Message" className="dp-form-full"><FieldTextarea rows={5} value={form.message} onChange={(event) => update('message', event.target.value)} required /></FormField><p className="dp-form-note dp-form-full">Ticket submission and file storage will be connected to the backend later.</p></form>
    </Modal>}
  </>;
}
