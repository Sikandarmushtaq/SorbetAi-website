import { useState } from 'react';
import { FileText, Lightbulb, Plus, RefreshCw } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';

// Provides a local template builder and preview; Meta submission is enabled after API integration.
export default function TemplatesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Utility', language: 'English (US)', headerType: 'None', header: '', body: 'Hello {{1}},', footer: '', buttonType: 'None' });
  const { showNotice, Notice } = useNotice();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.body.trim()) return;
    setTemplates((current) => [...current, { ...form, id: Date.now(), status: 'Draft' }]);
    setForm({ name: '', category: 'Utility', language: 'English (US)', headerType: 'None', header: '', body: 'Hello {{1}},', footer: '', buttonType: 'None' });
    setIsOpen(false);
    showNotice('Template saved as a local draft. Meta submission requires the backend connection.');
  };

  return <>
    <PageHeader eyebrow="COMMUNICATE" title="Message Templates" description="Create and manage WhatsApp Business message templates." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> New template</button>} />
    {Notice}
    <Panel>
      {templates.length ? <div className="dp-data-list"><div className="dp-data-list-heading"><span>Template</span><span>Category</span><span>Status</span></div>{templates.map((item) => <div className="dp-data-list-row" key={item.id}><strong>{item.name}</strong><span>{item.category}</span><span className="dp-status-pill warning">{item.status}</span></div>)}</div> : <EmptyState icon={FileText} title="No templates yet" description="Templates let you message customers outside the 24-hour customer service window." buttonText="Create template" onAction={() => setIsOpen(true)} />}
    </Panel>
    <div className="dp-info-card"><div className="dp-info-card-icon"><Lightbulb size={19} /></div><div><h3>About the Meta review process</h3><p>Meta usually reviews submitted templates within 24–48 hours. Approved templates can be used to message customers outside the 24-hour window. Use variables such as {'{{1}}'} for customer-specific content. Use Refresh to pull the latest status from Meta after the channel is connected.</p><button type="button" className="dp-text-button" onClick={() => showNotice('Template refresh becomes available after WhatsApp and backend integration.')}><RefreshCw size={14} /> Refresh status</button></div></div>

    {isOpen && <Modal title="Create message template" description="Build a WhatsApp template and review its preview before submission." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="template-form" className="dp-primary-button">Save draft <Plus size={14} /></button></>}>
      <form id="template-form" className="dp-form-grid" onSubmit={submit}>
        <FormField label="Template name"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. order_update" required maxLength={512} /></FormField>
        <FormField label="Category"><FieldSelect value={form.category} onChange={(event) => update('category', event.target.value)}><option>Utility</option><option>Marketing</option><option>Authentication</option></FieldSelect></FormField>
        <FormField label="Language"><FieldSelect value={form.language} onChange={(event) => update('language', event.target.value)}><option>English (US)</option><option>English (UK)</option><option>Urdu</option></FieldSelect></FormField>
        <FormField label="Header"><FieldSelect value={form.headerType} onChange={(event) => update('headerType', event.target.value)}><option>None</option><option>Text</option><option>Image</option><option>Video</option><option>Document</option></FieldSelect></FormField>
        {form.headerType !== 'None' && <FormField label={form.headerType === 'Text' ? 'Header text' : `${form.headerType} attachment`}><FieldInput value={form.header} onChange={(event) => update('header', event.target.value)} placeholder={form.headerType === 'Text' ? 'Optional heading' : 'Attachment URL (backend upload later)'} /></FormField>}
        <FormField label="Message body" className="dp-form-full"><FieldTextarea rows={5} value={form.body} onChange={(event) => update('body', event.target.value)} maxLength={1024} required /><small>Use {'{{1}}'}, {'{{2}}'} for dynamic variables. {form.body.length}/1024</small></FormField>
        <FormField label="Footer (optional)"><FieldInput value={form.footer} onChange={(event) => update('footer', event.target.value)} maxLength={60} placeholder="Up to 60 characters" /></FormField>
        <FormField label="Buttons"><FieldSelect value={form.buttonType} onChange={(event) => update('buttonType', event.target.value)}><option>None</option><option>Quick reply</option><option>Visit website</option><option>Call phone number</option></FieldSelect></FormField>
        <div className="dp-template-preview dp-form-full"><span className="dp-section-kicker">LIVE PREVIEW</span>{form.headerType === 'Text' && form.header && <strong>{form.header}</strong>}<p>{form.body || 'Your message preview will appear here.'}</p>{form.footer && <small>{form.footer}</small>}{form.buttonType !== 'None' && <span className="dp-template-preview-button">{form.buttonType}</span>}</div>
      </form>
    </Modal>}
  </>;
}
