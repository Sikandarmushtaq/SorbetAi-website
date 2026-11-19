import { paymentCollectionApi } from '../../../services/dashboard/payment-collection.api.js';
import './PaymentCollectionPage.css';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CreditCard, Link2, LockKeyhole, Plus, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { EmptyState, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
function connectionsFrom(response) {
  return Array.isArray(response) ? response : response?.connections || response?.payment_methods || response?.items || [];
}

// Loads payment providers from the backend and starts only server-issued connection flows.
export default function PaymentCollectionPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyProvider, setBusyProvider] = useState('');
  const [error, setError] = useState('');
  const { showNotice, Notice } = useNotice();

  const loadConnections = useCallback(async () => {
    if (!paymentCollectionApi.isConfigured()) return;
    setLoading(true);
    setError('');
    try { setConnections(connectionsFrom(await paymentCollectionApi.request())); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // Starts the selected provider's secure onboarding flow using a URL returned by the backend.
  const connectProvider = async (provider) => {
    if (!paymentCollectionApi.isConfigured()) return showNotice('Payment connection API is not configured yet.');
    setBusyProvider(provider);
    try {
      const result = await paymentCollectionApi.request({ method: 'POST', id: provider, action: 'connect', body: {} });
      const redirect = result?.authorization_url || result?.connect_url || result?.checkout_url;
      if (redirect) window.location.assign(redirect);
      else { showNotice(result?.message || 'Connection request received.'); await loadConnections(); }
    } catch (requestError) { showNotice(requestError.message); }
    finally { setBusyProvider(''); }
  };

  const disconnectProvider = async (connection) => {
    const provider = connection.provider || connection.id;
    setBusyProvider(provider);
    try {
      await paymentCollectionApi.request({ method: 'POST', id: provider, action: 'disconnect', body: {} });
      await loadConnections();
      showNotice('Payment provider disconnected.');
    } catch (requestError) { showNotice(requestError.message); }
    finally { setBusyProvider(''); }
  };

  return (
    <>
      <PageHeader eyebrow="BILLING / PAYMENT COLLECTION" title="Payment collection" description="Connect payment providers so your business can collect payments securely." actions={<button type="button" className="dp-secondary-button" onClick={loadConnections} disabled={loading}><RefreshCw size={14} /> Refresh</button>} />
      {Notice}
      {error && <div className="dp-inline-notice dp-api-error" role="status">{error}</div>}
      <Panel className="dp-payment-hero"><div className="dp-billing-hero-icon"><Wallet size={22} /></div><span className="dp-section-kicker">PAYMENTS FOR YOUR BUSINESS</span><h2>Bring customer payments into one place</h2><p>Connect a supported payment provider to make payment collection available across conversations, bookings and orders. Provider availability and account status are confirmed by Bellbee's backend.</p><div className="dp-payment-security"><ShieldCheck size={16} /> Your payment credentials stay with the payment provider and Bellbee backend.</div></Panel>
      <div className="dp-section-heading"><div><span className="dp-section-kicker">CONNECTED PROVIDERS</span><h2>Your payment connections</h2></div><span className={`dp-status-pill ${connections.some((item) => item.connected || item.status === 'connected') ? 'success' : 'neutral'}`}>{connections.filter((item) => item.connected || item.status === 'connected').length} connected</span></div>
      {loading ? <div className="dp-api-empty-state">Loading payment connections…</div> : connections.length ? <div className="dp-payment-provider-grid">{connections.map((connection, index) => {
        const name = connection.display_name || connection.name || connection.provider || 'Payment provider';
        const connected = connection.connected || String(connection.status).toLowerCase() === 'connected';
        const provider = connection.provider || connection.id || name.toLowerCase().replace(/\s+/g, '-');
        return <Panel className="dp-payment-provider-card" key={connection.id || provider || index}><div className="dp-payment-provider-top"><span className="dp-connection-icon"><CreditCard size={20} /></span><span className={`dp-status-pill ${connected ? 'success' : 'neutral'}`}>{connected ? 'Connected' : connection.status || 'Not connected'}</span></div><h3>{name}</h3><p>{connection.description || 'Use this payment connection to collect customer payments through Bellbee.'}</p>{connected ? <button type="button" className="dp-secondary-button" onClick={() => disconnectProvider(connection)} disabled={Boolean(busyProvider)}>{busyProvider === provider ? 'Updating…' : 'Disconnect'}</button> : <button type="button" className="dp-primary-button" onClick={() => connectProvider(provider)} disabled={Boolean(busyProvider)}>{busyProvider === provider ? 'Connecting…' : 'Connect provider'} <ArrowUpRight size={14} /></button>}</Panel>;
      })}</div> : <Panel>{!paymentCollectionApi.isConfigured() ? <EmptyState icon={LockKeyhole} title="Payment connections are not connected yet" description="Connect the payment collection API to load the providers enabled for your Bellbee workspace." /> : <EmptyState icon={Link2} title="No payment providers connected" description="When a payment provider is made available to your workspace, it will appear here." />}</Panel>}
      {!paymentCollectionApi.isConfigured() && <p className="dp-form-note"><Plus size={13} /> Configure REACT_APP_API_PAYMENT_COLLECTION_PATH to load available providers and launch their secure onboarding flow.</p>}
    </>
  );
}
