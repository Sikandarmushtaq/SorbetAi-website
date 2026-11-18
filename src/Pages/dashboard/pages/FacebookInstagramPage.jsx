import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, MessageCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

function BrandMark({ type }) {
  if (type === 'facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.098 4.388 23.09 10.125 24v-8.438H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.954.931-1.954 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.09 24 18.098 24 12.073Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="bellbeeInstagramGradient" x1="0" y1="24" x2="24" y2="0"><stop stopColor="#FEDA75"/><stop offset=".45" stopColor="#D62976"/><stop offset="1" stopColor="#4F5BD5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="url(#bellbeeInstagramGradient)" strokeWidth="2.2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="url(#bellbeeInstagramGradient)" strokeWidth="2"/><circle cx="18" cy="6.5" r="1.3" fill="#D62976"/></svg>;
}

function connectionList(response) {
  const items = Array.isArray(response) ? response : response?.connections || response?.items || [];
  const byType = (type) => items.find((item) => String(item.provider || item.type || item.name || '').toLowerCase().includes(type));
  return { facebook: byType('facebook'), instagram: byType('instagram') };
}

// Loads Meta channel state and uses backend-issued OAuth redirects for account connection.
export default function FacebookInstagramPage() {
  const [connections, setConnections] = useState({ facebook: null, instagram: null });
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState('');
  const [error, setError] = useState('');
  const { isStarted, isChecking, openFreePlan } = useFreePlan();
  const { showNotice, Notice } = useNotice();

  const loadConnections = useCallback(async () => {
    if (!isResourceConfigured('socialConnections')) return;
    setLoading(true);
    setError('');
    try { setConnections(connectionList(await resourceRequest('socialConnections'))); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // Starts the requested Meta OAuth flow after the shared free-plan gate is passed.
  const performConnection = async (provider) => {
    if (!isResourceConfigured('socialConnections')) return showNotice('Facebook and Instagram connection API is not configured yet.');
    setConnecting(provider);
    try {
      const response = await resourceRequest('socialConnections', { method: 'POST', id: provider, action: 'connect', body: {} });
      const redirect = response?.authorization_url || response?.connect_url || response?.login_url;
      if (redirect) window.location.assign(redirect);
      else { showNotice(response?.message || `${provider} connection request received.`); await loadConnections(); }
    } catch (requestError) { showNotice(requestError.message); }
    finally { setConnecting(''); }
  };

  const connect = (provider) => (isStarted ? performConnection(provider) : openFreePlan(() => performConnection(provider)));

  const status = (value) => value?.connected || value?.is_connected || String(value?.status).toLowerCase() === 'connected';

  return (
    <>
      <PageHeader eyebrow="CHANNELS / META" title="Facebook & Instagram" description="Connect your Facebook Page and Instagram professional account to one Bellbee inbox." actions={<button type="button" className="dp-secondary-button" onClick={loadConnections} disabled={loading}><RefreshCw size={14} /> Refresh</button>} />
      {Notice}
      {error && <div className="dp-inline-notice dp-api-error" role="status">{error}</div>}
      <Panel className="dp-meta-intro"><div className="dp-meta-brand-pair"><span><BrandMark type="facebook" /></span><span><BrandMark type="instagram" /></span></div><div><span className="dp-section-kicker">ONE SHARED INBOX</span><h2>Keep every social conversation together</h2><p>Messages and comments from your Facebook Page and Instagram professional account can appear in Chats, alongside WhatsApp and Website Chat. Your AI assistant can reply when the backend and Meta permissions are connected.</p></div></Panel>
      <div className="dp-meta-connection-grid">
        {[['facebook', 'Facebook Page', 'Connect the Page that represents your business. Messenger conversations and eligible post comments can flow into Bellbee.'], ['instagram', 'Instagram professional account', 'Connect an eligible professional account to manage Instagram messages and supported comments.']].map(([provider, title, description]) => {
          const value = connections[provider];
          const connected = status(value);
          return <Panel className="dp-meta-provider-card" key={provider}><div className="dp-meta-provider-heading"><span><BrandMark type={provider} /></span><span className={`dp-status-pill ${connected ? 'success' : 'neutral'}`}>{loading ? 'Checking…' : connected ? 'Connected' : value?.status || 'Not connected'}</span></div><h3>{title}</h3><p>{description}</p>{connected ? <div className="dp-meta-account"><CheckCircle2 size={16} /><div><strong>{value?.page_name || value?.username || value?.account_name || 'Account connected'}</strong><small>{value?.account_id || value?.page_id || 'Connection confirmed by Meta'}</small></div></div> : <button type="button" className="dp-primary-button" onClick={() => connect(provider)} disabled={Boolean(connecting) || isChecking}>{connecting === provider ? 'Connecting…' : !isStarted ? 'Start free plan to connect' : 'Continue with Meta'} <ArrowUpRight size={14} /></button>}</Panel>;
        })}
      </div>
      <Panel className="dp-meta-permissions"><div className="dp-panel-heading"><div><span className="dp-section-kicker">PERMISSIONS & PRIVACY</span><h2>Secure Meta connection</h2></div><ShieldCheck size={20} /></div><div className="dp-meta-permission-grid"><div><MessageCircle size={18} /><strong>Messages</strong><p>Receive supported customer messages in Chats.</p></div><div><Users size={18} /><strong>Comments</strong><p>Bring eligible comments into the shared inbox.</p></div><div><ShieldCheck size={18} /><strong>Protected access</strong><p>Meta tokens and webhook secrets stay on the backend.</p></div></div>{!isResourceConfigured('socialConnections') && <p className="dp-form-note">Configure REACT_APP_API_SOCIAL_CONNECTIONS_PATH to enable account status, Meta OAuth and disconnect actions.</p>}</Panel>
    </>
  );
}
