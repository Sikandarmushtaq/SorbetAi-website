import { appointmentsApi } from '../../../services/dashboard/appointments.api.js';
import { servicesApi } from '../../../services/dashboard/services.api.js';
import { staffApi } from '../../../services/dashboard/staff.api.js';
import './AppointmentsPage.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Plus, X } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, StatCard, StatGrid, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
const statuses = ['All', 'Pending', 'Confirmed', 'Reschedule Requests', 'Awaiting Customer', 'Served', 'No Show', 'Cancelled'];
const emptyForm = { customer_name: '', phone: '', service_name: '', staff_id: '', date: '', time: '', notes: '' };

function appointmentRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.appointments || response?.services || response?.staff || [];
}

function appointmentStatus(item) {
  return String(item.status || 'Pending').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function appointmentDate(item) {
  const value = item.start_at || item.starts_at || item.date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Loads saved bookings from the appointments API and provides list and calendar views.
export default function AppointmentsPage() {
  const [view, setView] = useState('List');
  const [tab, setTab] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { showNotice, Notice } = useNotice();

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await appointmentsApi.request();
      setAppointments(appointmentRecords(response));
    } catch (error) {
      setAppointments([]);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([staffApi.request(), servicesApi.request()]).then(([staffResult, servicesResult]) => {
      if (!active) return;
      if (staffResult.status === 'fulfilled') setStaff(appointmentRecords(staffResult.value));
      if (servicesResult.status === 'fulfilled') setServices(appointmentRecords(servicesResult.value));
    });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => appointments.filter((item) => tab === 'All' || appointmentStatus(item) === tab), [appointments, tab]);
  const todayKey = new Date().toDateString();
  const todayTotal = appointments.filter((item) => appointmentDate(item)?.toDateString() === todayKey).length;
  const pendingTotal = appointments.filter((item) => appointmentStatus(item) === 'Pending').length;
  const servedTotal = appointments.filter((item) => appointmentStatus(item) === 'Served').length;
  const noShowTotal = appointments.filter((item) => appointmentStatus(item) === 'No Show').length;

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const createAppointment = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await appointmentsApi.request({
        method: 'POST',
        body: {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          service_id: form.service_name || null,
          staff_id: form.staff_id || null,
          start_at: new Date(`${form.date}T${form.time}`).toISOString(),
          notes: form.notes.trim(),
        },
      });
      setForm(emptyForm);
      setIsOpen(false);
      showNotice('Appointment saved successfully.');
      await loadAppointments();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (item, status) => {
    const id = item.id || item.appointment_id;
    try {
      await appointmentsApi.request({ method: 'PATCH', id, body: { status: status.toLowerCase().replaceAll(' ', '_') } });
      setAppointments((current) => current.map((record) => String(record.id || record.appointment_id) === String(id) ? { ...record, status } : record));
    } catch (error) {
      showNotice(error.message);
    }
  };

  const monthTitle = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const appointmentsForDay = (day) => appointments.filter((item) => {
    const date = appointmentDate(item);
    return date && date.getFullYear() === calendarMonth.getFullYear() && date.getMonth() === calendarMonth.getMonth() && date.getDate() === day;
  });

  return (
    <>
      <PageHeader eyebrow="MANAGE" title="Appointments" description="Manage your daily bookings, staff availability and schedule." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add appointment</button>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <StatGrid columns={4}>
        <StatCard label="Today's total" value={isLoading ? '—' : todayTotal} icon={CalendarDays} />
        <StatCard label="Pending" value={isLoading ? '—' : pendingTotal} icon={Clock3} accent="yellow" />
        <StatCard label="Served" value={isLoading ? '—' : servedTotal} icon={CheckCircle2} accent="green" />
        <StatCard label="No show" value={isLoading ? '—' : noShowTotal} icon={X} accent="lavender" />
      </StatGrid>
      <Panel>
        <div className="dp-toolbar dp-toolbar-between"><Tabs items={['List', 'Calendar']} active={view} onChange={setView} /><span className="dp-muted">{appointments.length} appointments</span></div>
        <Tabs items={statuses} active={tab} onChange={setTab} />
        {isLoading ? <div className="dp-api-empty-state">Loading appointments…</div> : view === 'List' ? (
          visible.length ? (
            <div className="dp-data-list"><div className="dp-data-list-heading"><span>Customer</span><span>Service</span><span>Staff</span><span>Date / Time</span><span>Status</span></div>
              {visible.map((item) => {
                const date = appointmentDate(item);
                const id = item.id || item.appointment_id;
                return <div className="dp-data-list-row" key={id}>
                  <div><strong>{item.customer_name || item.customer?.name || 'Customer'}</strong><small>{item.phone || item.customer?.phone || ''}</small></div>
                  <span>{item.service_name || item.service?.name || '—'}</span>
                  <span>{item.staff_name || item.staff?.name || 'Any staff'}</span>
                  <span>{date ? date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</span>
                  <select aria-label="Appointment status" value={appointmentStatus(item)} onChange={(event) => updateStatus(item, event.target.value)}>{statuses.filter((status) => status !== 'All').map((status) => <option key={status}>{status}</option>)}</select>
                </div>;
              })}
            </div>
          ) : loadError ? <div className="dp-api-empty-state"><CalendarDays size={22} /><strong>Appointments are ready to connect</strong><p>Connect the appointments API to load your saved bookings.</p></div> : <EmptyState icon={CalendarDays} title="No appointments yet" description="Bookings your AI makes in chats will show up here. You can also add one yourself." buttonText="Add appointment" onAction={() => setIsOpen(true)} />
        ) : (
          <div className="dp-calendar-wrap">
            <div className="dp-calendar-title"><button type="button" className="dp-secondary-button" onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>Previous</button><strong>{monthTitle}</strong><button type="button" className="dp-secondary-button" onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>Next</button></div>
            <div className="dp-calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="dp-calendar-weekday" key={day}>{day}</span>)}{calendarCells.map((day, index) => day ? <button type="button" className={`dp-calendar-day ${appointmentsForDay(day).length ? 'has-appointments' : ''}`} key={day} onClick={() => showNotice(`${appointmentsForDay(day).length} appointments on ${monthTitle} ${day}.`)}><strong>{day}</strong>{appointmentsForDay(day).length > 0 && <small>{appointmentsForDay(day).length}</small>}</button> : <span className="dp-calendar-day empty" key={`empty-${index}`} />)}</div>
            {!appointments.length && <p className="dp-form-note">Appointments will appear on the calendar after they are created or received from the AI.</p>}
          </div>
        )}
      </Panel>

      {isOpen && <Modal title="Create appointment" description="Add a booking to your appointment schedule." onClose={() => !isSaving && setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</button><button type="submit" form="appointment-form" className="dp-primary-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Create appointment'} <Plus size={14} /></button></>}>
        <form id="appointment-form" className="dp-form-grid" onSubmit={createAppointment}>
          <FormField label="Customer name"><FieldInput value={form.customer_name} onChange={(event) => updateForm('customer_name', event.target.value)} required /></FormField>
          <FormField label="Phone"><FieldInput value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} required /></FormField>
          <FormField label="Service"><FieldSelect value={form.service_name} onChange={(event) => updateForm('service_name', event.target.value)} required><option value="">Select service</option>{services.map((service) => <option key={service.id || service.service_id} value={service.id || service.service_id}>{service.name}</option>)}</FieldSelect></FormField>
          <FormField label="Staff"><FieldSelect value={form.staff_id} onChange={(event) => updateForm('staff_id', event.target.value)}><option value="">Any staff</option>{staff.map((member) => <option key={member.id || member.staff_id} value={member.id || member.staff_id}>{member.name || member.full_name}</option>)}</FieldSelect></FormField>
          <FormField label="Date"><FieldInput type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} min={new Date().toISOString().slice(0, 10)} required /></FormField>
          <FormField label="Time"><FieldInput type="time" value={form.time} onChange={(event) => updateForm('time', event.target.value)} required /></FormField>
          <FormField label="Notes" className="dp-form-full"><FieldTextarea rows={2} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} /></FormField>
        </form>
      </Modal>}
    </>
  );
}
