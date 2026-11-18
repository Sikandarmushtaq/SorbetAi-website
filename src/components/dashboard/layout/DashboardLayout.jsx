import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalAlerts from './GlobalAlerts';

// Keeps the dashboard navigation and global controls mounted while child routes change.
export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className={`bellbee-dashboard ${mobileMenuOpen ? 'db-mobile-nav-open' : ''}`}>
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="db-main">
        <Header onMenuClick={() => setMobileMenuOpen((open) => !open)} />
        <GlobalAlerts />
        <main className="db-page-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
      {mobileMenuOpen && <button type="button" className="db-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />}
    </div>
  );
}
