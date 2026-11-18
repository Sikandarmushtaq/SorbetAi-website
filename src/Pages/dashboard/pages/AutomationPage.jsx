import { useState } from 'react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';

const initialSettings = {
  cartRecovery: false, appointmentReminders: false, templateFirst: false,
  sendDocuments: true, cancelAppointments: true, cancelOrders: true,
  rescheduleAppointments: true, understandPhotos: true, transcribeVoice: true,
  confirmAppointments: false, confirmOrders: false,
};

// Controls frontend automation preferences; values remain local until the settings API is added.
export default function AutomationPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [handover, setHandover] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash on delivery only');
  const { showNotice, Notice } = useNotice();
  const toggle = (key) => setSettings((current) => ({ ...current, [key]: !current[key] }));
  const enabledCount = Object.values(settings).filter(Boolean).length;
  return <><PageHeader eyebrow="SYSTEM" title="Automation Settings" description="Choose what Bellbee can do automatically and when your team should take over." />{Notice}<div className="dp-automation-summary"><div><span>Proactive messaging</span><strong>{Number(settings.cartRecovery) + Number(settings.appointmentReminders) + Number(settings.templateFirst)} <small>/ 3</small></strong><p>Cart recovery, reminders and template-first</p></div><div><span>AI autonomy</span><strong>{enabledCount - 3} <small>/ 8</small></strong><p>Actions your AI can perform</p></div><div><span>Payment mode</span><strong>{paymentMode === 'Cash on delivery only' ? 'Cash on delivery' : 'Custom'}</strong><p>How customers pay</p></div></div>
    <SettingsPanel kicker="PROACTIVE MESSAGING" title="Customer follow-ups"><Toggle id="cartRecovery" title="Abandoned Cart Recovery" description="Follow up with customers who start an order but do not finish it. Requires a connected store and approved WhatsApp template." settings={settings} onToggle={toggle} /><Toggle id="appointmentReminders" title="Appointment Reminders" description="Send a reminder before an appointment. Requires an approved template and connected WhatsApp." settings={settings} onToggle={toggle} /><Toggle id="templateFirst" title="Template-First Mode" description="Use an approved WhatsApp template as the first message to a new customer." settings={settings} onToggle={toggle} /></SettingsPanel>
    <SettingsPanel kicker="AI AUTONOMY" title="AI Behavior"><p className="dp-panel-description">Turn off any action the AI should not perform without your approval.</p><Toggle id="sendDocuments" title="Send documents automatically" description="Send your menu, price list or catalogue when a customer asks." settings={settings} onToggle={toggle} /><Toggle id="cancelAppointments" title="Cancel appointments automatically" description="Allow the AI to cancel an appointment on the customer's request." settings={settings} onToggle={toggle} /><Toggle id="cancelOrders" title="Cancel orders automatically" description="Allow the AI to cancel an order on the customer's request." settings={settings} onToggle={toggle} /><Toggle id="rescheduleAppointments" title="Reschedule appointments automatically" description="Allow the AI to move an appointment to a new time." settings={settings} onToggle={toggle} /><Toggle id="understandPhotos" title="Understand photos" description="Let the AI review customer photos and try to match them to your products." settings={settings} onToggle={toggle} /><Toggle id="transcribeVoice" title="Transcribe voice notes" description="Let the AI transcribe and reply to customer voice notes." settings={settings} onToggle={toggle} /><Toggle id="confirmAppointments" title="Confirm appointments instantly" description="Confirm a booking immediately instead of leaving it pending review. Off by default." settings={settings} onToggle={toggle} /><Toggle id="confirmOrders" title="Confirm orders instantly" description="Confirm an order immediately instead of leaving it pending review. Off by default." settings={settings} onToggle={toggle} /></SettingsPanel>
    <SettingsPanel kicker="HAND OVER TO YOU" title="Human handover"><p className="dp-panel-description">Describe when the AI should stop and ask your team to handle the conversation.</p><textarea className="dp-textarea" rows={4} value={handover} onChange={(event) => setHandover(event.target.value)} placeholder="For example: hand over refund requests, complaints, or questions the AI cannot answer confidently..." /><button type="button" className="dp-secondary-button dp-settings-save" onClick={() => showNotice('Handover instructions saved in this local preview only.')}>Save instructions</button></SettingsPanel>
    <SettingsPanel kicker="PAYMENT COLLECTION" title="How customers pay you"><div className="dp-payment-options">{[['Cash on delivery only', 'No payment link is sent. This is the standard COD flow.'], ['Share my payment details', 'The AI can share your JazzCash, Easypaisa or bank details in chat.'], ['Connect a payment gateway', 'Customers pay through a secure checkout link.']].map(([name, detail]) => <label className={`dp-payment-option ${paymentMode === name ? 'selected' : ''}`} key={name}><input type="radio" name="paymentMode" value={name} checked={paymentMode === name} onChange={() => setPaymentMode(name)} /><span><strong>{name}</strong><small>{detail}</small></span></label>)}</div><button type="button" className="dp-secondary-button dp-settings-save" onClick={() => showNotice('Payment preference saved in this local preview only.')}>Save payment preference</button></SettingsPanel>
  </>;
}

function SettingsPanel({ kicker, title, children }) {
  return <Panel className="dp-settings-panel"><span className="dp-section-kicker">{kicker}</span><h2>{title}</h2>{children}</Panel>;
}

function Toggle({ id, title, description, settings, onToggle }) {
  return <div className="dp-toggle-row"><div><strong>{title}</strong><p>{description}</p></div><button type="button" role="switch" aria-checked={settings[id]} aria-label={title} className={`dp-switch ${settings[id] ? 'on' : ''}`} onClick={() => onToggle(id)}><span /></button></div>;
}
