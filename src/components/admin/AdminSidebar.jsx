
import {
  useRef,
  useState,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  MessageSquare,
  Pin,
  PinOff,
  X,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

import {
  adminNavGroups,
} from "./adminNavigation";

export default function AdminSidebar({
  mobileOpen,
  onClose,
}) {
  const [isPinned, setPinned] =
    useState(true);

  const [isHovered, setHovered] =
    useState(false);

  const ignoreHoverUntilLeave =
    useRef(false);

  const navigate = useNavigate();

  const expanded =
    mobileOpen || isPinned || isHovered;

  const navigateClose = () => {
    setHovered(false);
    onClose?.();
  };

  function togglePin() {
    if (isPinned) {
      ignoreHoverUntilLeave.current =
        true;

      setHovered(false);
      setPinned(false);
    } else {
      ignoreHoverUntilLeave.current =
        false;

      setHovered(false);
      setPinned(true);
    }
  }

  return (
    <aside
      className={`db-sidebar bb-admin-sidebar ${
        expanded ? "is-expanded" : ""
      } ${
        isPinned ? "is-pinned" : ""
      } ${
        mobileOpen ? "mobile-open" : ""
      }`}
      aria-label="Platform admin navigation"
      onMouseEnter={() => {
        if (
          !mobileOpen &&
          !isPinned &&
          !ignoreHoverUntilLeave.current
        ) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        ignoreHoverUntilLeave.current =
          false;

        setHovered(false);
      }}
    >
      <div className="db-sidebar-top">
        <button
          className="db-brand"
          type="button"
          onClick={() => {
            navigate("/admin");
            navigateClose();
          }}
        >
          <span className="db-brand-mark">
            <MessageSquare size={20} />
            <i />
          </span>

          <span className="db-brand-name">
            Bellbee

            <small className="bb-admin-brand-tag">
              PLATFORM ADMIN
            </small>
          </span>
        </button>

        {mobileOpen ? (
          <button
            type="button"
            className="db-pin-button db-mobile-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        ) : expanded ? (
          <button
            type="button"
            className={`db-pin-button ${
              isPinned ? "active" : ""
            }`}
            onClick={togglePin}
            title={
              isPinned
                ? "Collapse navigation"
                : "Keep navigation expanded"
            }
            aria-label={
              isPinned
                ? "Collapse sidebar"
                : "Pin sidebar"
            }
            aria-pressed={isPinned}
          >
            {isPinned ? (
              <PinOff size={16} />
            ) : (
              <Pin size={16} />
            )}
          </button>
        ) : null}
      </div>

      <nav
        className="db-sidebar-nav"
        aria-label="Admin modules"
      >
        <NavLink
          to="/admin"
          end
          onClick={navigateClose}
          title={
            !expanded
              ? "Dashboard"
              : undefined
          }
          className={({ isActive }) =>
            `db-nav-item db-dashboard-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="db-nav-icon">
            <LayoutDashboard size={18} />
          </span>

          <span className="db-nav-label">
            Dashboard
          </span>
        </NavLink>

        {adminNavGroups.map((group) => (
          <div
            className="db-nav-group"
            key={group.title}
          >
            <p className="db-nav-group-title">
              {group.title}
            </p>

            {group.items.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <NavLink
                  key={id}
                  to={`/admin/${id}`}
                  onClick={navigateClose}
                  title={
                    !expanded
                      ? label
                      : undefined
                  }
                  className={({ isActive }) =>
                    `db-nav-item ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                >
                  <span className="db-nav-icon">
                    <Icon size={18} />
                  </span>

                  <span className="db-nav-label">
                    {label}
                  </span>
                </NavLink>
              )
            )}
          </div>
        ))}
      </nav>

      <div className="db-sidebar-bottom">
        <div className="bb-admin-sidebar-bottom-inner">
          <ShieldCheck size={16} />

          <span className="bb-admin-sidebar-foot">
            {expanded
              ? "PLATFORM CONTROL CENTER"
              : "✦"}
          </span>
        </div>
      </div>
    </aside>
  );
}
