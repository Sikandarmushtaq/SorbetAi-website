import { useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';

// Creates campaign drafts locally until WhatsApp broadcast APIs are connected.
export default function CampaignsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'Text', message: '', audience: 'All contacts' });
  const { showNotice, Notice } = useNotice();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setCampaigns((current) => [...current, { ...form, id: Date.now(), status: 'Draft' }]);
    setForm({ name: '', type: 'Text', message: '', audience: 'All contacts' });
    setIsOpen(false);
    showNotice('Campaign saved as a local draft. Sending will be enabled after WhatsApp backend integration.');
  };
  return <>
    <PageHeader eyebrow="COMMUNICATE" title="Campaigns" description="Broadcast WhatsApp messages to your customer segments." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> New campaign</button>} />
    {Notice}
    <Panel>{campaigns.length ? <div className="dp-data-list"><div className="dp-data-list-heading"><span>Campaign</span><span>Audience</span><span>Type</span><span>Status</span></div>{campaigns.map((campaign) => <div className="dp-data-list-row" key={campaign.id}><strong>{campaign.name}</strong><span>{campaign.audience}</span><span>{campaign.type}</span><span className="dp-status-pill warning">{campaign.status}</span></div>)}</div> : <EmptyState icon={Megaphone} title="No campaigns yet" description="Create a campaign to broadcast WhatsApp messages to your contacts." buttonText="Create campaign" onAction={() => setIsOpen(true)} />}</Panel>
    {isOpen && <Modal title="New campaign" description="Prepare a message and choose who should receive it." onClose={() => setIsOpen(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)}>Cancel</button><button type="submit" form="campaign-form" className="dp-primary-button">Save campaign <Plus size={14} /></button></>}>
      <form id="campaign-form" className="dp-form-grid" onSubmit={submit}>
        <FormField label="Campaign name" className="dp-form-full"><FieldInput value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Give your campaign a name" required /></FormField>
        <FormField label="Message type"><FieldSelect value={form.type} onChange={(event) => update('type', event.target.value)}><option>Text</option><option>Image</option><option>Document</option><option>Template</option></FieldSelect></FormField>
        <FormField label="Audience"><FieldSelect value={form.audience} onChange={(event) => update('audience', event.target.value)}><option>All contacts</option><option>New customers</option><option>VIP customers</option><option>Recently active customers</option></FieldSelect></FormField>
        <FormField label={form.type === 'Text' ? 'Message' : `${form.type} message`} className="dp-form-full"><FieldTextarea rows={5} value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Write the message you want to send..." required /></FormField>
        <p className="dp-form-note dp-form-full">This saves a draft only. Actual delivery requires a connected WhatsApp account and backend campaign service.</p>
      </form>
    </Modal>}
  </>;
}
