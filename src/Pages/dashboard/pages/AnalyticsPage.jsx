import { useState } from 'react';
import { BarChart3, Bot, CalendarDays, CreditCard, MessageCircle, ShoppingBag, Users } from 'lucide-react';
import { PageHeader, Panel, StatCard, StatGrid, Tabs } from '../../../components/dashboard/common/DashboardUI';

// Presents overview and message metrics with clear empty states until data is connected.
export default function AnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState('Last 30 days');
  const metrics = tab === 'Overview' ? [
    ['Messages received', '0', MessageCircle], ['AI replies', '0', Bot], ['Human replies', '0', Users],
    ['Appointments booked', '0', CalendarDays], ['Orders placed', '0', ShoppingBag], ['Revenue', 'PKR 0', CreditCard],
  ] : [['Messages received', '0', MessageCircle], ['AI replies', '0', Bot], ['Human replies', '0', Users]];
  return <>
    <PageHeader eyebrow="INSIGHTS" title="Analytics" description="Understand message volume and how conversations turn into business." actions={<select value={range} onChange={(event) => setRange(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select>} />
    <Panel><Tabs items={['Overview', 'Messages']} active={tab} onChange={setTab} /><StatGrid columns={3}>{metrics.map(([label, value, Icon]) => <StatCard key={label} label={label} value={value} icon={Icon} />)}</StatGrid>
      <div className="dp-chart-section"><div><span className="dp-section-kicker">DAILY MESSAGE VOLUME</span><h2>Messages over time</h2><p>Received, AI replies and human replies · {range.toLowerCase()}</p></div><div className="dp-chart-placeholder"><BarChart3 size={32} /><h3>No activity to display</h3><p>Your message analytics will appear here as customers interact with your AI.</p></div></div>
      <div className="dp-analytics-lower"><div className="dp-chart-section"><span className="dp-section-kicker">CHANNELS</span><h2>Messages by channel</h2><div className="dp-inline-empty">No channel activity yet. Connect WhatsApp or another channel to start collecting data.</div></div><div className="dp-chart-section"><span className="dp-section-kicker">CONVERSIONS</span><h2>Business outcomes</h2><div className="dp-inline-empty">Appointments and order conversions will appear as your business activity grows.</div></div></div>
    </Panel>
    <Panel className="dp-spend-panel"><span className="dp-section-kicker">WHATSAPP SPEND</span><h2>WhatsApp message costs</h2><p>WhatsApp message costs as reported by Meta. The data refreshes once daily after your channel is connected.</p><div className="dp-inline-empty"><CreditCard size={19} />No WhatsApp spend data yet. Connect Meta and allow the daily sync to run.</div></Panel>
  </>;
}
