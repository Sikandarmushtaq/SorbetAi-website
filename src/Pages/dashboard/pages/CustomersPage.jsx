import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowLeft, ArrowUp, CalendarDays, ChevronDown, MessageCircle,
  Plus, Search, Tag, Users,
} from 'lucide-react';
import { EmptyState, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { resourceRequest } from '../../../services/dashboardApi';

function recordsFrom(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.customers || [];
}

function getCustomerName(customer) {
  return customer?.full_name || customer?.name || [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || 'Customer';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function formatLastContact(value) {
  if (!value) return 'No contact yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

// Shows API-backed customer records in a URL-filtered master/detail workspace.
export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotice, Notice } = useNotice();
  const query = searchParams.get('q') || '';
  const selectedId = searchParams.get('customer') || '';
  const sort = searchParams.get('sort') || 'lastContact';
  const direction = searchParams.get('direction') || 'desc';
  const selectedLabels = (searchParams.get('label') || '').split(',').filter(Boolean);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [labelMenuOpen, setLabelMenuOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [labelsDraft, setLabelsDraft] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');
    resourceRequest('customers', { query: { search: query || undefined, labels: selectedLabels.join(',') || undefined, sort, direction } })
      .then((response) => { if (active) setCustomers(recordsFrom(response)); })
      .catch((error) => { if (active) { setCustomers([]); setLoadError(error.message); } })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [query, selectedLabels.join(','), sort, direction]);

  const labels = useMemo(() => [...new Set(customers.flatMap((customer) => Array.isArray(customer.labels) ? customer.labels : []))].filter(Boolean).sort(), [customers]);
  const sortedCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      const name = getCustomerName(customer).toLowerCase();
      const phone = String(customer.phone || customer.whatsapp_number || '').toLowerCase();
      const matchesSearch = !query || name.includes(query.toLowerCase()) || phone.includes(query.toLowerCase());
      const customerLabels = Array.isArray(customer.labels) ? customer.labels : [];
      const matchesLabels = !selectedLabels.length || selectedLabels.every((label) => customerLabels.includes(label));
      return matchesSearch && matchesLabels;
    });
    return filtered.sort((a, b) => {
      if (sort === 'name') {
        const compare = getCustomerName(a).toLowerCase().localeCompare(getCustomerName(b).toLowerCase());
        return direction === 'asc' ? compare : -compare;
      }
      const first = sort === 'dateAdded'
        ? a.created_at
        : (a.last_contact_at || a.last_contact);
      const second = sort === 'dateAdded'
        ? b.created_at
        : (b.last_contact_at || b.last_contact);
      const firstTime = first ? new Date(first).getTime() : Number.NaN;
      const secondTime = second ? new Date(second).getTime() : Number.NaN;
      if (Number.isNaN(firstTime) && Number.isNaN(secondTime)) return 0;
      if (Number.isNaN(firstTime)) return 1;
      if (Number.isNaN(secondTime)) return -1;
      const compare = firstTime - secondTime;
      return direction === 'asc' ? compare : -compare;
    });
  }, [customers, query, selectedLabels.join(','), sort, direction]);

  const selectedCustomer = customers.find((customer) => String(customer.id || customer.customer_id) === selectedId) || null;

  useEffect(() => {
    setNotes(selectedCustomer?.notes || '');
    setLabelsDraft(Array.isArray(selectedCustomer?.labels) ? selectedCustomer.labels : []);
  }, [selectedId, selectedCustomer?.notes, JSON.stringify(selectedCustomer?.labels || [])]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const toggleLabel = (label) => {
    const next = selectedLabels.includes(label) ? selectedLabels.filter((item) => item !== label) : [...selectedLabels, label];
    setParam('label', next.join(','));
  };

  const clearFiltersAndSelection = () => {
    const next = new URLSearchParams(searchParams);
    ['customer', 'q', 'label'].forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  };

  const addCustomerLabel = () => {
    const label = newLabel.trim();
    if (!label || labelsDraft.some((item) => item.toLowerCase() === label.toLowerCase())) return;
    setLabelsDraft((current) => [...current, label]);
    setNewLabel('');
  };

  const saveCustomerDetails = async () => {
    if (!selectedCustomer) return;
    setIsSavingDetails(true);
    try {
      const id = selectedCustomer.id || selectedCustomer.customer_id;
      await resourceRequest('customers', { method: 'PATCH', id, body: { labels: labelsDraft, notes } });
      setCustomers((current) => current.map((customer) => String(customer.id || customer.customer_id) === String(id) ? { ...customer, labels: labelsDraft, notes } : customer));
      showNotice('Customer details updated.');
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  return (
    <>
      <PageHeader title="Customers" description="View and manage your contacts" />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <section className={`dp-customers-workspace ${selectedId ? 'has-selection' : ''}`}>
        <div className="dp-customers-list-pane">
          <label className="dp-customer-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setParam('q', event.target.value)} placeholder="Search by name or phone..." />
          </label>
          <div className="dp-customer-list-controls">
            <div className="dp-label-filter-wrap">
              <button type="button" className={`dp-secondary-button dp-label-filter-button ${selectedLabels.length ? 'is-selected' : ''}`} onClick={() => setLabelMenuOpen((open) => !open)}>
                <Tag size={14} /> Filter by Label <ChevronDown size={13} />
              </button>
              {labelMenuOpen && <div className="dp-label-filter-menu">
                {labels.length ? labels.map((label) => <label key={label}><input type="checkbox" checked={selectedLabels.includes(label)} onChange={() => toggleLabel(label)} />{label}</label>) : <p>Labels will appear here when customers are saved.</p>}
                <button type="button" onClick={() => setParam('label', '')}>Clear filters</button>
              </div>}
            </div>
            <div className="dp-customer-sort">
              <span>SORT BY</span>
              <select value={sort} onChange={(event) => setParam('sort', event.target.value)} aria-label="Sort customers">
                <option value="lastContact">Last Contact</option>
                <option value="name">Name</option>
                <option value="dateAdded">Date Added</option>
              </select>
              <button type="button" className="dp-icon-action" onClick={() => setParam('direction', direction === 'asc' ? 'desc' : 'asc')} aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}>
                {direction === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              </button>
            </div>
          </div>
          <div className="dp-customers-list-scroll">
            {isLoading ? <div className="dp-customer-list-message">Loading customers…</div> : sortedCustomers.length ? sortedCustomers.map((customer) => {
              const id = String(customer.id || customer.customer_id);
              return (
                <button type="button" key={id} className={`dp-customer-row ${selectedId === id ? 'active' : ''}`} onClick={() => setParam('customer', id)}>
                  <span className="dp-customer-avatar">{getCustomerName(customer).charAt(0).toUpperCase()}</span>
                  <span className="dp-customer-row-main">
                    <strong>{getCustomerName(customer)}</strong>
                    <small>{customer.phone || customer.whatsapp_number || 'No phone number'}</small>
                    <span className="dp-customer-labels">{(customer.labels || []).slice(0, 2).map((label) => <i key={label}>{label}</i>)}</span>
                  </span>
                  <time>{formatLastContact(customer.last_contact_at || customer.last_contact)}</time>
                </button>
              );
            }) : loadError ? <div className="dp-customer-list-message">Customer records are not available until the customers API is connected.</div> : <EmptyState icon={MessageCircle} title="No customers yet" description="Everyone who messages your business is saved here automatically." />}
          </div>
        </div>

        <div className="dp-customer-detail-pane">
          {!selectedCustomer ? (
            <div className="dp-customer-detail-empty"><Users size={25} /><p>{selectedId ? 'This customer is not in the current filtered list.' : 'Select a customer to view details'}</p>{selectedId && <button type="button" className="dp-text-button" onClick={clearFiltersAndSelection}>Clear filters and selection</button>}</div>
          ) : (
            <div className="dp-customer-detail-content">
              <div className="dp-customer-detail-mobile-back"><button type="button" className="dp-text-button" onClick={() => setParam('customer', '')}><ArrowLeft size={15} /> Back to customers</button></div>
              <div className="dp-customer-detail-heading">
                <span className="dp-customer-avatar large">{getCustomerName(selectedCustomer).charAt(0).toUpperCase()}</span>
                <div><h2>{getCustomerName(selectedCustomer)}</h2><p>{selectedCustomer.phone || selectedCustomer.whatsapp_number || 'No phone number'}</p></div>
                <button type="button" className="dp-primary-button" onClick={() => navigate(`/dashboard/chats?customer=${encodeURIComponent(selectedId)}`)}><MessageCircle size={15} /> Open chat</button>
              </div>
              <Panel className="dp-customer-detail-card">
                <div className="dp-panel-heading"><h3>Labels</h3></div>
                <div className="dp-customer-label-editor">
                  {[...new Set([...labels, ...labelsDraft])].map((label) => <label key={label}><input type="checkbox" checked={labelsDraft.includes(label)} onChange={() => setLabelsDraft((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])} />{label}</label>)}
                  {!labels.length && !labelsDraft.length && <small>No labels have been added yet.</small>}
                </div>
                <div className="dp-customer-add-label"><input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomerLabel(); } }} placeholder="Add a label" maxLength={40} /><button type="button" className="dp-secondary-button" onClick={addCustomerLabel} disabled={!newLabel.trim()}><Plus size={14} /> Add label</button></div>
                <label className="dp-form-field dp-customer-notes"><span>Notes</span><textarea className="dp-field-control dp-field-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add notes about this customer…" /></label>
                <button type="button" className="dp-secondary-button" onClick={saveCustomerDetails} disabled={isSavingDetails}>{isSavingDetails ? 'Saving…' : 'Save customer details'}</button>
              </Panel>
              <div className="dp-customer-related-grid">
                <Panel className="dp-customer-detail-card"><div className="dp-panel-heading"><h3>Orders</h3></div>{(selectedCustomer.orders || []).length ? selectedCustomer.orders.map((order) => <RelatedRow key={order.id || order.order_number} title={order.order_number || order.reference || 'Order'} detail={order.status || ''} value={order.total || order.amount || ''} />) : <p className="dp-muted">No orders linked to this customer.</p>}</Panel>
                <Panel className="dp-customer-detail-card"><div className="dp-panel-heading"><h3>Appointments</h3></div>{(selectedCustomer.appointments || []).length ? selectedCustomer.appointments.map((appointment) => <RelatedRow key={appointment.id} title={appointment.service_name || appointment.service || 'Appointment'} detail={formatDate(appointment.start_at || appointment.date)} value={appointment.status || ''} />) : <p className="dp-muted"><CalendarDays size={14} /> No appointments linked to this customer.</p>}</Panel>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function RelatedRow({ title, detail, value }) {
  return <div className="dp-customer-related-row"><strong>{title}</strong><span>{detail}</span><small>{value}</small></div>;
}
