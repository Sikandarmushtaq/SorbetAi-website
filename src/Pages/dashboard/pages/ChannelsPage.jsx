import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Users } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

function WhatsAppMark({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="WhatsApp logo"><circle cx="12" cy="12" r="10.5" fill="#25D366"/><path fill="#fff" d="M17.1 14.1c-.28-.14-1.63-.8-1.89-.89-.25-.09-.44-.14-.63.14-.19.28-.72.89-.88 1.07-.16.19-.32.21-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.54-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 2.72 1.14 2.91c.14.19 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.63-.67 1.86-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.19-.54-.33Z"/></svg>;
}

function channelRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.channels || [];
}

// Summarises channel status and routes each provider card to its dedicated setup page.
export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(isResourceConfigured('channels'));
  const [loadError, setLoadError] = useState('');
  const { isStarted, isStatusKnown, openFreePlan } = useFreePlan();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (!isResourceConfigured('channels')) return undefined;
    resourceRequest('channels')
      .then((response) => { if (active) setChannels(channelRecords(response)); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const getStatus = (name) => {
    const channel = channels.find((item) => String(item.type || item.name || item.channel).toLowerCase().includes(name.toLowerCase()));
    if (!isResourceConfigured('channels')) return 'Connect channel API';
    if (loadError) return 'Status unavailable';
    if (isLoading) return 'Checking status…';
    if (!channel) return 'Not connected';
    return channel.is_connected || channel.connected || String(channel.status).toLowerCase() === 'connected' ? 'Connected' : channel.status || 'Not connected';
  };

  const connectedCount = useMemo(() => channels.filter((item) => item.is_connected || item.connected || String(item.status).toLowerCase() === 'connected').length, [channels]);
  const cards = [
    { icon: WhatsAppMark, color: 'green', title: 'WhatsApp', status: getStatus('whatsapp'), description: 'Connect your official WhatsApp Business number and manage your Meta account.', action: 'Manage WhatsApp', route: '/dashboard/whatsapp' },
    { icon: Globe, color: 'coral', title: 'Website Chat', status: getStatus('website'), description: 'Set up the Bellbee chat widget, customize its welcome message and install it on your site.', action: 'Set up Website Chat', route: '/dashboard/website-chat' },
    { icon: Users, color: 'lavender', title: 'Facebook & Instagram', status: getStatus('facebook') === 'Not connected' ? getStatus('instagram') : getStatus('facebook'), description: 'Connect your Facebook Page and Instagram professional account to one shared inbox.', action: 'Manage social channels', route: '/dashboard/facebook-instagram' },
  ];

  return (
    <>
      <PageHeader title="Channels" description="Connect and manage every way customers reach your business." actions={isStatusKnown && !isStarted ? <button type="button" className="dp-secondary-button" onClick={() => openFreePlan()}>Start free plan</button> : null} />
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <div className="dp-channels-overview"><span className="dp-section-kicker">CHANNEL CONNECTIONS</span><span className={`dp-status-pill ${connectedCount ? 'success' : 'neutral'}`}>{isLoading ? 'Checking connections…' : isResourceConfigured('channels') ? `${connectedCount} connected` : 'Connection status unavailable'}</span></div>
      <div className="dp-channel-grid">{cards.map(({ icon: Icon, color, title, status, description, action, route }) => <Panel className="dp-channel-card" key={title}><div className={`dp-channel-icon ${color}`}><Icon size={22} /></div><div className="dp-channel-status"><span className={`dp-status-dot ${status === 'Connected' ? 'connected' : ''}`} />{status}</div><h2>{title}</h2><p>{description}</p><button type="button" className="dp-secondary-button" onClick={() => navigate(route)}>{action}</button></Panel>)}</div>
      <div className="dp-support-cta"><div><h3>Need another channel?</h3><p>Tell us what you would like Bellbee to support next.</p></div><button type="button" className="dp-primary-button" onClick={() => navigate('/dashboard/support')}>Request a new channel</button></div>
    </>
  );
}
