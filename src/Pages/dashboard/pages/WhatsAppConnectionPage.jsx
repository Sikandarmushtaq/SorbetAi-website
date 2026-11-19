import { whatsappConnectionApi } from '../../../services/dashboard/whatsapp-connection.api.js';
import './WhatsAppConnectionPage.css';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, RefreshCw, ShieldCheck, Smartphone, Link2 } from 'lucide-react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
function WhatsAppBrandMark() {
  return <svg className="dp-whatsapp-brand-mark" viewBox="0 0 24 24" role="img" aria-label="WhatsApp logo"><circle cx="12" cy="12" r="10.5" fill="#25D366" /><path fill="#fff" d="M17.1 14.1c-.28-.14-1.63-.8-1.89-.89-.25-.09-.44-.14-.63.14-.19.28-.72.89-.88 1.07-.16.19-.32.21-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.54-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 2.72 1.14 2.91c.14.19 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.63-.67 1.86-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.19-.54-.33Z"/><path fill="#fff" d="M12 2.6a9.4 9.4 0 0 0-8.05 14.26L2.7 21.3l4.56-1.2A9.4 9.4 0 1 0 12 2.6Zm0 17.1c-1.42 0-2.8-.37-4.02-1.08l-.29-.17-2.7.71.72-2.63-.19-.3A7.7 7.7 0 1 1 12 19.7Z"/></svg>;
}

function whatsappInfo(response) {
  return response?.connection || response?.whatsapp || response || {};
}

// Shows the workspace's WhatsApp connection and starts the official backend-managed Meta flow.
export default function WhatsAppConnectionPage() {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const { isStarted, isChecking, openFreePlan } = useFreePlan();
  const { showNotice, Notice } = useNotice();

  const loadConnection = useCallback(async () => {
    if (!whatsappConnectionApi.isConfigured()) return;
    setLoading(true);
    setError('');
    try { setConnection(whatsappInfo(await whatsappConnectionApi.request())); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConnection(); }, [loadConnection]);

  // Starts the backend-managed Meta onboarding after the shared free-plan gate is passed.
  const performConnection = async () => {
    if (!whatsappConnectionApi.isConfigured()) return showNotice('WhatsApp connection API is not configured yet.');
    setConnecting(true);
    try {
      const response = await whatsappConnectionApi.request({ method: 'POST', action: 'connect', body: {} });
      const redirect = response?.authorization_url || response?.connect_url || response?.login_url;
      if (redirect) window.location.assign(redirect);
      else { showNotice(response?.message || 'WhatsApp connection request received.'); await loadConnection(); }
    } catch (requestError) { showNotice(requestError.message); }
    finally { setConnecting(false); }
  };

  const connectWhatsApp = () => (isStarted ? performConnection() : openFreePlan(performConnection));

  const connected = Boolean(connection?.connected || connection?.is_connected || String(connection?.status).toLowerCase() === 'connected');

  return (
    <>
      <PageHeader eyebrow="CHANNELS / WHATSAPP" title="WhatsApp connection" description="Connect your business number and manage your WhatsApp Business Platform account." actions={<button type="button" className="dp-secondary-button" onClick={loadConnection} disabled={loading}><RefreshCw size={14} /> Refresh status</button>} />
      {Notice}
      {error && <div className="dp-inline-notice dp-api-error" role="status">{error}</div>}
      <Panel className="dp-channel-connection-hero dp-whatsapp-connection-hero"><div className="dp-channel-icon green"><WhatsAppBrandMark /></div><div className="dp-channel-connection-copy"><span className="dp-section-kicker">OFFICIAL WHATSAPP BUSINESS PLATFORM</span><h2>{connected ? 'Your WhatsApp is connected' : 'Connect your business WhatsApp'}</h2><p>Let your Bellbee AI assistant answer customer messages, support conversations and help with appointments and orders on WhatsApp.</p><div className="dp-channel-connection-status"><span className={`dp-status-dot ${connected ? 'connected' : ''}`} />{loading ? 'Checking connection…' : connected ? 'Connected' : whatsappConnectionApi.isConfigured() ? connection?.status || 'Not connected' : 'Connection status unavailable'}</div></div></Panel>
      {connected ? <Panel className="dp-channel-detail-panel"><div className="dp-panel-heading"><div><span className="dp-section-kicker">CONNECTED NUMBER</span><h2>{connection?.display_phone_number || connection?.phone_number || 'WhatsApp Business number'}</h2></div><CheckCircle2 size={21} /></div><div className="dp-channel-details-grid"><div><small>Business name</small><strong>{connection?.verified_name || connection?.business_name || '—'}</strong></div><div><small>Phone number ID</small><strong>{connection?.phone_number_id || '—'}</strong></div><div><small>WhatsApp Business account</small><strong>{connection?.waba_id || '—'}</strong></div><div><small>Connection status</small><strong>{connection?.status || 'Connected'}</strong></div></div><p className="dp-form-note">To change or disconnect this number, use the account management actions provided by your backend.</p></Panel> : <Panel className="dp-channel-setup-panel"><div className="dp-panel-heading"><div><span className="dp-section-kicker">SETUP</span><h2>Connect with Meta</h2></div><ShieldCheck size={20} /></div><div className="dp-channel-setup-steps"><div><span>01</span><div><strong>Continue securely with Meta</strong><p>Sign in to the Facebook account that manages your WhatsApp Business account.</p></div></div><div><span>02</span><div><strong>Select your business and number</strong><p>Choose the correct business portfolio and verify the number you want to use.</p></div></div><div><span>03</span><div><strong>Return to Bellbee</strong><p>Bellbee will confirm the connection and show your number status here.</p></div></div></div><button type="button" className="dp-primary-button" onClick={connectWhatsApp} disabled={connecting || isChecking}>{connecting ? 'Connecting…' : isChecking ? 'Checking plan…' : !isStarted ? 'Start free plan to connect' : 'Continue with Meta'} <ArrowUpRight size={14} /></button>{!whatsappConnectionApi.isConfigured() && <p className="dp-form-note">Configure REACT_APP_API_WHATSAPP_CONNECTION_PATH to enable the Meta OAuth and number-verification flow.</p>}</Panel>}
      <div className="dp-channel-safety-note"><Smartphone size={18} /><div><strong>Keep your business number secure</strong><p>Do not paste access tokens, verification codes or provider secrets into the dashboard. The backend handles credentials and webhook verification.</p></div><Link2 size={17} /></div>
      {isChecking && <p className="dp-form-note">Checking your free-plan status…</p>}
    </>
  );
}
