import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import {
  AdminPageHeader,
  AdminFeedback,
  AdminStatus,
  useAdminResource,
  getName,
  formatDate,
  valueOrDash,
} from "../../components/admin/AdminUI";

import {
  useAdminToast,
} from "../../components/admin/AdminToastProvider";

import {
  isAdminPreviewEnabled,
} from "../../services/admin/adminPreviewData";

export const MODULES = {
  businesses: {
    title: "Businesses",
    description:
      "Monitor registered workspaces, their owners, plans and onboarding status.",
    eyebrow: "PLATFORM / WORKSPACES",
    detail: true,
    columns: [
      [
        "Business",
        (r) =>
          r.name ||
          r.business_name ||
          r.workspace_name,
      ],
      [
        "Owner",
        (r) =>
          r.owner?.email ||
          r.owner_email ||
          r.owner_name,
      ],
      [
        "Plan",
        (r) =>
          r.plan?.name ||
          r.plan_name ||
          r.subscription?.plan?.name,
      ],
      [
        "Status",
        (r) =>
          r.status || r.onboarding_status,
        true,
      ],
      ["Created", (r) => formatDate(r.created_at)],
    ],
  },

  leads: {
    title: "Website leads",
    description:
      "Bellbee landing chatbot visitors and inbound enquiries, not business-customer leads.",
    eyebrow: "WEBSITE / LEADS",
    detail: true,
    base: "/admin/website-leads",
    columns: [
      ["Visitor", (r) => getName(r)],
      ["Email", (r) => r.email],
      ["Phone", (r) => r.phone],
      [
        "Source",
        (r) => r.source || "Landing chatbot",
      ],
      ["Status", (r) => r.status, true],
      ["Received", (r) => formatDate(r.created_at)],
    ],
  },

  conversations: {
    title: "Website conversations",
    description:
      "Conversations with visitors to the Bellbee landing page; business chats are separate.",
    eyebrow: "WEBSITE / CONVERSATIONS",
    detail: true,
    base: "/admin/website-conversations",
    columns: [
      [
        "Visitor",
        (r) =>
          r.visitor_name ||
          getName(r.visitor || r),
      ],
      [
        "Email",
        (r) =>
          r.visitor?.email || r.email,
      ],
      [
        "Channel",
        (r) =>
          r.source || r.channel,
      ],
      [
        "Messages",
        (r) => r.message_count,
      ],
      ["Status", (r) => r.status, true],
      [
        "Started",
        (r) =>
          formatDate(
            r.started_at || r.created_at
          ),
      ],
    ],
  },

  billing: {
    title: "Plans & billing",
    description:
      "Platform subscriptions, payment statuses, credit balances and billing issues.",
    eyebrow: "PLATFORM / FINANCE",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name ||
          r.user?.email,
      ],
      [
        "Plan",
        (r) =>
          r.plan?.name || r.plan_name,
      ],
      ["Cycle", (r) => r.billing_cycle],
      [
        "Status",
        (r) =>
          r.status ||
          r.subscription_status,
        true,
      ],
      [
        "Renews",
        (r) =>
          formatDate(
            r.current_period_end ||
              r.renewal_date
          ),
      ],
    ],
  },

  ai: {
    title: "AI monitoring",
    description:
      "Platform-level AI activity, errors and usage across workspaces.",
    eyebrow: "OPERATIONS / AI",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      [
        "AI replies",
        (r) =>
          r.ai_replies ?? r.reply_count,
      ],
      ["Credits", (r) => r.credits_used],
      ["Model", (r) => r.model],
      ["Status", (r) => r.status, true],
      [
        "Updated",
        (r) => formatDate(r.updated_at),
      ],
    ],
  },

  channels: {
    title: "Channel health",
    description:
      "WhatsApp, Instagram, Messenger and website chat connection monitoring.",
    eyebrow: "OPERATIONS / CHANNELS",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      [
        "Channel",
        (r) =>
          r.platform ||
          r.channel ||
          r.name,
      ],
      [
        "Status",
        (r) =>
          r.connection_status ||
          r.status,
        true,
      ],
      [
        "Last sync",
        (r) =>
          formatDate(r.last_sync_at),
      ],
    ],
  },

  orders: {
    title: "Orders overview",
    description:
      "Aggregate order processing trends and failures across businesses.",
    eyebrow: "OPERATIONS / ORDERS",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      [
        "Order",
        (r) =>
          r.order_number || r.id,
      ],
      [
        "Item",
        (r) => r.product_name,
      ],
      ["Status", (r) => r.status, true],
      [
        "Created",
        (r) =>
          formatDate(r.created_at),
      ],
    ],
  },

  appointments: {
    title: "Appointments",
    description:
      "Business booking volumes, statuses and scheduling issues.",
    eyebrow: "OPERATIONS / APPOINTMENTS",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      ["Service", (r) => r.service_name],
      [
        "When",
        (r) =>
          formatDate(
            r.start_at || r.starts_at
          ),
      ],
      ["Status", (r) => r.status, true],
    ],
  },

  campaigns: {
    title: "Campaign monitoring",
    description:
      "WhatsApp template broadcasts and campaign delivery results.",
    eyebrow: "OPERATIONS / CAMPAIGNS",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      [
        "Campaign",
        (r) =>
          r.name || r.title,
      ],
      [
        "Audience",
        (r) =>
          r.audience_size,
      ],
      ["Status", (r) => r.status, true],
      [
        "Created",
        (r) =>
          formatDate(r.created_at),
      ],
    ],
  },

  templates: {
    title: "Message templates",
    description:
      "Platform visibility into approved, pending and rejected message templates.",
    eyebrow: "OPERATIONS / TEMPLATES",
    columns: [
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      ["Template", (r) => r.name],
      ["Language", (r) => r.language],
      ["Status", (r) => r.status, true],
    ],
  },

  support: {
    title: "Support tickets",
    description:
      "Tickets submitted by Bellbee businesses and their assigned support owners.",
    eyebrow: "OPERATIONS / SUPPORT",
    columns: [
      [
        "Ticket",
        (r) =>
          r.subject ||
          r.title ||
          r.id,
      ],
      [
        "Business",
        (r) =>
          r.workspace_name ||
          r.business_name,
      ],
      ["Priority", (r) => r.priority],
      [
        "Assigned to",
        (r) =>
          r.assigned_to?.name ||
          r.assigned_to,
      ],
      ["Status", (r) => r.status, true],
      [
        "Created",
        (r) =>
          formatDate(r.created_at),
      ],
    ],
  },

  analytics: {
    title: "Platform analytics",
    description:
      "Platform-wide engagement and conversion insights, as reported by your admin analytics API.",
    eyebrow: "INSIGHTS / ANALYTICS",
    columns: [
      [
        "Metric",
        (r) =>
          r.name ||
          r.metric ||
          r.label,
      ],
      ["Value", (r) => r.value],
      ["Period", (r) => r.period],
      ["Change", (r) => r.change],
    ],
  },

  referrals: {
    title: "Referrals",
    description:
      "Referral registrations, rewards, redemption statuses and review signals.",
    eyebrow: "INSIGHTS / REFERRALS",
    columns: [
      [
        "Code",
        (r) =>
          r.code || r.referral_code,
      ],
      [
        "Referrer",
        (r) =>
          r.referrer_name ||
          r.referrer_email,
      ],
      [
        "Referred",
        (r) =>
          r.referred_name ||
          r.referred_email,
      ],
      ["Status", (r) => r.status, true],
      [
        "Created",
        (r) =>
          formatDate(r.created_at),
      ],
    ],
  },

  system: {
    title: "System health",
    description:
      "Backend health, message delivery issues, integration failures and incidents.",
    eyebrow: "INSIGHTS / SYSTEM",
    columns: [
      [
        "Service",
        (r) =>
          r.name || r.service,
      ],
      ["Region", (r) => r.region],
      ["Status", (r) => r.status, true],
      [
        "Last checked",
        (r) =>
          formatDate(
            r.last_checked_at ||
              r.checked_at
          ),
      ],
    ],
  },

  audit: {
    title: "Audit logs",
    description:
      "Trace admin actions, security events and sensitive platform changes.",
    eyebrow: "SECURITY / AUDIT",
    columns: [
      [
        "Action",
        (r) =>
          r.action || r.event,
      ],
      [
        "Actor",
        (r) =>
          r.actor?.email ||
          r.actor_email,
      ],
      [
        "Target",
        (r) =>
          r.target_type ||
          r.resource,
      ],
      ["Status", (r) => r.status, true],
      [
        "When",
        (r) =>
          formatDate(r.created_at),
      ],
    ],
  },
};

