
import './BillingReportsPage.css';

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  CalendarDays,
  Package,
  BarChart3,
  Bot,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';

import { billingReportsApi } from '../../../services/dashboard/billing-reports.api.js';

const TABS = [
  { label: 'By day', value: 'by_day' },
  { label: 'By AI model', value: 'by_model' },
  { label: 'Activity log', value: 'activity' },
];

const PERIODS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

function present(...values) {
  return values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== ''
  );
}

function money(value, currency = 'GBP') {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return '—';

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function amountOf(row) {
  return present(
    row.cost,
    row.amount,
    row.credits_used,
    row.credit_used,
    row.total_cost,
    row.value
  );
}

function getReportRows(response, view) {
  const root = response?.report || response || {};

  const reports =
    root.reports ||
    response?.reports ||
    root.usage ||
    response?.usage ||
    {};

  const aliases = {
    by_day: ['by_day', 'daily', 'days'],
    by_model: ['by_model', 'models', 'model_usage'],
    activity: [
      'activity',
      'activity_log',
      'transactions',
      'history',
    ],
  };

  const keys = aliases[view] || [view];

  for (const source of [reports, root, response]) {
    if (Array.isArray(source) && view === 'by_day') {
      return source;
    }

    if (!source || typeof source !== 'object') continue;

    for (const key of keys) {
      if (Array.isArray(source[key])) {
        return source[key];
      }
    }
  }

  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="bcr-metric">
      <div className="bcr-metric-title">
        <Icon size={17} strokeWidth={1.8} />
        <span>{label}</span>
      </div>

      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function EmptyReport({ view, hasError = false }) {
  const title = hasError
    ? 'Unable to load usage'
    : view === 'by_day'
      ? 'No AI usage in this period'
      : view === 'by_model'
        ? 'No AI model usage yet'
        : 'No activity in this period';

  const description = hasError
    ? 'Check your connection or billing reports API and try again.'
    : view === 'by_day'
      ? 'Each reply your AI sends shows here with what it cost from your credit.'
      : view === 'by_model'
        ? 'When your AI starts replying, usage by individual AI model will appear here.'
        : 'Your AI credit transactions and activity will appear here when available.';

  return (
    <div className="bcr-empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function DailyChart({ rows, currency }) {
  const daily = rows.map((row, index) => ({
    key: row.id || row.date || row.day || index,
    label: row.date || row.day || '',
    amount: Math.max(0, Number(amountOf(row) || 0)),
  }));

  const max = Math.max(
    0,
    ...daily.map((item) => item.amount)
  );

  if (!daily.length || max === 0) {
    return <EmptyReport view="by_day" />;
  }

  return (
    <div className="bcr-chart-scroll">
      <div className="bcr-daily-chart">
        {daily.map((item) => {
          const height = Math.max(
            3,
            (item.amount / max) * 100
          );

          return (
            <div
              className="bcr-chart-column"
              key={item.key}
            >
              <div className="bcr-bar-space">
                <div
                  className="bcr-bar"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${money(
                    item.amount,
                    currency
                  )}`}
                />
              </div>

              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModelReport({ rows, currency }) {
  const models = rows.map((row, index) => ({
    key:
      row.id ||
      row.model ||
      row.model_name ||
      index,
    name:
      row.model_name ||
      row.model ||
      row.name ||
      'AI model',
    amount: Number(amountOf(row) || 0),
    replies: present(
      row.replies,
      row.total_replies,
      row.count
    ),
  }));

  const max = Math.max(
    0,
    ...models.map((item) =>
      Math.max(0, item.amount)
    )
  );

  if (!models.length || max === 0) {
    return <EmptyReport view="by_model" />;
  }

  return (
    <div className="bcr-model-list">
      {models.map((model) => (
        <div
          className="bcr-model-row"
          key={model.key}
        >
          <span className="bcr-model-icon">
            <Bot size={18} />
          </span>

          <div className="bcr-model-details">
            <div className="bcr-model-heading">
              <strong>{model.name}</strong>
              <b>
                {money(model.amount, currency)}
              </b>
            </div>

            <div className="bcr-model-track">
              <span
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (model.amount / max) * 100
                    )
                  )}%`,
                }}
              />
            </div>

            {model.replies != null && (
              <small>
                {model.replies} replies
              </small>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityReport({ rows, currency }) {
  if (!rows.length) {
    return <EmptyReport view="activity" />;
  }

  return (
    <div className="bcr-activity-list">
      {rows.map((row, index) => (
        <article
          key={row.id || row.activity_id || index}
          className="bcr-activity-row"
        >
          <span className="bcr-activity-icon">
            <FileText size={17} />
          </span>

          <div className="bcr-activity-info">
            <strong>
              {row.description ||
                row.action ||
                row.event ||
                row.model ||
                'AI activity'}
            </strong>

            <small>
              {[
                row.created_at ||
                  row.date ||
                  row.day,
                row.model_name || row.model,
                row.replies != null
                  ? `${row.replies} replies`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </small>
          </div>

          <strong className="bcr-activity-cost">
            {money(amountOf(row), currency)}
          </strong>
        </article>
      ))}
    </div>
  );
}

// Protect CSV cells from spreadsheet formula injection.
function escapeCsv(value) {
  const text = String(value ?? '');

  const safeValue = /^[\s]*[=+@-]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeValue.replace(/"/g, '""')}"`;
}

export default function BillingReportsPage() {
  const navigate = useNavigate();

  const [params, setParams] = useSearchParams();

  const requestedView = params.get('view');

  const view = TABS.some(
    (tab) => tab.value === requestedView
  )
    ? requestedView
    : 'by_day';

  const [period, setPeriod] = useState('30d');
  const [reloadKey, setReloadKey] = useState(0);

  const [report, setReport] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const configured = billingReportsApi.isConfigured();

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      setLoading(true);
      setError('');
      setRows([]);
      setReport(null);

      if (!configured) {
        setError(
          'Billing reports API is not configured yet.'
        );
        setLoading(false);
        return;
      }

      try {
        const response =
          await billingReportsApi.request({
            query: {
              period,
              view,
            },
          });

        if (!active) return;

        setReport(
          response?.report ||
            response?.reports_summary ||
            response ||
            {}
        );

        setRows(getReportRows(response, view));
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError?.message ||
            'Unable to load AI credit usage.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, [
    configured,
    period,
    view,
    reloadKey,
  ]);

  const changeTab = (nextView) => {
    const next = new URLSearchParams(params);

    if (nextView === 'by_day') {
      next.delete('view');
    } else {
      next.set('view', nextView);
    }

    setParams(next, { replace: true });
  };

  const totals =
    report?.totals ||
    report?.summary ||
    report?.reports_summary ||
    {};

  const credit =
    report?.ai_credits ||
    report?.credits ||
    {};

  const currency =
    report?.currency ||
    totals.currency ||
    credit.currency ||
    'GBP';

  const remaining = present(
    totals.credit_left,
    totals.credit_remaining,
    totals.remaining,
    credit.remaining,
    credit.credit_left,
    report?.credit_left,
    report?.credit_remaining
  );

  const used = present(
    totals.used_this_month,
    totals.credit_used,
    totals.used,
    credit.used_this_month,
    credit.used,
    report?.credit_used
  );

  const included = present(
    totals.monthly_included,
    totals.included,
    totals.credit_limit,
    credit.monthly_included,
    credit.included_this_month,
    credit.limit
  );

  const added = present(
    totals.added_credit,
    totals.purchased_credit,
    credit.added_credit,
    credit.purchased_credit,
    report?.added_credit
  );

  const estimatedReplies = present(
    totals.estimated_replies,
    totals.replies_remaining,
    credit.estimated_replies,
    credit.replies_remaining,
    report?.replies_remaining
  );

  const addedExpiry = present(
    credit.added_credit_expires_at,
    totals.added_credit_expires_at
  );

  const addedNeverExpires =
    credit.added_credit_never_expires === true ||
    totals.added_credit_never_expires === true;

  const includedNumber = Number(included);
  const usedNumber = Number(used);

  const percentage =
    included != null &&
    used != null &&
    Number.isFinite(includedNumber) &&
    Number.isFinite(usedNumber) &&
    includedNumber > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (usedNumber / includedNumber) * 100
          )
        )
      : 0;

  const chartTitle =
    view === 'by_day'
      ? 'AI credit used'
      : view === 'by_model'
        ? 'Usage by AI model'
        : 'Activity log';

  // Export currently loaded Activity Log records.
  // No fake entries are created.
  const exportActivityCsv = () => {
    if (
      view !== 'activity' ||
      loading ||
      rows.length === 0
    ) {
      return;
    }

    const headers = [
      'Date',
      'Activity',
      'AI Model',
      'Replies',
      'Cost',
      'Currency',
    ];

    const csvRows = rows.map((row) => [
      row.created_at ||
        row.date ||
        row.day ||
        '',
      row.description ||
        row.action ||
        row.event ||
        'AI activity',
      row.model_name ||
        row.model ||
        '',
      row.replies ??
        row.total_replies ??
        '',
      amountOf(row) ?? '',
      currency,
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...csvRows.map((row) =>
        row.map(escapeCsv).join(',')
      ),
    ].join('\r\n');

    const blob = new Blob(
      ['\uFEFF', csvContent],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const objectUrl =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = objectUrl;

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    anchor.download =
      `bellbee-ai-activity-${period}-${date}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  };

  return (
    <div className="bcr-page">
      <button
        type="button"
        className="bcr-back"
        onClick={() =>
          navigate('/dashboard/billing')
        }
      >
        <ArrowLeft size={15} />
        Back to Billing
      </button>

      <header className="bcr-heading">
        <h1>AI credit usage</h1>

        <p>
          See what your AI spent from your credit,
          by day or by AI model.
        </p>
      </header>

      {error && (
        <div
          className="bcr-error"
          role="status"
        >
          <span>{error}</span>

          {configured && (
            <button
              type="button"
              onClick={() =>
                setReloadKey((key) => key + 1)
              }
              disabled={loading}
            >
              <RefreshCw size={14} />
              Try again
            </button>
          )}
        </div>
      )}

      {/* THREE SUMMARY CARDS */}
      <section className="bcr-stats">
        <MetricCard
          icon={Wallet}
          label="CREDIT LEFT"
          value={
            loading
              ? '—'
              : money(remaining, currency)
          }
          note={
            estimatedReplies != null
              ? `about ${Number(
                  estimatedReplies
                ).toLocaleString()} replies`
              : 'Reply estimate unavailable'
          }
        />

        <MetricCard
          icon={CalendarDays}
          label="USED THIS MONTH"
          value={
            loading
              ? '—'
              : money(used, currency)
          }
          note={`of ${money(
            included,
            currency
          )} included`}
        />

        <MetricCard
          icon={Package}
          label="ADDED CREDIT"
          value={
            loading
              ? '—'
              : money(added, currency)
          }
          note={
            addedNeverExpires
              ? 'Never expires'
              : addedExpiry
                ? `Expires ${addedExpiry}`
                : 'Expiry details unavailable'
          }
        />
      </section>

      {/* MONTHLY CREDIT PROGRESS */}
      <section className="bcr-progress-panel">
        <div className="bcr-progress-heading">
          <span>Monthly credit used</span>

          <strong>
            {money(used, currency)}
            {' of '}
            {money(included, currency)}
          </strong>
        </div>

        <div
          className="bcr-progress-track"
          role="progressbar"
          aria-label="Monthly AI credit usage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
        >
          <span
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </section>

      {/* REPORT NAVIGATION */}
      <nav
        className="bcr-tabs"
        role="tablist"
        aria-label="Usage report views"
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={
              view === tab.value
            }
            className={
              view === tab.value
                ? 'active'
                : ''
            }
            onClick={() =>
              changeTab(tab.value)
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* REPORT CONTENT */}
      <section className="bcr-report-panel">
        <header className="bcr-report-head">
          <h2>{chartTitle}</h2>

          {/* ACTIVITY LOG — EXPORT CSV */}
          {view === 'activity' ? (
            <button
              type="button"
              className="bcr-export-button"
              onClick={exportActivityCsv}
              disabled={
                loading ||
                rows.length === 0 ||
                Boolean(error)
              }
              title="Export AI activity as CSV"
            >
              <Download
                size={16}
                strokeWidth={1.8}
              />
              Export CSV
            </button>
          ) : (
            /* BY DAY / BY MODEL — PERIOD SELECTOR */
            <div className="bcr-period-select">
              <select
                aria-label="Report period"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
              >
                {PERIODS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className="bcr-report-content">
          {loading ? (
            <div
              className="bcr-loading"
              role="status"
            >
              <BarChart3 size={25} />
              Loading AI credit usage…
            </div>
          ) : error ? (
            <EmptyReport
              view={view}
              hasError
            />
          ) : view === 'by_day' ? (
            <DailyChart
              rows={rows}
              currency={currency}
            />
          ) : view === 'by_model' ? (
            <ModelReport
              rows={rows}
              currency={currency}
            />
          ) : (
            <ActivityReport
              rows={rows}
              currency={currency}
            />
          )}
        </div>
      </section>
    </div>
  );
}
