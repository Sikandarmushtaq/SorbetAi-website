
import { Link } from "react-router-dom";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CreditCard,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  Users,
} from "lucide-react";

import {
  AdminStat,
  AdminFeedback,
  useAdminResource,
  normalizeCounter,
} from "../../components/admin/AdminUI";

import {
  isAdminPreviewEnabled,
} from "../../services/admin/adminPreviewData";

const cards = [
  {
    label: "Registered users",
    keys: ["users", "total_users", "user_count"],
    icon: Users,
    tone: "coral",
    to: "/admin/users",
  },
  {
    label: "Businesses",
    keys: [
      "businesses",
      "total_businesses",
      "workspace_count",
    ],
    icon: Building2,
    tone: "lavender",
    to: "/admin/businesses",
  },
  {
    label: "Website leads",
    keys: [
      "website_leads",
      "total_leads",
      "lead_count",
    ],
    icon: UserRoundPlus,
    tone: "yellow",
    to: "/admin/website-leads",
  },
  {
    label: "Website conversations",
    keys: [
      "website_conversations",
      "total_conversations",
    ],
    icon: MessageSquare,
    tone: "green",
    to: "/admin/website-conversations",
  },
  {
    label: "Active subscriptions",
    keys: [
      "active_subscriptions",
      "subscriptions",
    ],
    icon: CreditCard,
    tone: "lavender",
    to: "/admin/billing",
  },
  {
    label: "Open support tickets",
    keys: [
      "open_support_tickets",
      "open_tickets",
    ],
    icon: LifeBuoy,
    tone: "coral",
    to: "/admin/support",
  },
];

const quick = [
  {
    title: "Users management",
    details:
      "Accounts, plans, activity and individual profiles",
    to: "/admin/users",
    icon: Users,
  },
  {
    title: "Website leads",
    details:
      "Explore visitor enquiries and follow-up progress",
    to: "/admin/website-leads",
    icon: UserRoundPlus,
  },
  {
    title: "AI monitoring",
    details:
      "See activity, models and usage by business",
    to: "/admin/ai-monitoring",
    icon: Activity,
  },
  {
    title: "Audit logs",
    details:
      "Review sensitive platform events and changes",
    to: "/admin/audit",
    icon: ShieldCheck,
  },
];

function metric(data, keys) {
  const stats =
    data?.stats ??
    data?.metrics ??
    data?.overview ??
    data ??
    {};

  const key = keys.find(
    (candidate) =>
      stats?.[candidate] !== undefined
  );

  return key
    ? normalizeCounter(stats[key])
    : "—";
}

export default function AdminHomePage() {
  const {
    data,
    loading,
    error,
    reload,
  } = useAdminResource("overview");

  return (
    <>
      {/* PREMIUM WELCOME HERO */}
      <section
        className="bb-admin-spotlight"
        aria-label="Platform overview introduction"
      >
        <div className="bb-admin-spotlight-copy">
          <span className="bb-admin-spotlight-kicker">
            <Sparkles size={15} />

            {isAdminPreviewEnabled
              ? "DESIGN PREVIEW • FICTIONAL DATA"
              : "PLATFORM CONTROL CENTER"}
          </span>

          <h1>
            Everything Bellbee.
            <br />
            <em>One beautiful overview.</em>
          </h1>

          <p>
            Keep a pulse on businesses, registered
            users, website enquiries and platform
            operations — all in one thoughtfully
            organised space.
          </p>

          <div className="bb-admin-spotlight-actions">
            <Link to="/admin/users">
              Explore users
              <ArrowRight size={16} />
            </Link>

            <Link to="/admin/website-leads">
              Website leads
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div
          className="bb-admin-spotlight-art"
          aria-hidden="true"
        >
          <div className="bb-admin-orbit">
            <span className="bb-admin-orbit-core">
              <LayoutGrid size={37} />
            </span>

            <span className="bb-admin-orbit-pill one">
              <Users size={14} />
              People
            </span>

            <span className="bb-admin-orbit-pill two">
              <ShieldCheck size={14} />
              Secure view
            </span>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <div className="bb-admin-section-label">
        Platform at a glance

        <span>
          {isAdminPreviewEnabled
            ? "Sample metrics only"
            : "Latest available metrics"}
        </span>
      </div>

      <div className="dp-stats-grid bb-admin-stats-six">
        {cards.map(
          ({
            label,
            keys,
            icon,
            tone,
            to,
          }) => (
            <Link
              key={label}
              className="bb-admin-stat-link"
              to={to}
            >
              <AdminStat
                label={label}
                value={metric(data, keys)}
                icon={icon}
                tone={tone}
              />
            </Link>
          )
        )}
      </div>

      {(loading || error) && (
        <section className="dp-panel bb-admin-panel">
          <AdminFeedback
            loading={loading}
            error={error}
            onRetry={reload}
          />
        </section>
      )}

      {/* QUICK ACCESS + MANAGEMENT */}
      <div className="bb-admin-home-grid">
        <section className="dp-panel bb-admin-panel">
          <div className="bb-admin-panel-heading">
            <div>
              <span className="dp-eyebrow">
                EXPLORE YOUR WORKSPACE
              </span>

              <h2>Quick access</h2>
            </div>

            <LayoutGrid size={21} />
          </div>

          <p className="bb-admin-panel-lead">
            Your most important admin tools,
            a click away.
          </p>

          <div className="bb-admin-quick-grid">
            {quick.map(
              ({
                title,
                details,
                to,
                icon: Icon,
              }) => (
                <Link
                  to={to}
                  className="bb-admin-quick"
                  key={to}
                >
                  <span className="bb-admin-quick-icon">
                    <Icon size={21} />
                  </span>

                  <strong>{title}</strong>

                  <small>{details}</small>

                  <ArrowUpRight
                    className="bb-admin-quick-arrow"
                    size={17}
                  />
                </Link>
              )
            )}
          </div>
        </section>

        <section className="dp-panel bb-admin-panel bb-admin-guide">
          <span className="dp-eyebrow">
            BUILT FOR THOUGHTFUL MANAGEMENT
          </span>

          <ShieldCheck size={38} />

          <h2>
            A clearer view.
            <br />
            Better decisions.
          </h2>

          <p>
            Admin permissions and user data are
            kept separate from the business
            dashboard. Sensitive information
            should only appear when the backend
            explicitly authorizes it.
          </p>

          <Link
            className="bb-admin-btn bb-admin-btn-primary"
            to="/admin/users"
          >
            Open users management
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
