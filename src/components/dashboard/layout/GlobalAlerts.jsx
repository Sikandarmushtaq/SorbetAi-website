import { channelsApi } from '../../../services/dashboard/channels.api.js';
import './GlobalAlerts.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles, X } from 'lucide-react';
import { useFreePlan } from '../common/FreePlanContext';
// Displays only account alerts confirmed by the connected workspace APIs.
export default function GlobalAlerts() {
  const [whatsappVisible, setWhatsappVisible] = useState(false);
  const [whatsappKnown, setWhatsappKnown] = useState(false);
  const [planVisible, setPlanVisible] = useState(true);
  const navigate = useNavigate();
  const { isStarted, isStatusKnown, openFreePlan } = useFreePlan();

  useEffect(() => {
    let active = true;
    if (!channelsApi.isConfigured()) return undefined;
    channelsApi.request()
      .then((response) => {
        const channels = Array.isArray(response) ? response : response?.items || response?.channels || [];
        const whatsapp = response?.whatsapp || channels.find((channel) => String(channel.type || channel.name || channel.channel).toLowerCase().includes('whatsapp'));
        const connected = Boolean(whatsapp?.is_connected || whatsapp?.connected || String(whatsapp?.status).toLowerCase() === 'connected');
        if (active) {
          setWhatsappKnown(true);
          setWhatsappVisible(!connected);
        }
      })
      .catch(() => { if (active) setWhatsappKnown(false); });
    return () => { active = false; };
  }, []);

  const showWhatsappAlert = whatsappKnown && whatsappVisible;
  const showPlanAlert = isStatusKnown && !isStarted && planVisible;
  if (!showWhatsappAlert && !showPlanAlert) return null;

  return (
    <section className="db-global-alerts" aria-label="Account alerts">
      {showWhatsappAlert && <div className="db-alert db-whatsapp-alert">
        <span className="db-alert-icon"><MessageSquare size={18} /></span>
        <div className="db-alert-content"><strong>Your WhatsApp is disconnected, AI is paused</strong><span>Reconnect your WhatsApp account to receive customer messages.</span></div>
        <button type="button" className="db-alert-action" onClick={() => navigate('/whatsapp')}>Reconnect <ArrowRight size={14} /></button>
        <button type="button" className="db-alert-close" onClick={() => setWhatsappVisible(false)} aria-label="Dismiss WhatsApp alert"><X size={15} /></button>
      </div>}
      {showPlanAlert && <div className="db-alert db-plan-alert">
        <span className="db-alert-icon"><Sparkles size={18} /></span>
        <div className="db-alert-content"><strong>Your AI is off until you start your free plan.</strong><span>Free, no card needed.</span></div>
        <button type="button" className="db-alert-action" onClick={() => openFreePlan()}>Start free plan <ArrowRight size={14} /></button>
        <button type="button" className="db-alert-close" onClick={() => setPlanVisible(false)} aria-label="Dismiss free plan alert"><X size={15} /></button>
      </div>}
    </section>
  );
}
