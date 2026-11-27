
import './AnalyticsPage.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  MessageSquare,
  ShoppingCart,
  TrendingUp,

} from 'lucide-react';

import { analyticsApi } from '../../../services/dashboard/analytics.api.js';

/* =========================================
   ANALYTICS CONFIGURATION
========================================= */

const metricsConfig = [
  {
    key: 'messages_received',
    label: 'MESSAGES RECEIVED',
    icon: MessageSquare,
    accent: 'coral',
  },
  {
    key: 'ai_replies',
    label: 'AI REPLIES',
    icon: Bot,
    accent: 'green',
  },
  {
    key: 'human_replies',
    label: 'HUMAN REPLIES',
    icon: MessageSquare,
    accent: 'yellow',
  },
  {
    key: 'appointments_booked',
    label: 'APPOINTMENTS BOOKED',
    icon: CalendarDays,
    accent: 'green',
  },
  {
    key: 'orders_placed',
    label: 'ORDERS PLACED',
    icon: ShoppingCart,
    accent: 'coral',
  },
  {
    key: 'revenue',
    label: 'REVENUE',
    icon: TrendingUp,
    accent: 'green',
    currency: true,
  },
];

const periods = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const metricAliases = {
  messages_received: [
    'messages_received',
    'received_messages',
    'total_messages',
  ],
  ai_replies: [
    'ai_replies',
    'automated_replies',
  ],
  human_replies: [
    'human_replies',
    'team_replies',
  ],
  appointments_booked: [
    'appointments_booked',
    'appointments',
  ],
  orders_placed: [
    'orders_placed',
    'orders',
  ],
  revenue: [
    'revenue',
    'total_revenue',
  ],
};

const seriesConfig = [
  {
    key: 'received',
    label: 'Received',
    color: 'received',
  },
  {
    key: 'ai_replies',
    label: 'AI replies',
    color: 'ai',
  },
  {
    key: 'human_replies',
    label: 'Human replies',
    color: 'human',
  },
];

/* =========================================
   RESPONSE HELPERS
========================================= */

function extractAnalytics(response) {
  const data = response?.data ?? response;

  return data?.analytics || data || {};
}

function listFrom(value) {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

function channelList(value) {
  const records = listFrom(value);

  if (records.length || Array.isArray(value)) {
    return records;
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value)
    .filter(([, item]) =>
      typeof item === 'number' ||
      (item !== null && typeof item === 'object')
    )
    .map(([channel, item]) => {
      if (typeof item === 'number') {
        return { channel, messages: item };
      }

      return { channel, ...item };
    });
}

function metricValue(metrics, key) {
  const aliases = metricAliases[key] || [key];

  for (const name of aliases) {
    const value = metrics?.[name];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return null;
}

function seriesValue(row, key) {
  const aliases = {
    received: [
      'received',
      'messages_received',
      'received_messages',
      'messages',
    ],
    ai_replies: [
      'ai_replies',
      'automated_replies',
    ],
    human_replies: [
      'human_replies',
      'team_replies',
    ],
  };

  const names = aliases[key] || [key];

  for (const name of names) {
    const value = row?.[name];

    if (value !== undefined && value !== null) {
      const number = Number(value);

      return Number.isFinite(number)
        ? Math.max(0, number)
        : 0;
    }
  }

  return 0;
}

function formatNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '—';
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString('en-US')
    : String(value);
}

function formatMoney(value, currency = 'PKR') {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) return String(value);

  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `${currency} ${number.toLocaleString()}`;
  }
}

function shortDate(value, index) {
  if (!value) return `Day ${index + 1}`;

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(
      `${text.substring(0, 10)}T12:00:00`
    );

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    }
  }

  return text;
}

/* =========================================
   SHARED METRIC CARD
========================================= */

function AnalyticsMetricCard({
  label,
  value,
  icon: Icon,
  accent,
}) {
  return (
    <article className="an-metric-card">
      <span className={`an-metric-icon ${accent}`}>
        <Icon size={19} strokeWidth={1.8} />
      </span>

      <span className="an-metric-label">
        {label}
      </span>

      <strong className="an-metric-value">
        {value}
      </strong>
    </article>
  );
}

/* =========================================
   CHART LEGEND
========================================= */

function ChartLegend() {
  return (
    <div className="an-chart-legend">
      {seriesConfig.map((series) => (
        <span key={series.key}>
          <i className={`an-legend-dot ${series.color}`} />
          {series.label}
        </span>
      ))}
    </div>
  );
}

