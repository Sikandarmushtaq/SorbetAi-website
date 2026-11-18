import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Megaphone, Plus, Users } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const campaignSteps = ['Campaign name', 'Template', 'Audience', 'Schedule', 'Review & send'];
const emptyForm = { name: '', templateId: '', audienceType: 'all', label: '', scheduleType: 'now', scheduledAt: '' };

function listFrom(response, key) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.[key] || [];
}

// Builds WhatsApp campaigns from approved templates and API-backed customer segments.
export default function CampaignsPage() {
  const navigate = useNavigate();
  const { showNotice, Notice } = useNotice();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customerLabels, setCustomerLabels] = useState([]);
  const [audienceSize, setAudienceSize] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadCampaignData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    const requests = await Promise.allSettled([
      resourceRequest('campaigns'),
      resourceRequest('templates'),
      isResourceConfigured('customers') ? resourceRequest('customers') : Promise.resolve(null),
    ]);
    if (requests[0].status === 'fulfilled') setCampaigns(listFrom(requests[0].value, 'campaigns'));
    else setLoadError(requests[0].reason.message);
    if (requests[1].status === 'fulfilled') setTemplates(listFrom(requests[1].value, 'templates'));
    else if (!loadError) setLoadError(requests[1].reason.message);
    if (requests[2].status === 'fulfilled' && requests[2].value) {
      const customerResponse = requests[2].value;
      const customers = listFrom(customerResponse, 'customers');
      setCustomerLabels([...new Set(customers.flatMap((customer) => Array.isArray(customer.labels) ? customer.labels : []))].filter(Boolean));
      setAudienceSize(customerResponse?.total_count ?? customerResponse?.total ?? customers.length);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadCampaignData(); }, [loadCampaignData]);

  const approvedTemplates = useMemo(() => templates.filter((template) => String(template.status).toLowerCase() === 'approved'), [templates]);
  const chosenTemplate = approvedTemplates.find((template) => String(template.id || template.template_id) === String(form.templateId));

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const openWizard = () => {
    setForm({ ...emptyForm, templateId: approvedTemplates[0] ? String(approvedTemplates[0].id || approvedTemplates[0].template_id) : '' });
    setStep(0);
    setIsOpen(true);
  };
  const closeWizard = () => { if (!isSubmitting) setIsOpen(false); };
  const canContinue = () => {
    if (step === 0) return Boolean(form.name.trim());
    if (step === 1) return Boolean(form.templateId && approvedTemplates.some((template) => String(template.id || template.template_id) === String(form.templateId)));
    if (step === 2) return form.audienceType === 'all' || Boolean(form.label);
    if (step === 3) return form.scheduleType === 'now' || Boolean(form.scheduledAt);
    return true;
  };

  const submitCampaign = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        template_id: form.templateId,
        audience: form.audienceType === 'all' ? { type: 'all_customers' } : { type: 'label', label: form.label },
        schedule: form.scheduleType === 'now' ? { type: 'now' } : { type: 'scheduled', scheduled_at: new Date(form.scheduledAt).toISOString() },
      };
      const response = await resourceRequest('campaigns', { method: 'POST', body: payload });
      const created = response?.campaign || response;
      if (created && (created.id || created.campaign_id)) setCampaigns((current) => [created, ...current]);
      setIsOpen(false);
      setForm(emptyForm);
      showNotice('Campaign submitted to the campaign service. Its delivery status will appear here.');
      loadCampaignData();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Campaigns" description="Broadcast WhatsApp messages to your customer segments." actions={<button type="button" className="dp-primary-button" onClick={openWizard}><Plus size={15} /> New Campaign</button>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel className="dp-campaigns-panel">
        {isLoading ? <div className="dp-api-empty-state">Loading campaigns…</div> : campaigns.length ? (
          <div className="dp-campaign-list">
            <div className="dp-campaign-list-head"><span>Campaign</span><span>Template</span><span>Audience</span><span>Status</span><span>Sent / Delivered</span><span>Date</span></div>
            {campaigns.map((campaign) => (
              <article className="dp-campaign-row" key={campaign.id || campaign.campaign_id}>
                <strong>{campaign.name}</strong>
                <span>{campaign.template_name || campaign.template?.name || '—'}</span>
                <span>{campaign.audience_size ?? campaign.audience_count ?? '—'}</span>
                <span className={`dp-status-pill ${campaignStatusClass(campaign.status)}`}>{campaign.status || 'Draft'}</span>
                <span>{campaign.sent_count ?? '—'} / {campaign.delivered_count ?? '—'}</span>
                <time>{formatCampaignDate(campaign.scheduled_at || campaign.created_at)}</time>
              </article>
            ))}
          </div>
        ) : loadError ? (
          <div className="dp-api-empty-state"><Megaphone size={22} /><strong>Campaigns are ready to connect</strong><p>Connect the campaigns and templates APIs to create and review WhatsApp broadcasts.</p></div>
        ) : (
          <EmptyState icon={Megaphone} title="No campaigns yet" description="Create a campaign to broadcast WhatsApp messages to your contacts." buttonText="New Campaign" onAction={openWizard} />
        )}
      </Panel>

      {isOpen && <Modal
        title="New Campaign"
        description={`Step ${step + 1} of ${campaignSteps.length} · ${campaignSteps[step]}`}
        onClose={closeWizard}
        footer={(
          <>
            {step > 0 && <button type="button" className="dp-secondary-button" onClick={() => setStep((current) => current - 1)} disabled={isSubmitting}><ArrowLeft size={14} /> Back</button>}
            {step < campaignSteps.length - 1 ? (
              <button type="button" className="dp-primary-button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue()}>Continue <ArrowRight size={14} /></button>
            ) : (
              <button type="button" className="dp-primary-button" onClick={submitCampaign} disabled={isSubmitting || !canContinue()}>{isSubmitting ? 'Sending…' : form.scheduleType === 'now' ? 'Review and send' : 'Schedule campaign'} <ArrowRight size={14} /></button>
            )}
          </>
        )}
      >
        <div className="dp-campaign-stepper">{campaignSteps.map((label, index) => <span key={label} className={index <= step ? 'active' : ''}>{index + 1}</span>)}</div>
        {step === 0 && <div className="dp-campaign-step"><FormField label="Campaign name"><FieldInput autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Give your campaign a name" maxLength={120} required /></FormField></div>}
        {step === 1 && <div className="dp-campaign-step">
          {approvedTemplates.length ? <FormField label="Choose an approved WhatsApp template"><FieldSelect value={form.templateId} onChange={(event) => update('templateId', event.target.value)}><option value="">Select a template</option>{approvedTemplates.map((template) => <option key={template.id || template.template_id} value={template.id || template.template_id}>{template.name}</option>)}</FieldSelect></FormField> : <div className="dp-campaign-no-templates"><FileTemplateIcon /><strong>No approved templates yet</strong><p>Only templates approved by Meta can be used in campaigns.</p><button type="button" className="dp-text-button" onClick={() => { setIsOpen(false); navigate('/dashboard/templates'); }}>Open Message Templates <ArrowRight size={14} /></button></div>}
        </div>}
        {step === 2 && <div className="dp-campaign-step">
          <div className="dp-campaign-audience-options">
            <label className={form.audienceType === 'all' ? 'selected' : ''}><input type="radio" name="audience" checked={form.audienceType === 'all'} onChange={() => update('audienceType', 'all')} /><Users size={18} /><span><strong>All customers</strong><small>{audienceSize === null ? 'Audience size will load from your customers API.' : `${audienceSize} customers`}</small></span></label>
            <label className={form.audienceType === 'label' ? 'selected' : ''}><input type="radio" name="audience" checked={form.audienceType === 'label'} onChange={() => update('audienceType', 'label')} /><Users size={18} /><span><strong>Customers by label</strong><small>Send to a selected customer segment.</small></span></label>
          </div>
          {form.audienceType === 'label' && <FormField label="Customer label"><FieldSelect value={form.label} onChange={(event) => update('label', event.target.value)}><option value="">Choose a label</option>{customerLabels.map((label) => <option key={label}>{label}</option>)}</FieldSelect></FormField>}
        </div>}
        {step === 3 && <div className="dp-campaign-step">
          <div className="dp-campaign-schedule-options"><label className={form.scheduleType === 'now' ? 'selected' : ''}><input type="radio" checked={form.scheduleType === 'now'} onChange={() => update('scheduleType', 'now')} />Send now</label><label className={form.scheduleType === 'later' ? 'selected' : ''}><input type="radio" checked={form.scheduleType === 'later'} onChange={() => update('scheduleType', 'later')} />Schedule for later</label></div>
          {form.scheduleType === 'later' && <FormField label="Schedule date and time"><FieldInput type="datetime-local" value={form.scheduledAt} onChange={(event) => update('scheduledAt', event.target.value)} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} required /></FormField>}
        </div>}
        {step === 4 && <div className="dp-campaign-review">
          <h3>Review your campaign</h3>
          <ReviewRow label="Campaign" value={form.name} />
          <ReviewRow label="Template" value={chosenTemplate?.name || '—'} />
          <ReviewRow label="Audience" value={form.audienceType === 'all' ? `All customers (${audienceSize ?? 'API count unavailable'})` : `Label: ${form.label}`} />
          <ReviewRow label="Schedule" value={form.scheduleType === 'now' ? 'Send now' : new Date(form.scheduledAt).toLocaleString()} />
          <p className="dp-form-note">The campaign service will validate the audience and send or schedule the broadcast after you submit.</p>
        </div>}
      </Modal>}
    </>
  );
}

function ReviewRow({ label, value }) { return <div className="dp-campaign-review-row"><span>{label}</span><strong>{value}</strong></div>; }
function FileTemplateIcon() { return <Megaphone size={22} />; }
function campaignStatusClass(status) {
  const value = String(status || 'draft').toLowerCase();
  if (value === 'sent') return 'success';
  if (value === 'sending') return 'warning';
  if (value === 'scheduled') return 'info';
  return 'neutral';
}
function formatCampaignDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
