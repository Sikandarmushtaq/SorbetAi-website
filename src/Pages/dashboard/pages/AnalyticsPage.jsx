import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Bot, CalendarDays, CreditCard, MessageCircle, ShoppingBag, Users,
} from 'lucide-react';
import { PageHeader, Panel, StatCard, StatGrid, Tabs } from '../../../components/dashboard/common/DashboardUI';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const metricDefinitions = [
  { key: 'messages_received', label: 'Messages received', icon: MessageCircle },
  { key: 'ai_replies', label: 'AI replies', icon: Bot },
  { key: 'human_replies', label: 'Human replies', icon: Users },
  { key: 'appointments_booked', label: 'Appointments booked', icon: CalendarDays },
  { key: 'orders_placed', label: 'Orders placed', icon: ShoppingBag },
  { key: 'revenue', label: 'Revenue', icon: CreditCard, currency: true },
];

function listFrom(value) {
  return Array.isArray(value) ? value : value?.items || value?.results || [];
}

function metricValue(metrics, key) {
  const aliases = {
    messages_received: ['messages_received', 'received_messages', 'total_messages'],
    ai_replies: ['ai_replies', 'automated_replies'],
    human_replies: ['human_replies', 'team_replies'],
    appointments_booked: ['appointments_booked', 'appointments'],
    orders_placed: ['orders_placed', 'orders'],
    revenue: ['revenue', 'total_revenue'],
  };
  for (const name of aliases[key] || [key]) {
    if (metrics?.[name] !== undefined && metrics?.[name] !== null) return metrics[name];
  }
  return '—';
}

