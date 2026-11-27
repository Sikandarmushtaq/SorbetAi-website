
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Outlet,
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserRoundPlus,
  CreditCard,
  Menu,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

import {
  AdminToastProvider,
  useAdminToast,
} from "./AdminToastProvider";

import {
  isAdminPreviewEnabled,
} from "../../services/admin/adminPreviewData";

import "../dashboard/layout/DashboardLayout.css";
import "../dashboard/layout/Sidebar.css";
import "../dashboard/layout/Header.css";
import "../dashboard/styles/DashboardShared.css";
import "../dashboard/common/DashboardUI.css";

import "./AdminDashboard.css";
import "./AdminPremium.css";

const mobileItems = [
  {
    to: "/admin",
    label: "Home",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    to: "/admin/website-leads",
    label: "Leads",
    icon: UserRoundPlus,
  },
  {
    to: "/admin/billing",
    label: "Billing",
    icon: CreditCard,
  },
];

function AdminShellContent() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const location = useLocation();

  const toast = useAdminToast();

  const welcomed = useRef(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (welcomed.current) return;

    welcomed.current = true;

    if (isAdminPreviewEnabled) {
      toast.preview(
        "Welcome to Bellbee Admin",
        "UI-only preview is active. Records are fictional; no admin data is saved."
      );
    } else {
      toast.info(
        "Welcome to Bellbee Admin",
        "Your platform control center is ready."
      );
    }
  }, [toast]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    document.addEventListener(
      "keydown",
      closeOnEscape
    );

    return () => {
      document.body.style.overflow =
        oldOverflow;

      document.removeEventListener(
        "keydown",
        closeOnEscape
      );
    };
  }, [mobileOpen]);

  return (
    <div
      className={`bellbee-dashboard bb-admin bb-admin-premium ${
        mobileOpen
          ? "bb-admin-menu-open"
          : ""
      }`}
    >
      <button
        type="button"
        className="bb-admin-mobile-backdrop"
        aria-label="Close admin navigation"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() =>
          setMobileOpen(false)
        }
      />

      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      <div className="db-main">
        <AdminHeader
          onOpenMenu={() =>
            setMobileOpen(true)
          }
        />

        <main
          className="db-page-content bb-admin-content"
          key={location.pathname}
        >
          <div
            className="bb-admin-ambient"
            aria-hidden="true"
          >
            <i className="bb-admin-ambient-one" />
            <i className="bb-admin-ambient-two" />
            <i className="bb-admin-ambient-three" />
          </div>

          <div className="bb-admin-page-layer">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        className="bb-admin-bottom-nav"
        aria-label="Admin mobile navigation"
      >
        {mobileItems.map(
          ({
            to,
            label,
            icon: Icon,
            end,
          }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `bb-admin-bottom-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              <Icon size={19} />

              <span>{label}</span>
            </NavLink>
          )
        )}

        <button
          type="button"
          className="bb-admin-bottom-item"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="More admin pages"
        >
          <Menu size={19} />

          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

export default function AdminShell() {
  return (
    <AdminToastProvider>
      <AdminShellContent />
    </AdminToastProvider>
  );
}
