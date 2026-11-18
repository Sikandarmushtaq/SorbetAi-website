import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Plus, X } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, StatCard, StatGrid, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';

const statuses = ['All', 'Pending', 'Confirmed', 'Reschedule Requests', 'Awaiting Customer', 'Served', 'No Show', 'Cancelled'];

// Manages appointment drafts and switches between list and calendar views.
export default function AppointmentsPage() {
  const [view, setView] = useState('List');
  const [tab, setTab] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', phone: '', service: '', staff: 'Any staff', date: '', time: '', notes: '' });
  const { showNotice, Notice } = useNotice();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const visible = useMemo(() => tab === 'All' ? appointments : appointments.filter((item) => item.status === tab), [appointments, tab]);
  const submit = (event) => {
    event.preventDefault();
    setAppointments((current) => [{ ...form, id: Date.now(), status: 'Pending' }, ...current]);
    setForm({ customer: '', phone: '', service: '', staff: 'Any staff', date: '', time: '', notes: '' });
    setIsOpen(false);
    showNotice('Appointment added to this local preview.');
  };
  const days = Array.from({ length: 30 }, (_, index) => index + 1);
  return <>
    <PageHeader eyebrow="MANAGE" title="Appointments" description="Manage your daily bookings, staff availability and schedule." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add appointment</button>} />
    {Notice}
    <StatGrid columns={4}><StatCard label="Today's total" value={appointments.length} icon={CalendarDays} /><StatCard label="Pending" value={appointments.filter((item) => item.status === 'Pending').length} icon={Clock3} accent="yellow" /><StatCard label="Served" value="0" icon={CheckCircle2} accent="green" /><StatCard label="No show" value="0" icon={X} accent="lavender" /></StatGrid>
    <Panel><div className="dp-toolbar dp-toolbar-between"><Tabs items={['List', 'Calendar']} active={view} onChange={setView} /><select defaultValue="All Staff"><option>All Staff</option><option>Unassigned</option></select></div><Tabs items={statuses} active={tab} onChange={setTab} />
      {view === 'List' ? visible.length ? <div className="dp-data-list"><div className="dp-data-list-heading"><span>Customer</span><span>Service</span><span>Staff</span><span>Date / Time</span><span>Status</span></div>{visible.map((item) => <div className="dp-data-list-row" key={item.id}><strong>{item.customer}</strong><span>{item.service || '—'}</span><span>{item.staff}</span><span>{item.date} {item.time}</span><span className="dp-status-pill warning">{item.status}</span></div>)}</div> : <EmptyState icon={CalendarDays} title="No appointments yet" description="Bookings your AI makes in chats will show up here. You can also add one yourself." buttonText="Add appointment" onAction={() => setIsOpen(true)} /> : <div className="dp-calendar-wrap"><div className="dp-calendar-title"><strong>November 2026</strong><span>Month view</span></div><div className="dp-calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="dp-calendar-weekday" key={day}>{day}</span>)}{days.map((day) => <button type="button" className="dp-calendar-day" key={day} onClick={() => showNotice(`November ${day}, 2026 selected. Add an appointment to schedule a booking.`)}>{day}</button>)}</div><p className="dp-form-note">Your appointments will appear on the calendar after they are created or received from the AI.</p></div>}
    </Panel>
    {isOpen && <Modal title="Create appointment" description="Add a booking to your appointment schedule." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="appointment-form" className="dp-primary-button">Create appointment <Plus size={14} /></button></>}>
      <form id="appointment-form" className="dp-form-grid" onSubmit={submit}>
        <FormField label="Customer name"><FieldInput value={form.customer} onChange={(event) => update('customer', event.target.value)} required /></FormField>
        <FormField label="Phone"><FieldInput value={form.phone} onChange={(event) => update('phone', event.target.value)} required /></FormField>
        <FormField label="Service"><FieldInput value={form.service} onChange={(event) => update('service', event.target.value)} placeholder="Select service..." required /></FormField>
        <FormField label="Staff"><FieldSelect value={form.staff} onChange={(event) => update('staff', event.target.value)}><option>Any staff</option><option>Unassigned</option></FieldSelect></FormField>
        <FormField label="Date"><FieldInput type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required /></FormField>
        <FormField label="Time"><FieldInput type="time" value={form.time} onChange={(event) => update('time', event.target.value)} required /></FormField>
        <FormField label="Notes" className="dp-form-full"><FieldTextarea rows={2} value={form.notes} onChange={(event) => update('notes', event.target.value)} /></FormField>
      </form>
    </Modal>}
  </>;
}
