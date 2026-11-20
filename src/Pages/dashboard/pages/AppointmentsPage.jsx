
import './AppointmentsPage.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  CalendarDays,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  List,
  Plus,
  Search,
  SearchX,
  UserX,
  X,
} from 'lucide-react';

import { appointmentsApi } from '../../../services/dashboard/appointments.api.js';
import { servicesApi } from '../../../services/dashboard/services.api.js';
import { staffApi } from '../../../services/dashboard/staff.api.js';

import { useNotice } from '../../../components/dashboard/common/DashboardUI';

const STATUSES = [
  'All',
  'Pending',
  'Confirmed',
  'Reschedule Requests',
  'Awaiting Customer',
  'Served',
  'No Show',
  'Cancelled',
  'Expired',
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const BLANK_FORM = {
  customer_name: '',
  phone: '',
  service_id: '',
  staff_id: '',
  date: '',
  time: '',
  notes: '',
};

/* =========================================
   API RESPONSE HELPERS
========================================= */

function records(response, key) {
  const value = response?.data ?? response;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;

  return [];
}

function normalizeStatus(value) {
  const text = String(value || 'pending')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim();

  if (['canceled', 'cancelled'].includes(text)) {
    return 'Cancelled';
  }

  if (['completed', 'complete', 'served'].includes(text)) {
    return 'Served';
  }

  if (['no show', 'no shows'].includes(text)) {
    return 'No Show';
  }

  if (
    [
      'reschedule request',
      'reschedule requested',
      'reschedule requests',
    ].includes(text)
  ) {
    return 'Reschedule Requests';
  }

  if (
    ['awaiting customer', 'awaiting customer confirmation'].includes(
      text
    )
  ) {
    return 'Awaiting Customer';
  }

  return (
    STATUSES.find((status) => status.toLowerCase() === text) ||
    text.replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function localDateKey(date) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return '';
  }

  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${String(date.getDate()).padStart(2, '0')}`
  );
}

function bookingDate(item) {
  const input =
    item.start_at ||
    item.starts_at ||
    item.scheduled_at ||
    item.appointment_datetime ||
    item.date_time ||
    item.date ||
    item.appointment_date;

  if (!input) return null;

  let value = input;

  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    value = `${value}T${item.time || item.start_time || '00:00'}`;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function bookingId(item) {
  return item.id ?? item.appointment_id;
}

function customerName(item) {
  return (
    item.customer_name ||
    item.customer?.name ||
    item.customer?.full_name ||
    'Customer'
  );
}

function bookingStaffId(item) {
  return String(
    item.staff_id ??
      item.staff?.id ??
      item.staff?.staff_id ??
      ''
  );
}

function staffName(item, staff) {
  const match = staff.find(
    (person) =>
      String(person.id ?? person.staff_id) ===
      bookingStaffId(item)
  );

  return (
    item.staff_name ||
    item.staff?.name ||
    match?.name ||
    match?.full_name ||
    'Any staff'
  );
}

function serviceName(item, services) {
  const id = item.service_id ?? item.service?.id;

  const match = services.find(
    (service) =>
      String(service.id ?? service.service_id) === String(id)
  );

  return (
    item.service_name ||
    item.service?.name ||
    match?.name ||
    '—'
  );
}

function statusValue(label) {
  return label.toLowerCase().replace(/\s+/g, '_');
}

/* =========================================
   APPOINTMENT STAT CARD
========================================= */

function Stat({ icon: Icon, tone, label, value }) {
  return (
    <article className="ap-stat">
      <span className={`ap-stat-icon ap-${tone}`}>
        <Icon size={18} strokeWidth={1.8} />
      </span>

      <span className="ap-stat-label">{label}</span>

      <strong>{value}</strong>
    </article>
  );
}

/* =========================================
   MAIN APPOINTMENTS PAGE
========================================= */

export default function AppointmentsPage() {
  const [view, setView] = useState('List');
  const [tab, setTab] = useState('All');

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingId, setChangingId] = useState('');

  const [form, setForm] = useState(BLANK_FORM);

  const [month, setMonth] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
  );

  const requestId = useRef(0);

  const { showNotice, Notice } = useNotice();

  /* =======================================
     LOAD APPOINTMENTS FROM BACKEND
  ======================================= */

  const loadAppointments = useCallback(
    async (silent = false) => {
      const currentRequest = ++requestId.current;

      if (!appointmentsApi.isConfigured()) {
        setLoadError(
          'Appointments API endpoint is not configured.'
        );
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);

      try {
        const response = await appointmentsApi.request();

        if (requestId.current !== currentRequest) return;

        setAppointments(records(response, 'appointments'));
        setLoadError('');
      } catch (error) {
        if (requestId.current !== currentRequest) return;

        setLoadError(
          error.message || 'Unable to load appointments.'
        );

        if (!silent) setAppointments([]);
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadAppointments();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAppointments(true);
      }
    }, 30000);

    return () => {
      window.clearInterval(interval);
      requestId.current += 1;
    };
  }, [loadAppointments]);

  /* =======================================
     LOAD SERVICES AND STAFF
  ======================================= */

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      const [servicesResult, staffResult] =
        await Promise.allSettled([
          servicesApi.isConfigured()
            ? servicesApi.request()
            : Promise.resolve([]),

          staffApi.isConfigured()
            ? staffApi.request()
            : Promise.resolve([]),
        ]);

      if (!active) return;

      if (servicesResult.status === 'fulfilled') {
        setServices(
          records(servicesResult.value, 'services')
        );
      }

      if (staffResult.status === 'fulfilled') {
        setStaff(records(staffResult.value, 'staff'));
      }
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================
     MODAL KEYBOARD HANDLING
  ======================================= */

  useEffect(() => {
    if (!formOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) {
        setFormOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [formOpen, saving]);

  /* =======================================
     SEARCH / STATUS / STAFF FILTERS
  ======================================= */

  const visible = useMemo(
    () =>
      appointments.filter((item) => {
        const date = bookingDate(item);

        const query = `
          ${customerName(item)}
          ${item.phone || item.customer?.phone || ''}
          ${serviceName(item, services)}
        `.toLowerCase();

        return (
          (tab === 'All' ||
            normalizeStatus(item.status) === tab) &&
          (!search.trim() ||
            query.includes(search.trim().toLowerCase())) &&
          (!dateFilter ||
            localDateKey(date) === dateFilter) &&
          (!staffFilter ||
            bookingStaffId(item) === staffFilter)
        );
      }),
    [
      appointments,
      dateFilter,
      search,
      services,
      staffFilter,
      tab,
    ]
  );

  /* =======================================
     STATISTICS
  ======================================= */

  const today = localDateKey(new Date());

  const totals = useMemo(
    () => ({
      today: appointments.filter(
        (item) =>
          localDateKey(bookingDate(item)) === today
      ).length,

      pending: appointments.filter(
        (item) =>
          normalizeStatus(item.status) === 'Pending'
      ).length,

      served: appointments.filter(
        (item) =>
          normalizeStatus(item.status) === 'Served'
      ).length,

      noShow: appointments.filter(
        (item) =>
          normalizeStatus(item.status) === 'No Show'
      ).length,
    }),
    [appointments, today]
  );

  /* =======================================
     CLEAR FILTERS
  ======================================= */

  const clearFilters = () => {
    setTab('All');
    setSearch('');
    setDateFilter('');
    setStaffFilter('');
  };

  /* =======================================
     NEW APPOINTMENT FORM
  ======================================= */

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveAppointment = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!appointmentsApi.isConfigured()) {
      showNotice(
        'Configure the appointments API before creating bookings.'
      );
      return;
    }

    const startsAt = new Date(
      `${form.date}T${form.time}`
    );

    if (Number.isNaN(startsAt.getTime())) {
      showNotice(
        'Please select a valid appointment date and time.'
      );
      return;
    }

    setSaving(true);

    try {
      await appointmentsApi.request({
        method: 'POST',

        body: {
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          service_id: form.service_id,
          staff_id: form.staff_id || null,
          start_at: startsAt.toISOString(),
          notes: form.notes.trim(),
        },
      });

      setFormOpen(false);
      setForm(BLANK_FORM);

      showNotice('Appointment booked successfully.');

      await loadAppointments();
    } catch (error) {
      showNotice(
        error.message || 'Unable to create appointment.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================
     CHANGE APPOINTMENT STATUS
  ======================================= */

  const changeStatus = async (item, status) => {
    const id = bookingId(item);

    if (id === undefined || id === null) return;

    setChangingId(String(id));

    try {
      await appointmentsApi.request({
        method: 'PATCH',
        id,
        body: {
          status: statusValue(status),
        },
      });

      setAppointments((previous) =>
        previous.map((booking) =>
          String(bookingId(booking)) === String(id)
            ? {
                ...booking,
                status: statusValue(status),
              }
            : booking
        )
      );

      showNotice('Appointment status updated.');
    } catch (error) {
      showNotice(
        error.message ||
          'Unable to change appointment status.'
      );
    } finally {
      setChangingId('');
    }
  };

  /* =======================================
     CALENDAR CALCULATIONS
  ======================================= */

  const monthTitle = month.toLocaleDateString(
    'en-GB',
    {
      month: 'long',
      year: 'numeric',
    }
  );

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstWeekday = new Date(
    year,
    monthIndex,
    1
  ).getDay();

  const monthDays = new Date(
    year,
    monthIndex + 1,
    0
  ).getDate();

  const cellsCount =
    Math.ceil((firstWeekday + monthDays) / 7) * 7;

  const cells = Array.from(
    { length: cellsCount },
    (_, i) => {
      const day = i - firstWeekday + 1;

      return day >= 1 && day <= monthDays
        ? day
        : null;
    }
  );

  const appointmentsByDay = useMemo(() => {
    const days = new Map();

    appointments.forEach((item) => {
      const key = localDateKey(bookingDate(item));

      if (!key) return;

      if (!days.has(key)) {
        days.set(key, []);
      }

      days.get(key).push(item);
    });

    return days;
  }, [appointments]);

  const openCalendarDate = (day) => {
    const key = localDateKey(
      new Date(year, monthIndex, day)
    );

    setDateFilter(key);
    setTab('All');
    setView('List');
  };

  const filtered = Boolean(
    search ||
      dateFilter ||
      staffFilter ||
      tab !== 'All'
  );

  /* =======================================
     PAGE RENDER
  ======================================= */

  return (
    <div className="ap-page">
      {/* PAGE HEADER */}

      <header className="ap-header">
        <div>
          <h1>Appointments</h1>

          <p>
            Manage your daily bookings and schedule.
          </p>
        </div>

        <div className="ap-header-actions">
          <div
            className="ap-view-switch"
            role="group"
            aria-label="Appointment view"
          >
            <button
              type="button"
              className={
                view === 'List' ? 'active' : ''
              }
              onClick={() => setView('List')}
              aria-pressed={view === 'List'}
            >
              <List size={15} />
              List
            </button>

            <button
              type="button"
              className={
                view === 'Calendar' ? 'active' : ''
              }
              onClick={() => setView('Calendar')}
              aria-pressed={view === 'Calendar'}
            >
              <CalendarDays size={15} />
              Calendar
            </button>
          </div>

          <button
            type="button"
            className="ap-primary"
            onClick={() => setFormOpen(true)}
          >
            <Plus size={16} />
            New Booking
          </button>
        </div>
      </header>

      {Notice}

      {loadError && (
        <div className="ap-error" role="alert">
          {loadError}

          <button
            type="button"
            onClick={() => loadAppointments()}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <section
        className="ap-stats"
        aria-label="Appointment statistics"
      >
        <Stat
          icon={CalendarDays}
          tone="coral"
          label="TODAY'S TOTAL"
          value={loading ? '—' : totals.today}
        />

        <Stat
          icon={Clock3}
          tone="yellow"
          label="PENDING"
          value={loading ? '—' : totals.pending}
        />

        <Stat
          icon={CalendarCheck2}
          tone="green"
          label="SERVED"
          value={loading ? '—' : totals.served}
        />

        <Stat
          icon={UserX}
          tone="red"
          label="NO SHOW"
          value={loading ? '—' : totals.noShow}
        />
      </section>

      {/* LIST VIEW */}

      {view === 'List' ? (
        <section className="ap-list-panel">
          {/* STATUS TABS */}

          <div
            className="ap-status-tabs"
            role="tablist"
            aria-label="Appointment status"
          >
            {STATUSES.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={
                  tab === item ? 'active' : ''
                }
                key={item}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {/* FILTER TOOLBAR */}

          <div className="ap-filters">
            <label className="ap-search">
              <Search size={16} />

              <input
                aria-label="Search customer name"
                type="search"
                placeholder="Search customer name..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

            <div className="ap-filter-right">
              <input
                className="ap-date-filter"
                aria-label="Filter appointments by date"
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
              />

              <select
                aria-label="Filter by staff"
                value={staffFilter}
                onChange={(event) =>
                  setStaffFilter(event.target.value)
                }
              >
                <option value="">All Staff</option>

                {staff.map((member) => (
                  <option
                    key={
                      member.id ?? member.staff_id
                    }
                    value={String(
                      member.id ?? member.staff_id
                    )}
                  >
                    {member.name ||
                      member.full_name ||
                      'Staff member'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* APPOINTMENTS TABLE */}

          <div className="ap-table-scroll">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>SERVICE</th>
                  <th>STAFF</th>
                  <th>DATE / TIME</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      <div className="ap-empty">
                        <CalendarDays size={24} />
                        <strong>
                          Loading appointments...
                        </strong>
                      </div>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan="6">
                      <div className="ap-empty">
                        <SearchX size={24} />
                        <strong>
                          Unable to load bookings
                        </strong>
                        <p>
                          Check the appointments API
                          connection and retry.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="ap-empty">
                        {filtered ? (
                          <SearchX size={26} />
                        ) : (
                          <CalendarDays size={26} />
                        )}

                        <strong>
                          {filtered
                            ? 'No matches'
                            : 'No appointments yet'}
                        </strong>

                        <p>
                          {filtered ? (
                            'No appointments match these filters.'
                          ) : (
                            <>
                              Bookings your AI makes in
                              chats show up here.
                              <br />
                              You can also add one
                              yourself.
                            </>
                          )}
                        </p>

                        <button
                          type="button"
                          className={
                            filtered
                              ? 'ap-outline'
                              : 'ap-primary'
                          }
                          onClick={
                            filtered
                              ? clearFilters
                              : () => setFormOpen(true)
                          }
                        >
                          {filtered
                            ? 'Clear filters'
                            : 'New appointment'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visible.map((item, index) => {
                    const id = bookingId(item);
                    const date = bookingDate(item);

                    const currentStatus =
                      normalizeStatus(item.status);

                    const phone =
                      item.phone ||
                      item.customer?.phone ||
                      '';

                    return (
                      <tr key={String(id ?? index)}>
                        <td>
                          <strong className="ap-cell-name">
                            {customerName(item)}
                          </strong>

                          {phone && (
                            <small className="ap-cell-sub">
                              {phone}
                            </small>
                          )}
                        </td>

                        <td>
                          {serviceName(item, services)}
                        </td>

                        <td>
                          {staffName(item, staff)}
                        </td>

                        <td>
                          {date
                            ? date.toLocaleString(
                                undefined,
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }
                              )
                            : '—'}
                        </td>

                        <td>
                          <span
                            className={
                              `ap-status-badge ap-badge-` +
                              statusValue(
                                currentStatus
                              )
                            }
                          >
                            {currentStatus}
                          </span>
                        </td>

                        <td>
                          <select
                            className="ap-action-select"
                            aria-label={`Change status for ${customerName(item)}`}
                            value=""
                            onChange={(event) =>
                              changeStatus(
                                item,
                                event.target.value
                              )
                            }
                            disabled={
                              changingId === String(id) ||
                              id == null
                            }
                          >
                            <option value="">
                              {changingId === String(id)
                                ? 'Saving...'
                                : 'Actions'}
                            </option>

                            {STATUSES.filter(
                              (status) =>
                                status !== 'All' &&
                                status !== currentStatus
                            ).map((status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* CALENDAR VIEW */

        <section className="ap-calendar-panel">
          <div className="ap-calendar-toolbar">
            <strong>{monthTitle}</strong>

            <div className="ap-calendar-controls">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setMonth(
                    new Date(year, monthIndex - 1, 1)
                  )
                }
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1
                    )
                  )
                }
              >
                Today
              </button>

              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setMonth(
                    new Date(year, monthIndex + 1, 1)
                  )
                }
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="ap-calendar-grid">
            {DAYS.map((day) => (
              <div
                key={day}
                className="ap-calendar-weekday"
              >
                {day}
              </div>
            ))}

            {cells.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="ap-calendar-day ap-calendar-blank"
                    aria-hidden="true"
                  />
                );
              }

              const key = localDateKey(
                new Date(year, monthIndex, day)
              );

              const dayBookings =
                appointmentsByDay.get(key) || [];

              return (
                <button
                  type="button"
                  key={key}
                  className={`ap-calendar-day ${
                    key === today ? 'is-today' : ''
                  }`}
                  aria-label={`${day} ${monthTitle}, ${dayBookings.length} appointments. Show in list.`}
                  onClick={() =>
                    openCalendarDate(day)
                  }
                >
                  <span className="ap-calendar-number">
                    {day}
                  </span>

                  {dayBookings
                    .slice(0, 2)
                    .map((booking, idx) => (
                      <span
                        className="ap-calendar-event"
                        key={String(
                          bookingId(booking) ?? idx
                        )}
                      >
                        {customerName(booking)}
                      </span>
                    ))}

                  {dayBookings.length > 2 && (
                    <span className="ap-calendar-more">
                      +{dayBookings.length - 2} more
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <p className="ap-calendar-note">
              Loading bookings...
            </p>
          )}
        </section>
      )}

      {/* NEW APPOINTMENT MODAL */}

      {formOpen && (
        <div
          className="ap-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setFormOpen(false);
            }
          }}
        >
          <section
            className="ap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ap-booking-title"
          >
            <header className="ap-modal-header">
              <h2 id="ap-booking-title">
                New Appointment
              </h2>

              <button
                type="button"
                aria-label="Close"
                onClick={() =>
                  !saving && setFormOpen(false)
                }
                disabled={saving}
              >
                <X size={19} />
              </button>
            </header>

            <form
              id="ap-booking-form"
              onSubmit={saveAppointment}
            >
              <div className="ap-modal-fields">
                <label className="ap-field">
                  Customer Name <b>*</b>

                  <input
                    autoFocus
                    type="text"
                    required
                    maxLength={150}
                    value={form.customer_name}
                    onChange={(event) =>
                      updateForm(
                        'customer_name',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="ap-field">
                  Phone <b>*</b>

                  <input
                    type="tel"
                    required
                    maxLength={32}
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm(
                        'phone',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="ap-field">
                  Service <b>*</b>

                  <select
                    required
                    value={form.service_id}
                    onChange={(event) =>
                      updateForm(
                        'service_id',
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select service...
                    </option>

                    {services.map((service) => (
                      <option
                        key={
                          service.id ??
                          service.service_id
                        }
                        value={
                          service.id ??
                          service.service_id
                        }
                      >
                        {service.name ||
                          service.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ap-field">
                  Staff

                  <select
                    value={form.staff_id}
                    onChange={(event) =>
                      updateForm(
                        'staff_id',
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Any staff
                    </option>

                    {staff.map((person) => (
                      <option
                        key={
                          person.id ??
                          person.staff_id
                        }
                        value={
                          person.id ??
                          person.staff_id
                        }
                      >
                        {person.name ||
                          person.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ap-field">
                  Date <b>*</b>

                  <input
                    type="date"
                    required
                    min={today}
                    value={form.date}
                    onChange={(event) =>
                      updateForm(
                        'date',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="ap-field">
                  Time <b>*</b>

                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(event) =>
                      updateForm(
                        'time',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="ap-field ap-field-full">
                  Notes

                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        'notes',
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="ap-modal-footer">
                <button
                  type="button"
                  className="ap-cancel"
                  onClick={() =>
                    setFormOpen(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ap-primary"
                  disabled={
                    saving ||
                    services.length === 0
                  }
                >
                  {saving
                    ? 'Booking...'
                    : 'Book'}
                </button>
              </div>

              {!services.length && (
                <p className="ap-modal-hint">
                  A service must be configured
                  in your business before you
                  can create an appointment.
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
