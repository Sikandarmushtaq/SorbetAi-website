import { billingReportsApi } from '../../../services/dashboard/billing-reports.api.js';
import './BillingReportsPage.css';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, CalendarDays, ChartColumn, FileDown, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { EmptyState, PageHeader, Panel, StatCard, StatGrid, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
const reportTabs = [{ label: 'By day', value: 'by_day' }, { label: 'By AI model', value: 'by_model' }, { label: 'Activity log', value: 'activity' }];

function getRows(response, view) {
  const reports = response?.reports || response?.usage || response?.ai_usage || {};
  if (Array.isArray(reports)) return reports;
  return reports[view] || response?.[view] || response?.items || [];
}

function money(value, currency = 'GBP') {
  if (value === null || value === undefined || value === '') return '—';
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(value)); }
  catch { return `${currency} ${value}`; }
}

// Loads actual billing reports and unlocks the report view after free-plan activation.
export default function BillingReportsPage() {
  const [params, setParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [rows, setRows] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isStarted, isChecking, openFreePlan } = useFreePlan();
  const { Notice } = useNotice();
  const view = reportTabs.some((tab) => tab.value === params.get('view')) ? params.get('view') : 'by_day';

  const loadReports = useCallback(async () => {
    if (!isStarted || !billingReportsApi.isConfigured()) {
      setReport(null);
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await billingReportsApi.request({ query: { period, view } });
      const value = response?.report || response?.reports_summary || response;
      setReport(value);
      setRows(getRows(response, view));
    } catch (requestError) { setError(requestError.message); setReport(null); setRows([]); }
    finally { setLoading(false); }
  }, [isStarted, period, view]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const changeView = (label) => {
    const selected = reportTabs.find((tab) => tab.label === label)?.value || 'by_day';
    const next = new URLSearchParams(params);
    if (selected === 'by_day') next.delete('view'); else next.set('view', selected);
    setParams(next, { replace: true });
  };

  const currency = report?.currency || report?.ai_credits?.currency || 'GBP';
  const totals = report?.totals || report?.summary || {};

  return (
    <>
      <PageHeader eyebrow="BILLING / REPORTS" title="Billing reports" description="Review AI credit usage, billing activity and payment history." actions={<button type="button" className="dp-secondary-button" onClick={loadReports} disabled={loading || !isStarted}><RefreshCw size={14} /> Refresh</button>} />
      {Notice}
      {!isStarted && !isChecking && <Panel className="dp-report-unlocked-card"><div className="dp-billing-hero-icon"><Sparkles size={22} /></div><span className="dp-section-kicker">YOUR AI PLAN</span><h2>Start your free plan to unlock reports</h2><p>Once your free plan is active, your AI credit usage and billing activity will appear here.</p><button type="button" className="dp-primary-button" onClick={() => openFreePlan(loadReports)}>Start free plan <Sparkles size={14} /></button></Panel>}
      {isChecking && <div className="dp-api-empty-state">Checking your plan status…</div>}
      {isStarted && <>
        {error && <div className="dp-inline-notice dp-api-error" role="status">{error}</div>}
        <StatGrid columns={3}>
          <StatCard label="AI credit used" value={loading ? '—' : money(totals.credit_used ?? totals.used ?? report?.ai_credits?.used_this_month, currency)} icon={Wallet} />
          <StatCard label="AI replies" value={loading ? '—' : totals.replies ?? totals.total_replies ?? '—'} icon={BarChart3} accent="lavender" />
          <StatCard label="Billing total" value={loading ? '—' : money(totals.total ?? totals.amount, currency)} icon={ChartColumn} accent="yellow" />
        </StatGrid>
        <Panel className="dp-report-table-panel">
          <div className="dp-panel-heading"><div><span className="dp-section-kicker">DETAILED ACTIVITY</span><h2>Usage history</h2></div><FileDown size={20} /></div>
          <div className="dp-toolbar dp-toolbar-between"><Tabs items={reportTabs.map((tab) => tab.label)} active={reportTabs.find((tab) => tab.value === view)?.label || 'By day'} onChange={changeView} /><select className="dp-field-control dp-report-period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select></div>
          {loading ? <div className="dp-api-empty-state">Loading billing reports…</div> : rows.length ? <div className="dp-report-list">{rows.map((row, index) => <div className="dp-report-row" key={row.id || row.date || row.model || index}><div><strong>{row.date || row.day || row.model || row.description || row.action || 'AI activity'}</strong><small>{row.description || (row.replies != null ? `${row.replies} replies` : row.count != null ? `${row.count} events` : row.status || '')}</small></div><strong>{money(row.cost ?? row.amount ?? row.credits_used, currency)}</strong></div>)}</div> : <EmptyState icon={CalendarDays} title="Nothing to track yet" description="When your AI starts replying, usage and billing activity will be listed here." />}
          {!billingReportsApi.isConfigured() && <p className="dp-form-note">Connect the billing reports endpoint to load detailed usage and payment history.</p>}
        </Panel>
        <p className="dp-form-note">Report totals and individual activity are supplied by the billing API. No sample transactions are added.</p>
      </>}
    </>
  );
}
