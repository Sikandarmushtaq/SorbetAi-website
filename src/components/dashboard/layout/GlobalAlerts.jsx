import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles, X } from 'lucide-react';

// Displays dismissible account alerts; the initial visibility will later come from account status APIs.
export default function GlobalAlerts() {
  const [whatsappVisible, setWhatsappVisible] = useState(true);
  const [planVisible, setPlanVisible] = useState(true);
  const navigate = useNavigate();

  if (!whatsappVisible && !planVisible) return null;

  return (
    <section className="db-global-alerts" aria-label="Account alerts">
      {whatsappVisible && <div className="db-alert db-whatsapp-alert">
        <span className="db-alert-icon"><MessageSquare size={18} /></span>
        <div className="db-alert-content"><strong>Your WhatsApp is disconnected, AI is paused</strong><span>Reconnect your WhatsApp account to receive customer messages.</span></div>
        <button type="button" className="db-alert-action" onClick={() => navigate('/dashboard/channels')}>Reconnect <ArrowRight size={14} /></button>
        <button type="button" className="db-alert-close" onClick={() => setWhatsappVisible(false)} aria-label="Dismiss WhatsApp alert"><X size={15} /></button>
      </div>}
      {planVisible && <div className="db-alert db-plan-alert">
        <span className="db-alert-icon"><Sparkles size={18} /></span>
        <div className="db-alert-content"><strong>Your AI is off until you start your free plan.</strong><span>Free, no card needed.</span></div>
        <button type="button" className="db-alert-action" onClick={() => navigate('/dashboard/billing')}>Start free plan <ArrowRight size={14} /></button>
        <button type="button" className="db-alert-close" onClick={() => setPlanVisible(false)} aria-label="Dismiss free plan alert"><X size={15} /></button>
      </div>}
    </section>
  );
}
