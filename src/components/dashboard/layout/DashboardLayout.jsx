import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FreePlanProvider } from '../common/FreePlanContext';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalAlerts from './GlobalAlerts';
import MobileBottomNav from './MobileBottomNav';
import MobileMoreMenu from './MobileMoreMenu';

// Keeps the dashboard shell persistent and switches to a five-item bottom bar on mobile.
export default function DashboardLayout() {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [location.pathname]);

  return (
    <FreePlanProvider>
      <div className="bellbee-dashboard">
        <Sidebar />
        <div className="db-main">
          <Header />
          <GlobalAlerts />
          {mobileMoreOpen ? (
            <MobileMoreMenu onNavigate={() => setMobileMoreOpen(false)} />
          ) : (
            <main className="db-page-content" key={location.pathname}>
              <Outlet />
            </main>
          )}
        </div>
        <MobileBottomNav moreOpen={mobileMoreOpen} onMoreClick={() => setMobileMoreOpen((open) => !open)} />
      </div>
    </FreePlanProvider>
  );
}