const PREVIEW_STATUS_OPTIONS = {
  leads: [
    "new",
    "contacted",
    "qualified",
    "converted",
    "closed",
  ],
  support: [
    "open",
    "in_progress",
    "resolved",
    "closed",
  ],
  campaigns: [
    "draft",
    "scheduled",
    "paused",
    "completed",
  ],
};

export default function AdminModulePage({
  moduleKey,
}) {
  const definition = MODULES[moduleKey];
  const toast = useAdminToast();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [demoChanges, setDemoChanges] =
    useState({});

  const {
    rows,
    loading,
    error,
    reload,
  } = useAdminResource(moduleKey);

  const demoEditable =
    isAdminPreviewEnabled &&
    Boolean(PREVIEW_STATUS_OPTIONS[moduleKey]);

  const recordId = useCallback(
    (row, index) =>
      String(
        row?.id ??
          row?.lead_id ??
          row?.conversation_id ??
          row?.workspace_id ??
          index
      ),
    []
  );

  const rowStatus = useCallback(
    (row, index) =>
      demoChanges[recordId(row, index)] ||
      row?.status ||
      row?.connection_status ||
      row?.account_status ||
      "",
    [demoChanges, recordId]
  );

  const filtered = useMemo(
    () =>
      rows.filter((row, index) => {
        const text = Object.entries(row || {})
          .filter(
            ([, value]) =>
              typeof value === "string" ||
              typeof value === "number"
          )
          .map(([, value]) => value)
          .join(" ")
          .toLowerCase();

        const currentStatus = String(
          rowStatus(row, index)
        ).toLowerCase();

        return (
          text.includes(query.trim().toLowerCase()) &&
          (statusFilter === "all" ||
            currentStatus === statusFilter)
        );
      }),
    [
      rows,
      query,
      statusFilter,
      rowStatus,
    ]
  );

  function refresh() {
    setDemoChanges({});
    reload();
  }

  function updatePreview(id, value) {
    setDemoChanges((current) => ({
      ...current,
      [id]: value,
    }));

    toast.preview(
      "Preview status updated",
      `Status set to ${value.replace(/_/g, " ")}. This is a local demonstration, not a server save.`
    );
  }

  return (
    <>
      <AdminPageHeader
        title={definition.title}
        description={definition.description}
        eyebrow={definition.eyebrow}
      >
        <button
          type="button"
          className="bb-admin-btn bb-admin-btn-light"
          onClick={refresh}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </AdminPageHeader>

      <section className="dp-panel bb-admin-panel">
        <div className="bb-admin-panel-heading">
          <h2>
            Records
            <small>
              {loading ? "…" : filtered.length}
            </small>
          </h2>
        </div>

        <div className="bb-admin-toolbar">
          <label className="bb-admin-filter-search">
            <Search size={17} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder={`Search ${definition.title.toLowerCase()}...`}
              aria-label="Search records"
            />
          </label>

          <select
            aria-label="Filter status"
            className="bb-admin-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">
              All statuses
            </option>

            {[
              ...new Set(
                rows
                  .map((r) =>
                    String(
                      r.status ||
                        r.connection_status ||
                        r.account_status ||
                        ""
                    ).toLowerCase()
                  )
                  .filter(Boolean)
              ),
            ].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <AdminFeedback
          loading={loading}
          error={error}
          onRetry={refresh}
          empty={!filtered.length}
          emptyTitle={
            rows.length
              ? "No matching records"
              : "No records returned"
          }
          emptyDescription={
            rows.length
              ? "Try another search or status."
              : `Connect the platform-admin ${moduleKey} endpoint to populate this view.`
          }
        />

        {!loading &&
          !error &&
          filtered.length > 0 && (
            <div className="bb-admin-table-wrap">
              <table className="bb-admin-table">
                <thead>
                  <tr>
                    {definition.columns.map(
                      ([name]) => (
                        <th key={name}>{name}</th>
                      )
                    )}

                    {demoEditable && (
                      <th>Try demo action</th>
                    )}

                    {definition.detail && <th />}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r, index) => {
                    const id =
                      r?.id ||
                      r?.lead_id ||
                      r?.conversation_id ||
                      r?.workspace_id;

                    const href =
                      definition.base ||
                      `/admin/${moduleKey}`;

                    const currentStatus =
                      rowStatus(r, index);

                    const choices = demoEditable
                      ? [
                          ...new Set([
                            currentStatus,
                            ...PREVIEW_STATUS_OPTIONS[
                              moduleKey
                            ],
                          ]),
                        ].filter(Boolean)
                      : [];

                    return (
                      <tr key={String(id ?? index)}>
                        {definition.columns.map(
                          ([name, accessor, badge]) => (
                            <td key={name}>
                              {badge ? (
                                <AdminStatus
                                  value={
                                    demoChanges[
                                      recordId(
                                        r,
                                        index
                                      )
                                    ] ||
                                    accessor(r)
                                  }
                                />
                              ) : (
                                <span>
                                  {valueOrDash(
                                    accessor(r)
                                  )}
                                </span>
                              )}
                            </td>
                          )
                        )}

                        {demoEditable && (
                          <td>
                            <select
                              className="bb-admin-preview-select"
                              aria-label={`Preview status for ${recordId(r, index)}`}
                              value={currentStatus}
                              onChange={(event) =>
                                updatePreview(
                                  recordId(
                                    r,
                                    index
                                  ),
                                  event.target.value
                                )
                              }
                            >
                              {choices.map((value) => (
                                <option
                                  key={value}
                                  value={value}
                                >
                                  {value.replace(
                                    /_/g,
                                    " "
                                  )}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {definition.detail && (
                          <td>
                            {id != null ? (
                              <Link
                                className="bb-admin-view"
                                to={`${href}/${encodeURIComponent(id)}`}
                              >
                                View details
                                <ArrowUpRight size={14} />
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {demoEditable && (
        <p className="bb-admin-demo-hint">
          <Sparkles size={14} />
          Try changing a status: only this page
          updates, and a preview toast appears.
          Refresh resets the sample records.
        </p>
      )}

      <p className="bb-admin-page-note">
        {isAdminPreviewEnabled
          ? "UI-ONLY DEMO: All records are fictional and stored in the frontend. No admin API calls are made."
          : "These records are returned by dedicated, backend-authorized admin APIs."}
      </p>
    </>
  );
}
