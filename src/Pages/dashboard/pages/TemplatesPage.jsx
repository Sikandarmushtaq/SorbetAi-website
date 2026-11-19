import { templatesApi } from '../../../services/dashboard/templates.api.js';
import './TemplatesPage.css';
import { useCallback, useEffect, useState } from 'react';
import { FileText, Info, Plus, RefreshCw } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
const initialForm = {
  name: '', category: 'Utility', language: 'en_US', headerType: 'None', header: '',
  body: 'Hello {{1}},', footer: '', buttonType: 'None', buttonText: '', buttonUrl: '',
};

function templateRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.templates || [];
}

function statusClass(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'approved') return 'success';
  if (value === 'rejected') return 'danger';
  return 'warning';
}

// Loads approved WhatsApp templates from the API and submits new templates for Meta review.
export default function TemplatesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshingId, setRefreshingId] = useState('');
  const [loadError, setLoadError] = useState('');
  const { showNotice, Notice } = useNotice();

  const loadTemplates = useCallback(async (refresh = false) => {
    setLoadError('');
    try {
      const response = await templatesApi.request({ query: refresh ? { refresh_meta_status: true } : undefined });
      setTemplates(templateRecords(response));
    } catch (error) {
      setLoadError(error.message);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(), category: form.category, language: form.language,
        header: form.headerType === 'None' ? null : { type: form.headerType.toLowerCase(), value: form.header },
        body: form.body.trim(), footer: form.footer.trim() || null,
        buttons: form.buttonType === 'None' ? [] : [{ type: form.buttonType.toLowerCase().replace(' ', '_'), text: form.buttonText, ...(form.buttonType === 'URL' ? { url: form.buttonUrl } : {}) }],
      };
      const created = await templatesApi.request({ method: 'POST', body: payload });
      const newTemplate = created?.template || created;
      if (newTemplate && (newTemplate.id || newTemplate.name)) setTemplates((current) => [newTemplate, ...current]);
      setForm(initialForm);
      setIsOpen(false);
      showNotice('Template submitted. Its status will update when Meta completes the review.');
      loadTemplates();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshTemplate = async (template) => {
    const id = template.id || template.template_id;
    setRefreshingId(String(id));
    try {
      const response = await templatesApi.request({ id, query: { refresh_meta_status: true } });
      const updated = response?.template || response;
      if (updated) setTemplates((current) => current.map((item) => String(item.id || item.template_id) === String(id) ? { ...item, ...updated } : item));
      showNotice('Template status refreshed from the connected Meta account.');
    } catch (error) {
      showNotice(error.message);
    } finally {
      setRefreshingId('');
    }
  };

  return (
    <>
      <PageHeader
        title="Message Templates"
        description="Create and manage WhatsApp Business message templates. Meta reviews each submission (24–48 hrs)."
        actions={(
          <>
            <button type="button" className="dp-secondary-button" onClick={() => loadTemplates(true)} disabled={isLoading}><RefreshCw size={14} /> Refresh</button>
            <button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> New Template</button>
          </>
        )}
      />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel className="dp-template-list-panel">
        {isLoading ? <div className="dp-api-empty-state">Loading WhatsApp templates…</div> : templates.length ? (
          <div className="dp-template-list">
            {templates.map((template) => {
              const id = String(template.id || template.template_id || template.name);
              return (
                <article className="dp-template-row" key={id}>
                  <span className="dp-template-row-icon"><FileText size={18} /></span>
                  <div className="dp-template-row-main">
                    <strong>{template.name}</strong>
                    <small>{template.category || '—'} · {template.language || '—'}</small>
                    {String(template.status).toLowerCase() === 'rejected' && template.rejection_reason && <p className="dp-template-rejection">{template.rejection_reason}</p>}
                  </div>
                  <span className={`dp-status-pill ${statusClass(template.status)}`}>{template.status || 'Pending'}</span>
                  <button type="button" className="dp-icon-action" onClick={() => refreshTemplate(template)} disabled={refreshingId === id} aria-label={`Refresh ${template.name} status`}>
                    <RefreshCw size={14} className={refreshingId === id ? 'dp-spin' : ''} />
                  </button>
                </article>
              );
            })}
          </div>
        ) : loadError ? (
          <div className="dp-api-empty-state"><FileText size={22} /><strong>Templates are ready to connect</strong><p>Connect the WhatsApp templates API to load saved templates and their Meta review status.</p></div>
        ) : (
          <EmptyState icon={FileText} title="No templates yet" description="Templates let you message customers outside the 24-hour window." />
        )}
      </Panel>

      <div className="dp-info-card dp-template-info-card">
        <div className="dp-info-card-icon"><Info size={18} /></div>
        <div>
          <h3>About the Meta review process</h3>
          <p>Submit a template and Meta reviews it (usually 24–48 hrs). Once <strong className="dp-approved-word">Approved</strong>, use it in campaigns to message customers who haven't contacted you in the last 24 hours. Use <code>{'{{1}}'}</code> for dynamic variables. Click the refresh icon to pull the latest status from Meta without waiting for a webhook.</p>
        </div>
      </div>

      {isOpen && <Modal
        title="New Template"
        description="Create a WhatsApp Business template for Meta review."
        onClose={() => setIsOpen(false)}
        footer={(
          <>
            <button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button type="submit" form="template-form" className="dp-primary-button" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit to Meta'}</button>
          </>
        )}
      >
        <form id="template-form" className="dp-form-grid" onSubmit={submit}>
          <FormField label="Template name"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="e.g. order_update" required maxLength={512} /></FormField>
          <FormField label="Category"><FieldSelect value={form.category} onChange={(event) => update('category', event.target.value)}><option>Marketing</option><option>Utility</option><option>Authentication</option></FieldSelect></FormField>
          <FormField label="Language"><FieldSelect value={form.language} onChange={(event) => update('language', event.target.value)}><option value="en_US">English (US)</option><option value="en_GB">English (UK)</option><option value="ur">Urdu</option></FieldSelect></FormField>
          <FormField label="Optional header"><FieldSelect value={form.headerType} onChange={(event) => update('headerType', event.target.value)}><option>None</option><option>Text</option><option>Image</option><option>Video</option><option>Document</option></FieldSelect></FormField>
          {form.headerType !== 'None' && <FormField label={form.headerType === 'Text' ? 'Header text' : `${form.headerType} media URL`}><FieldInput value={form.header} onChange={(event) => update('header', event.target.value)} placeholder={form.headerType === 'Text' ? 'Optional heading' : 'Media URL'} required /></FormField>}
          <FormField label="Body" className="dp-form-full"><FieldTextarea rows={5} value={form.body} onChange={(event) => update('body', event.target.value)} maxLength={1024} required /><small>Use {'{{1}}'}, {'{{2}}'} for dynamic variables. {form.body.length}/1024</small></FormField>
          <FormField label="Optional footer"><FieldInput value={form.footer} onChange={(event) => update('footer', event.target.value)} maxLength={60} placeholder="Up to 60 characters" /></FormField>
          <FormField label="Optional button"><FieldSelect value={form.buttonType} onChange={(event) => update('buttonType', event.target.value)}><option>None</option><option>Quick reply</option><option>URL</option></FieldSelect></FormField>
          {form.buttonType !== 'None' && <FormField label="Button text"><FieldInput value={form.buttonText} onChange={(event) => update('buttonText', event.target.value)} placeholder="Button label" maxLength={25} required /></FormField>}
          {form.buttonType === 'URL' && <FormField label="Button URL"><FieldInput type="url" value={form.buttonUrl} onChange={(event) => update('buttonUrl', event.target.value)} placeholder="https://" required /></FormField>}
          <div className="dp-template-preview dp-form-full"><span className="dp-section-kicker">LIVE PREVIEW</span>{form.headerType === 'Text' && form.header && <strong>{form.header}</strong>}<p>{form.body || 'Your message preview will appear here.'}</p>{form.footer && <small>{form.footer}</small>}{form.buttonType !== 'None' && <span className="dp-template-preview-button">{form.buttonText || form.buttonType}</span>}</div>
        </form>
      </Modal>}
    </>
  );
}
