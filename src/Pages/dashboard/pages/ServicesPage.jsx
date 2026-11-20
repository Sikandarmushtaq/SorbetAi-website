import { servicesApi } from '../../../services/dashboard/services.api.js';
import { staffApi } from '../../../services/dashboard/staff.api.js';
import './Servicespage.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Download, Plus, Upload } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { downloadCsv, parseCsv } from '../../../utils/csv';

const serviceHeaders = ['Name', 'Description', 'Link', 'Pricing Type', 'Price', 'Duration', 'Status'];
const emptyForm = { name: '', description: '', link: '', pricing_type: 'Flat', price: '', duration: '', visibility: 'Visible', show_price: true, bookable: true, is_active: true, assigned_staff_ids: [], intake_fields: [] };

function serviceRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.services || [];
}

function isActive(service) {
  return service.is_active !== false && service.active !== false && String(service.status || '').toLowerCase() !== 'inactive' && String(service.visibility || '').toLowerCase() !== 'hidden';
}

// Loads saved services and uses API actions for creation, bulk CSV imports and visibility filters.
export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('All Status');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [staffMembers, setStaffMembers] = useState([]);
  const [pricingOptions, setPricingOptions] = useState([{ label: '', price: '' }]);
  const [newIntakeField, setNewIntakeField] = useState('');
  const csvRef = useRef(null);
  const { showNotice, Notice } = useNotice();

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await servicesApi.request();
      setServices(serviceRecords(response));
    } catch (error) {
      setServices([]);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  useEffect(() => {
    if (!isOpen || !staffApi.isConfigured()) return undefined;
    let active = true;
    staffApi.request().then((response) => {
      if (active) setStaffMembers(Array.isArray(response) ? response : response?.staff || response?.items || response?.results || []);
    }).catch((error) => { if (active) showNotice(error.message); });
    return () => { active = false; };
  }, [isOpen,showNotice]);

  const visible = useMemo(() => services.filter((service) => status === 'All Status' || (status === 'Active' ? isActive(service) : !isActive(service))), [services, status]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveService = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await servicesApi.request({
        method: 'POST',
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          link: form.link.trim() || null,
          pricing_type: form.pricing_type.toLowerCase().replaceAll(' ', '_').replace('/', '_'),
          price: form.price === '' ? null : Number(form.price),
          duration: form.duration.trim() || null,
          visibility: form.visibility.toLowerCase(),
          is_active: form.is_active,
          show_price: form.show_price,
          is_bookable: form.bookable,
          assigned_staff_ids: form.assigned_staff_ids,
          intake_fields: form.intake_fields,
          ...(form.pricing_type === 'Options / packages' ? { pricing_options: pricingOptions.filter((option) => option.label.trim()).map((option) => ({ name: option.label.trim(), price: Number(option.price) })) } : {}),
        },
      });
      setForm(emptyForm);
      setPricingOptions([{ label: '', price: '' }]);
      setIsOpen(false);
      showNotice('Service saved successfully.');
      await loadServices();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const exportServices = () => downloadCsv('bellbee-services.csv', serviceHeaders, visible.map((item) => [item.name, item.description, item.link, item.pricing_type || item.pricing, item.price ?? '', item.duration || '', item.visibility || item.status || '']));

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const records = parseCsv(await file.text());
      const imported = records.map((record) => ({
        name: record.name || record['service name'] || '',
        description: record.description || '',
        link: record.link || '',
        pricing_type: record['pricing type'] || 'Flat',
        price: record.price || null,
        duration: record.duration || '',
        visibility: record.status || 'Visible',
      })).filter((service) => service.name);
      if (!imported.length) throw new Error('No services were imported. Check that your CSV has a Name or Service Name column.');
      await servicesApi.request({ method: 'POST', action: 'import', body: { services: imported } });
      showNotice(`${imported.length} service${imported.length === 1 ? '' : 's'} imported.`);
      await loadServices();
    } catch (error) {
      showNotice(error.message || 'The CSV could not be read. Please check the file format.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <PageHeader eyebrow="MANAGE" title="Services" description="Manage the services your AI assistant lets customers book." actions={<><button type="button" className="dp-secondary-button" onClick={() => csvRef.current?.click()} disabled={isImporting}><Upload size={14} /> {isImporting ? 'Importing…' : 'Import CSV'}</button><button type="button" className="dp-secondary-button" onClick={exportServices} disabled={!services.length}><Download size={14} /> Export CSV</button><button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add service</button></>} />
      <input ref={csvRef} type="file" accept=".csv,text/csv" className="dp-visually-hidden" onChange={importCsv} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel>
        <div className="dp-toolbar dp-toolbar-between"><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select><span className="dp-muted">{visible.length} services</span></div>
        {isLoading ? <div className="dp-api-empty-state">Loading services…</div> : visible.length ? (
          <div className="dp-data-list"><div className="dp-data-list-heading"><span>Service</span><span>Pricing</span><span>Duration</span><span>Visibility</span></div>
            {visible.map((item) => <div className="dp-data-list-row" key={item.id || item.service_id}><div><strong>{item.name}</strong><small>{item.description || ''}</small></div><span>{item.price != null ? `PKR ${Number(item.price).toLocaleString()}` : 'On request'}</span><span>{item.duration || 'Not set'}</span><span className={`dp-status-pill ${isActive(item) ? 'success' : 'neutral'}`}>{isActive(item) ? 'Visible' : 'Hidden'}</span></div>)}
          </div>
        ) : loadError ? <div className="dp-api-empty-state"><Briefcase size={22} /><strong>Services are ready to connect</strong><p>Connect the services API to load your saved service catalogue.</p></div> : <EmptyState icon={Briefcase} title="No services yet" description="Add services so customers can discover and book them in chat." buttonText="Add service" onAction={() => setIsOpen(true)} />}
      </Panel>
      <p className="dp-form-note">Assigned staff and business hours are managed under AI Brain → Hours & Staff.</p>
      {isOpen && <Modal title="Add service" description="Create a service your customers can enquire about or book." onClose={() => !isSaving && setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</button><button type="submit" form="service-form" className="dp-primary-button" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save service'} <Plus size={14} /></button></>}>
        <form id="service-form" className="dp-form-grid" onSubmit={saveService}>
          <FormField label="Service name"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value)} required maxLength={120} /></FormField>
          <FormField label="Pricing type"><FieldSelect value={form.pricing_type} onChange={(event) => update('pricing_type', event.target.value)}><option>Flat</option><option>Options / packages</option><option>On request</option></FieldSelect></FormField>
          <FormField label="Description" className="dp-form-full"><FieldTextarea rows={3} maxLength={500} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe this service..." /><small>{form.description.length}/500 characters</small></FormField>
          {form.pricing_type === 'Flat' && <FormField label="Price (PKR)"><FieldInput type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} /></FormField>}
          {form.pricing_type === 'Options / packages' && <div className="dp-form-full dp-service-options"><strong>Pricing options / packages</strong>{pricingOptions.map((option, index) => <div className="dp-service-option-row" key={index}><FieldInput aria-label={`Package ${index + 1} name`} value={option.label} placeholder="Package name" onChange={(event) => setPricingOptions((items) => items.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} /><FieldInput type="number" aria-label={`Package ${index + 1} price`} min="0" step="0.01" value={option.price} placeholder="Price (PKR)" onChange={(event) => setPricingOptions((items) => items.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} /><button type="button" className="dp-text-button" onClick={() => setPricingOptions((items) => items.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" className="dp-secondary-button" onClick={() => setPricingOptions((items) => [...items, { label: '', price: '' }])}><Plus size={14} /> Add option</button></div>}
          <FormField label="Duration" hint="Optional."><FieldInput value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="e.g. 60 minutes" /></FormField>
          <FormField label="Booking / service link"><FieldInput type="url" value={form.link} onChange={(event) => update('link', event.target.value)} placeholder="https://" /></FormField>
          <FormField label="Visibility"><FieldSelect value={form.visibility} onChange={(event) => update('visibility', event.target.value)}><option>Visible</option><option>Hidden</option></FieldSelect></FormField>
          <div className="dp-service-toggles dp-form-full">
            <label><input type="checkbox" checked={form.show_price} onChange={(event) => update('show_price', event.target.checked)} /><span>Show price on booking page</span></label>
            <label><input type="checkbox" checked={form.is_active} onChange={(event) => update('is_active', event.target.checked)} /><span>Active for public booking</span></label>
            <label><input type="checkbox" checked={form.bookable} onChange={(event) => update('bookable', event.target.checked)} /><span>Customers can book this as an appointment</span></label>
          </div>
          <div className="dp-form-full dp-service-staff"><strong>Assigned staff</strong>{staffMembers.length ? staffMembers.map((staff) => { const id = String(staff.id || staff.staff_id); return <label key={id}><input type="checkbox" checked={form.assigned_staff_ids.includes(id)} onChange={(event) => update('assigned_staff_ids', event.target.checked ? [...form.assigned_staff_ids, id] : form.assigned_staff_ids.filter((value) => value !== id))} /> {staff.name || staff.full_name}</label>; }) : <small>Staff will appear here when the AI Brain staff API is connected.</small>}</div>
          <div className="dp-form-full dp-service-intake"><strong>Customer intake fields</strong><div><FieldInput value={newIntakeField} onChange={(event) => setNewIntakeField(event.target.value)} placeholder="e.g. Preferred date or request details" /><button type="button" className="dp-secondary-button" onClick={() => { if (!newIntakeField.trim()) return; update('intake_fields', [...form.intake_fields, newIntakeField.trim()]); setNewIntakeField(''); }}><Plus size={14} /> Add field</button></div>{form.intake_fields.map((field, index) => <p key={index}>{field} <button type="button" className="dp-text-button" onClick={() => update('intake_fields', form.intake_fields.filter((_, i) => i !== index))}>Remove</button></p>)}</div>
        </form>
      </Modal>}
    </>
  );
}
