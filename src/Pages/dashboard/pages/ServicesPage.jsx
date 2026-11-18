import { useRef, useState } from 'react';
import { Briefcase, Plus, Upload, Download } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { downloadCsv, parseCsv } from '../../../utils/csv';

const serviceHeaders = ['Name', 'Description', 'Link', 'Pricing Type', 'Price', 'Duration', 'Status'];

// Manages service details and the initial CSV import/export controls.
export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('All Status');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', link: '', pricing: 'Flat', price: '', duration: '', visibility: 'Visible' });
  const fileRef = useRef(null);
  const { showNotice, Notice } = useNotice();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setServices((current) => [{ ...form, id: Date.now(), active: true }, ...current]);
    setForm({ name: '', description: '', link: '', pricing: 'Flat', price: '', duration: '', visibility: 'Visible' });
    setIsOpen(false);
    showNotice('Service added to this local preview.');
  };
  const visible = services.filter((service) => status === 'All Status' || (status === 'Active' ? service.active : !service.active));
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const records = parseCsv(await file.text());
      const imported = records.map((record, index) => ({
        id: Date.now() + index,
        name: record.name || record['service name'] || '',
        description: record.description || '',
        link: record.link || '',
        pricing: record['pricing type'] || 'Flat',
        price: record.price || '',
        duration: record.duration || '',
        visibility: record.status || 'Visible',
        active: String(record.status || 'active').toLowerCase() !== 'inactive',
      })).filter((service) => service.name);
      if (!imported.length) {
        showNotice('No services were imported. Check that your CSV has a Name or Service Name column.');
      } else {
        setServices((current) => [...imported, ...current]);
        showNotice(`${imported.length} service${imported.length === 1 ? '' : 's'} imported into this local preview.`);
      }
    } catch {
      showNotice('The CSV could not be read. Please check the file format and try again.');
    } finally {
      event.target.value = '';
    }
  };
  return <>
    <PageHeader eyebrow="MANAGE" title="Services" description="Manage the services your AI assistant lets customers book." actions={<><button type="button" className="dp-secondary-button" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import CSV</button><button type="button" className="dp-secondary-button" onClick={() => downloadCsv('bellbee-services.csv', serviceHeaders, services.map((item) => [item.name, item.description, item.link, item.pricing, item.price, item.duration, item.visibility]))}><Download size={14} /> Export CSV</button><button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Add service</button></>} />
    <input ref={fileRef} type="file" accept=".csv,text/csv" className="dp-visually-hidden" onChange={handleImport} />{Notice}
    <Panel><div className="dp-toolbar"><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select></div>
      {visible.length ? <div className="dp-data-list"><div className="dp-data-list-heading"><span>Service</span><span>Pricing</span><span>Duration</span><span>Status</span></div>{visible.map((item) => <div className="dp-data-list-row" key={item.id}><strong>{item.name}</strong><span>{item.price ? `PKR ${item.price}` : 'On request'}</span><span>{item.duration || 'Not set'}</span><span className="dp-status-pill success">Active</span></div>)}</div> : <EmptyState icon={Briefcase} title="No services yet" description="Add services so customers can discover and book them in chat." buttonText="Add service" onAction={() => setIsOpen(true)} />}
    </Panel>
    <p className="dp-form-note">Assigned staff can be managed under AI Brain → Hours & Staff. Customer intake fields can be configured after the booking flow is connected.</p>
    {isOpen && <Modal title="Add service" description="Create a service your customers can enquire about or book." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="service-form" className="dp-primary-button">Save service <Plus size={14} /></button></>}>
      <form id="service-form" className="dp-form-grid" onSubmit={submit}>
        <FormField label="Service name"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value)} required /></FormField>
        <FormField label="Pricing type"><FieldSelect value={form.pricing} onChange={(event) => update('pricing', event.target.value)}><option>Flat</option><option>Options / packages</option><option>On request</option></FieldSelect></FormField>
        <FormField label="Description" className="dp-form-full"><FieldTextarea rows={3} maxLength={500} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe this service..." /><small>{form.description.length}/500 characters</small></FormField>
        <FormField label="Price (PKR)" hint="Leave blank if price is available on request."><FieldInput type="number" min="0" value={form.price} onChange={(event) => update('price', event.target.value)} /></FormField>
        <FormField label="Duration" hint="Optional."><FieldInput value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="e.g. 60 minutes" /></FormField>
        <FormField label="Booking / service link"><FieldInput type="url" value={form.link} onChange={(event) => update('link', event.target.value)} placeholder="https://" /></FormField>
        <FormField label="Visibility"><FieldSelect value={form.visibility} onChange={(event) => update('visibility', event.target.value)}><option>Visible</option><option>Hidden</option></FieldSelect></FormField>
      </form>
    </Modal>}
  </>;
}
