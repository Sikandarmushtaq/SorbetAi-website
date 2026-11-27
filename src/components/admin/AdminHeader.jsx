
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useAdminToast } from "./AdminToastProvider";

import {
  isAdminPreviewEnabled,
} from "../../services/admin/adminPreviewData";

const LABELS = {
  users: "Users Management",
  businesses: "Businesses",
  billing: "Plans & Billing",
  "website-leads": "Website Leads",
  "website-conversations": "Website Chats",
  "ai-monitoring": "AI Monitoring",
  channels: "Channel Health",
  orders: "Orders Overview",
  appointments: "Appointments",
  campaigns: "Campaigns",
  templates: "Templates",
  support: "Support Tickets",
  analytics: "Platform Analytics",
  referrals: "Referrals",
  system: "System Health",
  audit: "Audit Logs",
};

export default function AdminHeader({ onOpenMenu }) {
  const { user, signOut } = useAuth();
  const toast = useAdminToast();
  const navigate = useNavigate();

  const { pathname } = useLocation();

  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const anchorRef = useRef(null);

  const name =
    user?.full_name ||
    user?.name ||
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Platform Admin";

  const email =
    user?.email ||
    (isAdminPreviewEnabled
      ? "Local design preview"
      : "Admin account");

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  const segment = pathname.split("/")[2];

  const title =
    pathname === "/admin"
      ? "Overview"
      : pathname.includes("/users/")
        ? "User Details"
        : LABELS[segment] || "Admin Dashboard";

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const outside = (event) => {
      if (!anchorRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener(
        "pointerdown",
        outside
      );

      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  const go = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    navigate(
      `/admin/users${
        query.trim()
          ? `?q=${encodeURIComponent(query.trim())}`
          : ""
      }`
    );
  };

  const handleLogout = async () => {
    setProfileOpen(false);

    if (isAdminPreviewEnabled) {
      toast.preview(
        "Preview session",
        "Sign out is disabled in local UI-only preview. No admin session was created."
      );
      return;
    }

    try {
      await signOut();
      navigate("/signin", { replace: true });
    } catch (error) {
      toast.error(
        "Could not sign out",
        error?.message || "Please try again."
      );
    }
  };

  return (
    <header className="db-header bb-admin-header">
      <div className="bb-admin-header-start">
        <button
          className="bb-admin-mobile-toggle"
          type="button"
          aria-label="Open admin menu"
          onClick={onOpenMenu}
        >
          <Menu size={20} />
        </button>

        <div className="bb-admin-header-heading">
          <span className="bb-admin-header-eyebrow">
            <ShieldCheck size={13} />
            BELLBEE CONTROL CENTER
          </span>

          <strong>{title}</strong>
        </div>
      </div>

      <form
        className="bb-admin-search"
        onSubmit={handleSearch}
        role="search"
      >
        <Search size={18} />

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search members, emails..."
          aria-label="Search registered users"
        />

        <kbd>↵</kbd>

        <button type="submit" aria-label="Search users">
          <Search size={16} />
        </button>
      </form>

      <div className="bb-admin-header-actions">
        {isAdminPreviewEnabled && (
          <span className="bb-admin-top-preview">
            <span />
            PREVIEW MODE
          </span>
        )}

        <button
          type="button"
          className="bb-admin-notification-icon"
          aria-label="Notifications"
          onClick={() =>
            toast.info(
              "Notifications",
              "Admin alerts will appear here when notification services are connected."
            )
          }
        >
          <Bell size={19} />
        </button>

        <div
          className="bb-admin-profile-anchor"
          ref={anchorRef}
        >
          <button
            type="button"
            className={`bb-admin-profile-trigger ${
              profileOpen ? "is-open" : ""
            }`}
            onClick={() =>
              setProfileOpen((open) => !open)
            }
            aria-label="Open admin account menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="bb-admin-profile-avatar">
              {initials || <UserRound size={17} />}
            </span>

            <span className="bb-admin-profile-trigger-label">
              <strong>{name}</strong>
              <small>Platform Admin</small>
            </span>

            <ChevronDown
              className="bb-admin-profile-chevron"
              size={15}
            />
          </button>

          {profileOpen && (
            <div
              className="bb-admin-profile-menu"
              role="menu"
            >
              <div className="bb-admin-profile-intro">
                <span className="bb-admin-profile-avatar large">
                  {initials || (
                    <UserRound size={19} />
                  )}
                </span>

                <div>
                  <strong>{name}</strong>
                  <small>{email}</small>
                </div>
              </div>

              <div className="bb-admin-profile-menu-caption">
                YOUR WORKSPACE
              </div>

              <button
                role="menuitem"
                type="button"
                onClick={() => go("/admin")}
              >
                <LayoutDashboard size={17} />
                Admin overview
              </button>

              <button
                role="menuitem"
                type="button"
                onClick={() => go("/admin/users")}
              >
                <Users size={17} />
                Users management
              </button>

              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setProfileOpen(false);

                  toast.info(
                    "Admin settings",
                    "Dedicated admin settings will be available in a future update."
                  );
                }}
              >
                <CircleHelp size={17} />
                Help & settings
                <span className="bb-admin-menu-soon">
                  Soon
                </span>
              </button>

              <div className="bb-admin-profile-menu-divider" />

              <button
                role="menuitem"
                type="button"
                className="bb-admin-profile-signout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
