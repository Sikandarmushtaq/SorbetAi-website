import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  // Building2,
  // CreditCard,
  // Activity,
  // Radio,
  // Clock3,
  // UserRound,
  RefreshCw,
} from "lucide-react";
import {
  adminApi,
  normalizeRows,
  unwrapRecord,
} from "../../services/admin/adminApi";
import { isAdminPreviewEnabled } from "../../services/admin/adminPreviewData";
import {
  AdminPageHeader,
  AdminFeedback,
  AdminStatus,
  useAdminResource,
  getName,
  InfoItem,
  formatDate,
  formatMinorMoney,
  valueOrDash,
} from "../../components/admin/AdminUI";

const tabs = [
  "Overview",
  "Billing",
  "AI usage",
  "Channels",
  "Activity",
  "Security",
];

function Section({ title, caption, children }) {
  return (
    <section className="dp-panel bb-admin-panel">
      <div className="bb-admin-panel-heading">
        <div>
          <h2>{title}</h2>
          {caption && <p className="bb-admin-muted">{caption}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailsGrid({ entries }) {
  return (
    <div className="bb-admin-details-grid">
      {entries.map(([label, value]) => (
        <InfoItem key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function NestedRows({ rows, labels, emptyText }) {
  return !rows?.length ? (
    <p className="bb-admin-soft-empty">{emptyText}</p>
  ) : (
    <div className="bb-admin-table-wrap">
      <table className="bb-admin-table">
        <thead>
          <tr>
            {labels.map((label) => (
              <th key={label.title}>{label.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || row.invoice_id || i}>
              {labels.map((col) => (
                <td key={col.title}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminUserDetailsPage() {
  const { userId } = useParams();
  const [tab, setTab] = useState("Overview");
  const profile = useAdminResource("users", { id: userId, list: false });
  const user = unwrapRecord(profile.data, "user");
  const separate = {
    Billing: "userBilling",
    "AI usage": "userUsage",
    Channels: "userChannels",
    Activity: "userActivity",
  };
  const currentKey = separate[tab];
  const part = useAdminResource(currentKey || "users", {
    id: userId,
    list: false,
    enabled: Boolean(currentKey) && adminApi.isConfigured(currentKey),
  });
  const partData = part.data;
  const tabData =
    partData ??
    (tab === "Billing"
      ? (user?.billing ?? user?.subscription)
      : tab === "AI usage"
        ? (user?.ai_usage ?? user?.usage)
        : tab === "Channels"
          ? user?.channels
          : tab === "Activity"
            ? user?.activity
            : null);
  const details = unwrapRecord(tabData);
  const invoices = normalizeRows(
    details?.invoices ||
      details?.transactions ||
      details?.payment_history ||
      [],
    "invoices",
  );
  const businesses = normalizeRows(
    user?.workspaces || user?.businesses || [],
    "workspaces",
  );
  const channelRows = Array.isArray(tabData)
    ? tabData
    : normalizeRows(
        details?.channels || details?.connections || [],
        "channels",
      );
  const activityRows = Array.isArray(tabData)
    ? tabData
    : normalizeRows(details?.events || details?.activity || [], "events");
  const payPlan =
    details?.plan?.name ||
    details?.plan_name ||
    details?.subscription?.plan?.name ||
    user?.plan?.name ||
    user?.plan_name;

  return (
    <>
      <div className="bb-admin-breadcrumb">
        <Link to="/admin/users">
          <ArrowLeft size={15} /> Users Management
        </Link>
        <span>/</span>
        <strong>User details</strong>
      </div>
      <AdminPageHeader
        title="User details"
        eyebrow="PLATFORM / USERS"
        description={
          isAdminPreviewEnabled
            ? "UI-only example profile, billing, AI usage and security data. This is not a real account."
            : "A read-only, permission-aware view of a registered account, its business relationships and billing activity."
        }
      >
        <button
          className="bb-admin-btn bb-admin-btn-light"
          type="button"
          onClick={profile.reload}
        >
          <RefreshCw size={15} /> Refresh profile
        </button>
      </AdminPageHeader>
      <AdminFeedback
        loading={profile.loading}
        error={profile.error}
        onRetry={profile.reload}
        empty={!user}
        emptyTitle="No profile returned"
        emptyDescription="Check the user ID and platform-admin users endpoint."
      />
      {!profile.loading && !profile.error && user && (
        <>
          <section className="bb-admin-profile-hero">
            <span className="bb-admin-profile-avatar">
              {getName(user).slice(0, 1).toUpperCase()}
            </span>
            <div className="bb-admin-profile-heading">
              <span className="dp-eyebrow">REGISTERED BELLBEE ACCOUNT</span>
              <h2>{getName(user)}</h2>
              <div className="bb-admin-profile-meta">
                <span>
                  <Mail size={14} />
                  {user.email || "No email"}
                </span>
                <span>
                  <Phone size={14} />
                  {user.phone || "No phone"}
                </span>
              </div>
            </div>
            <div className="bb-admin-profile-status">
              <AdminStatus
                value={
                  user.status ||
                  user.account_status ||
                  (user.is_active === false ? "inactive" : "active")
                }
              />
              <small>User ID: {valueOrDash(user.id || user.user_id)}</small>
            </div>
          </section>
          <div
            className="bb-admin-detail-tabs"
            role="tablist"
            aria-label="User details sections"
          >
            {tabs.map((item) => (
              <button
                role="tab"
                type="button"
                key={item}
                aria-selected={tab === item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Overview" && (
            <div className="bb-admin-detail-columns">
              <div>
                <Section title="Personal information">
                  <DetailsGrid
                    entries={[
                      ["Full name", getName(user)],
                      ["Email", user.email],
                      [
                        "Email verified",
                        user.is_email_verified ?? user.email_verified,
                      ],
                      ["Phone", user.phone],
                      ["Country", user.country],
                      ["Created", formatDate(user.created_at)],
                      ["Last login", formatDate(user.last_login_at)],
                      ["Account status", user.status || user.account_status],
                    ]}
                  />
                </Section>
                <Section
                  title="Associated businesses"
                  caption="Workspace information provided by the platform backend"
                >
                  <NestedRows
                    rows={businesses}
                    emptyText="No associated businesses were returned."
                    labels={[
                      {
                        title: "Business",
                        render: (r) =>
                          r.id || r.workspace_id ? (
                            <Link
                              to={`/admin/businesses/${encodeURIComponent(r.id || r.workspace_id)}`}
                              className="bb-admin-deep-link"
                            >
                              {r.name || r.business_name || "View business"}
                            </Link>
                          ) : (
                            <strong>{r.name || r.business_name || "—"}</strong>
                          ),
                      },
                      {
                        title: "Role",
                        render: (r) => valueOrDash(r.role || r.membership_role),
                      },
                      {
                        title: "Status",
                        render: (r) => <AdminStatus value={r.status} />,
                      },
                    ]}
                  />
                </Section>
              </div>
              <div>
                <Section title="Account snapshot">
                  <DetailsGrid
                    entries={[
                      [
                        "Plan",
                        user?.subscription?.plan?.name ||
                          user?.plan?.name ||
                          user?.plan_name,
                      ],
                      ["Subscription status", user?.subscription?.status],
                      ["Workspaces", user.workspace_count ?? businesses.length],
                      ["Onboarded", user.is_onboarded],
                      ["Referral code", user.referral_code],
                    ]}
                  />
                </Section>
                <section className="bb-admin-safety">
                  <ShieldCheck size={24} />
                  <strong>Read-only by design</strong>
                  <p>
                    Admin actions that change billing, user status or private
                    data must be backed by explicit permissions and audit
                    logging.
                  </p>
                </section>
              </div>
            </div>
          )}

          {tab === "Billing" && (
            <>
              <Section
                title="Subscription & billing"
                caption="The billing panel is read-only. Preview mode uses illustrative invoice and subscription data."
              >
                {!tabData &&
                !part.loading &&
                !part.error &&
                !adminApi.isConfigured("userBilling") &&
                !user?.billing &&
                !user?.subscription ? (
                  <p className="bb-admin-soft-empty">
                    Configure REACT_APP_API_ADMIN_USER_BILLING_PATH to show
                    billing details.
                  </p>
                ) : null}
                {part.loading && adminApi.isConfigured("userBilling") ? (
                  <AdminFeedback loading />
                ) : null}
                {part.error ? (
                  <AdminFeedback error={part.error} onRetry={part.reload} />
                ) : null}
                <DetailsGrid
                  entries={[
                    ["Current plan", payPlan],
                    [
                      "Subscription status",
                      details?.status || details?.subscription_status,
                    ],
                    [
                      "Billing cycle",
                      details?.billing_cycle || details?.interval,
                    ],
                    [
                      "Renewal / period end",
                      formatDate(
                        details?.current_period_end || details?.renewal_date,
                      ),
                    ],
                    ["Cancel at period end", details?.cancel_at_period_end],
                    [
                      "Credits balance",
                      details?.credits_balance ?? details?.credit_balance,
                    ],
                    [
                      "Total paid (minor units)",
                      details?.total_paid_minor != null
                        ? formatMinorMoney(
                            details.total_paid_minor,
                            details.currency || "USD",
                          )
                        : undefined,
                    ],
                    ["Currency", details?.currency],
                  ]}
                />
              </Section>
              <Section
                title="Invoices & payment history"
                caption="Amounts use minor currency units only when the API identifies them as such."
              >
                <NestedRows
                  rows={invoices}
                  emptyText="No invoices returned by the admin API."
                  labels={[
                    {
                      title: "Invoice",
                      render: (r) =>
                        valueOrDash(r.invoice_number || r.number || r.id),
                    },
                    {
                      title: "Date",
                      render: (r) => formatDate(r.created_at || r.date),
                    },
                    {
                      title: "Amount",
                      render: (r) =>
                        r.amount_minor != null
                          ? formatMinorMoney(
                              r.amount_minor,
                              r.currency || "USD",
                            )
                          : valueOrDash(r.display_amount),
                    },
                    {
                      title: "Status",
                      render: (r) => <AdminStatus value={r.status} />,
                    },
                  ]}
                />
              </Section>
            </>
          )}

          {tab === "AI usage" && (
            <Section
              title="AI usage & credits"
              caption="Usage values are read-only and shown for illustrative purposes in preview mode."
            >
              {part.loading ? (
                <AdminFeedback loading />
              ) : part.error ? (
                <AdminFeedback error={part.error} onRetry={part.reload} />
              ) : null}
              {!tabData &&
                !adminApi.isConfigured("userUsage") &&
                !user?.ai_usage &&
                !user?.usage && (
                  <p className="bb-admin-soft-empty">
                    Configure REACT_APP_API_ADMIN_USER_USAGE_PATH to connect
                    usage statistics.
                  </p>
                )}
              <DetailsGrid
                entries={[
                  [
                    "Total AI replies",
                    details?.ai_replies ?? details?.total_ai_messages,
                  ],
                  ["AI requests", details?.ai_requests ?? details?.requests],
                  [
                    "Tokens used",
                    details?.tokens_used ?? details?.total_tokens,
                  ],
                  [
                    "Credits used",
                    details?.credits_used ?? details?.consumed_credits,
                  ],
                  [
                    "Credits remaining",
                    details?.credits_remaining ?? details?.credit_balance,
                  ],
                  ["AI Brain status", details?.brain_status],
                  ["Period", details?.period],
                ]}
              />
            </Section>
          )}

          {tab === "Channels" && (
            <Section
              title="Connected channels"
              caption="No API keys, access tokens or message credentials are exposed."
            >
              {part.loading ? (
                <AdminFeedback loading />
              ) : part.error ? (
                <AdminFeedback error={part.error} onRetry={part.reload} />
              ) : null}
              <NestedRows
                rows={channelRows}
                emptyText="No channel connections returned. Configure the admin user channels endpoint if needed."
                labels={[
                  {
                    title: "Channel",
                    render: (r) =>
                      valueOrDash(r.name || r.platform || r.channel),
                  },
                  {
                    title: "Business",
                    render: (r) =>
                      valueOrDash(r.workspace_name || r.business_name),
                  },
                  {
                    title: "Status",
                    render: (r) => (
                      <AdminStatus value={r.status || r.connection_status} />
                    ),
                  },
                  { title: "Updated", render: (r) => formatDate(r.updated_at) },
                ]}
              />
            </Section>
          )}

          {tab === "Activity" && (
            <Section
              title="Recent account activity"
              caption="Platform audit events should be scoped to authorized fields only."
            >
              {part.loading ? (
                <AdminFeedback loading />
              ) : part.error ? (
                <AdminFeedback error={part.error} onRetry={part.reload} />
              ) : null}
              <NestedRows
                rows={activityRows}
                emptyText="No activity events returned. Configure the admin user activity endpoint if needed."
                labels={[
                  {
                    title: "Event",
                    render: (r) => valueOrDash(r.action || r.event || r.type),
                  },
                  {
                    title: "Detail",
                    render: (r) => valueOrDash(r.summary || r.description),
                  },
                  {
                    title: "When",
                    render: (r) => formatDate(r.created_at || r.occurred_at),
                  },
                ]}
              />
            </Section>
          )}

          {tab === "Security" && (
            <div className="bb-admin-detail-columns">
              <Section title="Security & access">
                <DetailsGrid
                  entries={[
                    [
                      "Email verified",
                      user.is_email_verified ?? user.email_verified,
                    ],
                    ["Onboarding completed", user.is_onboarded],
                    ["2FA enabled", user.two_factor_enabled],
                    ["Last login", formatDate(user.last_login_at)],
                    ["Failed login attempts", user.failed_login_attempts],
                  ]}
                />
              </Section>
              <section className="bb-admin-safety">
                <ShieldCheck size={27} />
                <strong>Protected personal information</strong>
                <p>
                  No passwords, refresh/access tokens, payment card details or
                  hidden API credentials should ever be returned by admin
                  endpoints.
                </p>
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