/* =========================================
   MESSAGE VOLUME CHART
========================================= */

function MessageVolumeChart({ rows }) {
  const hasActivity = rows.some((row) =>
    seriesConfig.some(
      (series) => seriesValue(row, series.key) > 0
    )
  );

  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) =>
      seriesConfig.map((series) =>
        seriesValue(row, series.key)
      )
    )
  );

  return (
    <div className="an-chart-card">
      {hasActivity ? (
        <div
          className="an-chart-viewport"
          role="img"
          aria-label="Daily received messages, AI replies and human replies"
        >
          <div className="an-chart-grid">
            {[4, 3, 2, 1, 0].map((tick) => (
              <div
                key={tick}
                className="an-chart-grid-line"
              >
                <small>
                  {formatNumber(
                    Math.round(maxValue * tick / 4)
                  )}
                </small>
                <span />
              </div>
            ))}
          </div>

          <div className="an-chart-bars">
            {rows.map((row, index) => {
              const label = shortDate(
                row.date || row.day || row.label,
                index
              );

              return (
                <div
                  className="an-chart-day"
                  key={`${row.date || row.day || index}-${index}`}
                >
                  <div className="an-chart-day-bars">
                    {seriesConfig.map((series) => {
                      const value = seriesValue(
                        row,
                        series.key
                      );

                      const height =
                        value > 0
                          ? Math.max(
                              2,
                              (value / maxValue) * 100
                            )
                          : 0;

                      return (
                        <span
                          key={series.key}
                          className={
                            `an-chart-bar ${series.color}`
                          }
                          style={{ height: `${height}%` }}
                          title={`${label} · ${series.label}: ${value}`}
                        />
                      );
                    })}
                  </div>

                  <small>{label}</small>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="an-chart-empty">
          No data for this period.
        </div>
      )}

      <ChartLegend />
    </div>
  );
}

/* =========================================
   CHANNEL ACTIVITY
========================================= */

function MessagesByChannel({ rows }) {
  const maxValue = Math.max(
    1,
    ...rows.map((row) =>
      Number(
        row.messages ??
        row.count ??
        row.total ??
        row.received ??
        row.value ??
        0
      ) || 0
    )
  );

  return (
    <section className="an-channel-card">
      <h3>Messages by channel</h3>

      {rows.length === 0 ? (
        <div className="an-channel-empty">
          No channel activity for this period.
        </div>
      ) : (
        <div className="an-channel-list">
          {rows.map((row, index) => {
            const name =
              row.channel ||
              row.name ||
              row.provider ||
              `Channel ${index + 1}`;

            const rawValue =
              row.messages ??
              row.count ??
              row.total ??
              row.received ??
              row.value;

            const number = Number(rawValue) || 0;

            return (
              <div
                key={`${name}-${index}`}
                className="an-channel-row"
              >
                <div className="an-channel-top">
                  <strong>{name}</strong>

                  <span>
                    {formatNumber(rawValue)}
                  </span>
                </div>

                <div className="an-channel-track">
                  <span
                    style={{
                      width: `${
                        (Math.max(0, number) / maxValue) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================
   WHATSAPP SPEND
========================================= */

function WhatsAppSpend({ spend, currency }) {
  const amount =
    typeof spend === 'number'
      ? spend
      : spend?.amount ??
        spend?.total ??
        spend?.cost ??
        spend?.total_cost;

  const hasAmount =
    amount !== undefined &&
    amount !== null &&
    amount !== '';

  return (
    <section className="an-spend-section">
      <div className="an-spend-heading">
        <div>
          <h2>WhatsApp spend</h2>

          <p>
            WhatsApp message costs as reported by Meta,
            last 30 days. Updates once daily.
          </p>
        </div>

        <Link
          className="an-whatsapp-link"
          to="/dashboard/whatsapp"
        >
          Manage WhatsApp connection
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="an-spend-card">
        {hasAmount ? (
          <div className="an-spend-data">
            <span>
              WhatsApp message costs
            </span>

            <strong>
              {formatMoney(
                amount,
                spend?.currency || currency
              )}
            </strong>

            {spend?.period && (
              <small>{spend.period}</small>
            )}
          </div>
        ) : (
          <p>
            No WhatsApp spend data yet. This fills in
            once your Meta connection has been active
            and the daily sync has run.
          </p>
        )}
      </div>
    </section>
  );
}

/* =========================================
   MAIN ANALYTICS PAGE
========================================= */

export default function AnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState('30d');

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const requestIdRef = useRef(0);

  const configured = analyticsApi.isConfigured();

  /* =======================================
     LOAD BACKEND DATA
  ======================================= */

  const loadAnalytics = useCallback(
    async (silent = false) => {
      const requestId = ++requestIdRef.current;

      if (!analyticsApi.isConfigured()) {
        setAnalytics(null);
        setError(
          'Analytics API is not configured. Add the confirmed analytics endpoint to your environment file.'
        );
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);

      try {
        const response = await analyticsApi.request({
          query: {
            period: range,
            view: tab.toLowerCase(),
          },
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setAnalytics(extractAnalytics(response));
        setError('');
      } catch (requestError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          requestError?.message ||
          'Unable to load analytics.'
        );

        if (!silent) {
          setAnalytics(null);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [range, tab]
  );

  useEffect(() => {
    loadAnalytics();

    // Polling for fresh backend information.
    // No sample values are injected.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAnalytics(true);
      }
    }, 30000);

    return () => {
      window.clearInterval(interval);
      requestIdRef.current += 1;
    };
  }, [loadAnalytics]);

  /* =======================================
     NORMALIZE API RESPONSE
  ======================================= */

  const metrics =
    analytics?.metrics ||
    analytics?.summary ||
    analytics?.totals ||
    {};

  const currency = analytics?.currency || 'PKR';

  const dailyVolume = useMemo(
    () =>
      listFrom(
        analytics?.daily_message_volume ||
        analytics?.daily_messages ||
        analytics?.messages_over_time ||
        analytics?.messages?.daily
      ),
    [analytics]
  );

  const channelRows = useMemo(
    () =>
      channelList(
        analytics?.messages_by_channel ||
        analytics?.channels ||
        analytics?.channel_breakdown
      ),
    [analytics]
  );

  const whatsappSpend =
    analytics?.whatsapp_spend ??
    analytics?.spend?.whatsapp ??
    null;

  const rangeLabel =
    periods.find((period) => period.value === range)?.label ||
    'Last 30 days';

  /* =======================================
     RENDER
  ======================================= */

  return (
    <div className="an-page">
      {/* HEADER */}

      <header className="an-header">
        <h1>Analytics</h1>

        <p>
          Message volume and business conversions
        </p>
      </header>

      {/* TABS */}

      <div
        className="an-tabs"
        role="tablist"
        aria-label="Analytics sections"
      >
        {['Overview', 'Messages'].map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? 'active' : ''}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* ERROR */}

      {error && (
        <div className="an-api-error" role="status">
          <span>{error}</span>

          {configured && (
            <button
              type="button"
              onClick={() => loadAnalytics()}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}

      {tab === 'Overview' && (
        <section
          className="an-overview"
          role="tabpanel"
        >
          <p className="an-period-label">
            {rangeLabel}
          </p>

          {loading && !analytics ? (
            <div className="an-loading">
              <LoaderCircle
                size={23}
                className="an-spin"
              />
              Loading analytics...
            </div>
          ) : (
            <div className="an-metrics-grid">
              {metricsConfig.map((metric) => {
                const value = metricValue(
                  metrics,
                  metric.key
                );

                return (
                  <AnalyticsMetricCard
                    key={metric.key}
                    label={metric.label}
                    icon={metric.icon}
                    accent={metric.accent}
                    value={
                      metric.currency
                        ? formatMoney(value, currency)
                        : formatNumber(value)
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MESSAGES TAB */}

      {tab === 'Messages' && (
        <section
          className="an-messages"
          role="tabpanel"
        >
          {/* DAILY MESSAGE VOLUME */}

          <div className="an-volume-heading">
            <h2>Daily message volume</h2>

            <div className="an-range-select">
              <select
                value={range}
                onChange={(event) =>
                  setRange(event.target.value)
                }
                aria-label="Select analytics date range"
              >
                {periods.map((period) => (
                  <option
                    key={period.value}
                    value={period.value}
                  >
                    {period.label}
                  </option>
                ))}
              </select>

              <ChevronDown size={15} />
            </div>
          </div>

          {loading && !analytics ? (
            <div className="an-chart-card an-loading">
              <LoaderCircle
                size={23}
                className="an-spin"
              />
              Loading message activity...
            </div>
          ) : (
            <>
              <MessageVolumeChart rows={dailyVolume} />

              <MessagesByChannel rows={channelRows} />
            </>
          )}
        </section>
      )}

      {/* WHATSAPP SPEND
          VISIBLE ON BOTH TABS */}

      <WhatsAppSpend
        spend={whatsappSpend}
        currency={currency}
      />
    </div>
  );
}