
import "./DashboardLayout.css";
import "../styles/DashboardShared.css";
import "../styles/DashboardPremium.css";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  Sparkles,
} from "lucide-react";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  DashboardToastProvider,
} from "../common/DashboardToastProvider";

import {
  FreePlanProvider,
} from "../common/FreePlanContext";

import Sidebar from "./Sidebar";
import Header from "./Header";
import GlobalAlerts from "./GlobalAlerts";
import MobileBottomNav from "./MobileBottomNav";
import MobileMoreMenu from "./MobileMoreMenu";

function DashboardWelcome() {
  const { user } = useAuth();

  const person =
    user?.profile ||
    user?.user ||
    user ||
    {};

  const first = String(
    person.first_name || ""
  ).trim();

  const last = String(
    person.last_name || ""
  ).trim();

  const full =
    [first, last]
      .filter(Boolean)
      .join(" ") ||
    String(
      person.full_name ||
        person.name ||
        ""
    ).trim();

  return (
    <section
      className="bb-user-welcome"
      aria-label="Dashboard welcome"
    >
      <div className="bb-user-welcome-content">
        <span className="bb-user-welcome-eyebrow">
          <Sparkles size={15} />
          YOUR BELLBEE WORKSPACE
        </span>

        <h1>
          Welcome
          {full
            ? `, ${full}`
            : " to Bellbee"}

          <span className="bb-user-welcome-dot">
            .
          </span>
        </h1>

        <p>
          Your conversations, customers, and
          business activity — beautifully
          organised in one place.
        </p>
      </div>

      <span
        className="bb-user-welcome-decoration"
        aria-hidden="true"
      >
        <Sparkles size={42} />
      </span>
    </section>
  );
}

export default function DashboardLayout() {
  const [
    mobileMoreOpen,
    setMobileMoreOpen,
  ] = useState(false);

  const location = useLocation();

  const isHome =
    location.pathname.replace(/\/+$/, "") ===
    "/dashboard";

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [location.pathname]);

  return (
    <DashboardToastProvider>
      <FreePlanProvider>
        <div className="bellbee-dashboard bb-user-premium">
          <Sidebar />

          <div className="db-main">
            <Header />

            <GlobalAlerts />

            {mobileMoreOpen ? (
              <MobileMoreMenu
                onNavigate={() =>
                  setMobileMoreOpen(false)
                }
              />
            ) : (
              <main
                className="db-page-content bb-user-stage"
                key={location.pathname}
              >
                <div
                  className="bb-user-ambient"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </div>

                <div className="bb-user-stage-inner">
                  {isHome && (
                    <DashboardWelcome />
                  )}

                  <Outlet />
                </div>
              </main>
            )}
          </div>

          <MobileBottomNav
            moreOpen={mobileMoreOpen}
            onMoreClick={() =>
              setMobileMoreOpen(
                (open) => !open
              )
            }
          />
        </div>
      </FreePlanProvider>
    </DashboardToastProvider>
  );
}