function formatRevenue(value, currency = 'PKR') {
  if (value === '—' || value === undefined || value === null || value === '') return '—';
  const amount = Number(value);
  const prefix = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `;
  return Number.isFinite(amount) ? `${prefix}${amount.toLocaleString()}` : String(value);
}

function chartValue(item, key) {
  const aliases = {
    received: ['received', 'messages_received', 'received_messages', 'messages'],
    ai_replies: ['ai_replies', 'automated_replies'],
    human_replies: ['human_replies', 'team_replies'],
  };
  const value = (aliases[key] || [key]).map((name) => item?.[name]).find((entry) => entry !== undefined && entry !== null);
  return Number(value || 0) || 0;
}

// Displays only analytics returned by the business analytics API, never placeholder activity totals.
export default function AnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  const loadAnalytics = useCallback(async () => {
    if (!isResourceConfigured('analytics')) {
      setAnalytics(null);
      setLoadError('The analytics API is not configured yet.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await resourceRequest('analytics', { query: { period: range, view: tab.toLowerCase() } });
      setAnalytics(response?.analytics || response);
    } catch (error) {
      setAnalytics(null);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [range, tab]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const metrics = analytics?.metrics || analytics?.summary || {};
  const visibleMetrics = tab === 'Overview' ? metricDefinitions : metricDefinitions.slice(0, 3);
  const dailyVolume = listFrom(analytics?.daily_message_volume || analytics?.daily_messages || analytics?.messages_over_time);
  const channelRows = listFrom(analytics?.messages_by_channel || analytics?.channels);
  const conversionRows = listFrom(analytics?.conversions || analytics?.business_outcomes);
  const spend = analytics?.whatsapp_spend || analytics?.spend?.whatsapp || null;
  const maxVolume = useMemo(() => Math.max(1, ...dailyVolume.map((item) => chartValue(item, 'received') + chartValue(item, 'ai_replies') + chartValue(item, 'human_replies'))), [dailyVolume]);
  const currency = analytics?.currency || 'PKR';

  return (
    <>
      <PageHeader
        eyebrow="INSIGHTS"
        title="Analytics"
        description="Understand message volume and how conversations turn into business."
        actions={<select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Analytics date range"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select>}
      />
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel>
        <Tabs items={['Overview', 'Messages']} active={tab} onChange={setTab} />
        {isLoading ? <div className="dp-api-empty-state">Loading analytics…</div> : (
          <>
            <StatGrid columns={3}>
              {visibleMetrics.map(({ key, label, icon: Icon, currency: isCurrency }) => {
                const value = metricValue(metrics, key);
                return <StatCard key={key} label={label} value={isCurrency ? formatRevenue(value, currency) : value} icon={Icon} />;
              })}
            </StatGrid>
            <div className="dp-chart-section">
              <div><span className="dp-section-kicker">DAILY MESSAGE VOLUME</span><h2>Messages over time</h2><p>Received, AI replies and human replies · Last {range.replace('d', ' days')}</p></div>
              {dailyVolume.length ? (
                <div className="dp-analytics-chart" role="img" aria-label="Daily message volume from the analytics API">
                  {dailyVolume.map((item, index) => {
                    const received = chartValue(item, 'received');
                    const ai = chartValue(item, 'ai_replies');
                    const human = chartValue(item, 'human_replies');
                    return <div className="dp-analytics-chart-column" key={item.date || item.day || index}>
                      <div className="dp-analytics-bar-stack" title={`Received ${received}, AI replies ${ai}, human replies ${human}`}>
                        <span className="dp-analytics-bar received" style={{ height: `${(received / maxVolume) * 100}%` }} />
                        <span className="dp-analytics-bar ai" style={{ height: `${(ai / maxVolume) * 100}%` }} />
                        <span className="dp-analytics-bar human" style={{ height: `${(human / maxVolume) * 100}%` }} />
                      </div>
                      <small>{item.label || item.date || item.day || `Day ${index + 1}`}</small>
                    </div>;
                  })}
                </div>
              ) : <div className="dp-chart-placeholder"><BarChart3 size={32} /><h3>No activity to display</h3><p>Your message analytics will appear here as customers interact with your AI.</p></div>}
              {dailyVolume.length > 0 && <div className="dp-analytics-legend"><span><i className="received" />Received</span><span><i className="ai" />AI replies</span><span><i className="human" />Human replies</span></div>}
            </div>
            <div className="dp-analytics-lower">
              <div className="dp-chart-section"><span className="dp-section-kicker">CHANNELS</span><h2>Messages by channel</h2>
                {channelRows.length ? channelRows.map((item) => <div className="dp-analytics-data-row" key={item.channel || item.name}><span>{item.channel || item.name || 'Channel'}</span><strong>{item.messages ?? item.count ?? '—'}</strong></div>) : <div className="dp-inline-empty">No channel activity yet. Connect WhatsApp or another channel to start collecting data.</div>}
              </div>
              <div className="dp-chart-section"><span className="dp-section-kicker">CONVERSIONS</span><h2>Business outcomes</h2>
                {conversionRows.length ? conversionRows.map((item) => <div className="dp-analytics-data-row" key={item.name || item.type}><span>{item.name || item.type || 'Outcome'}</span><strong>{item.count ?? item.value ?? '—'}</strong></div>) : <div className="dp-inline-empty">Appointments and order conversions will appear as your business activity grows.</div>}
              </div>
            </div>
          </>
        )}
      </Panel>
      <Panel className="dp-spend-panel">
        <span className="dp-section-kicker">WHATSAPP SPEND</span><h2>WhatsApp message costs</h2><p>WhatsApp message costs as reported by Meta. The data refreshes once daily after your channel is connected.</p>
        {spend && (spend.amount !== undefined || spend.total !== undefined || spend.cost !== undefined) ? <div className="dp-whatsapp-spend-value">{formatRevenue(spend.amount ?? spend.total ?? spend.cost, spend.currency || currency)}{spend.period ? <small>{spend.period}</small> : null}</div> : <div className="dp-inline-empty"><CreditCard size={19} />No WhatsApp spend data yet. Connect Meta and allow the daily sync to run.</div>}
        <button type="button" className="dp-text-button" onClick={() => navigate('/whatsapp')}>Manage WhatsApp connection</button>
      </Panel>
    </>
  );
}
