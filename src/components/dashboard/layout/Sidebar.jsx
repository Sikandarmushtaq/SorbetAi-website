import './Sidebar.css';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Pin, PinOff, X } from 'lucide-react';
import { navigationGroups } from './navigation';

// Renders route navigation and supports hover-expand, pinning, and mobile full-screen navigation.
export default function Sidebar({ mobileOpen, onClose }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const expanded = mobileOpen || isPinned || isHovered;

  const routeFor = (id) => id ? `/dashboard/${id}` : '/dashboard';

  const handleNavigate = () => {
    setIsHovered(false);
    onClose?.();
  };

  return (
    <aside
      className={`db-sidebar ${expanded ? 'is-expanded' : ''} ${isPinned ? 'is-pinned' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      onMouseEnter={() => !mobileOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Dashboard navigation"
    >
      <div className="db-sidebar-top">
        <button type="button" className="db-brand" onClick={() => { navigate('/dashboard'); handleNavigate(); }} aria-label="Go to dashboard">
          <span className="db-brand-mark"><MessageSquare size={20} /><i /></span>
          <span className="db-brand-name">Bellbee</span>
        </button>

        {mobileOpen ? (
          <button type="button" className="db-pin-button db-mobile-close" onClick={onClose} aria-label="Close navigation"><X size={17} /></button>
        ) : expanded ? (
          <button
            type="button"
            className={`db-pin-button ${isPinned ? 'active' : ''}`}
            onClick={() => setIsPinned((current) => !current)}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        ) : null}
      </div>

      <nav className="db-sidebar-nav">
        <NavLink to="/dashboard" end onClick={handleNavigate} title={!expanded ? 'Dashboard' : undefined} className={({ isActive }) => `db-nav-item db-dashboard-link ${isActive ? 'active' : ''}`}>
          <span className="db-nav-icon"><Home size={18} /></span>
          <span className="db-nav-label">Dashboard</span>
        </NavLink>

        {navigationGroups.map((group) => (
          <div className="db-nav-group" key={group.title}>
            <p className="db-nav-group-title">{group.title}</p>
            {group.items.map(({ id, label, icon: Icon }) => (
              <NavLink key={id} to={routeFor(id)} onClick={handleNavigate} title={!expanded ? label : undefined} className={({ isActive }) => `db-nav-item ${isActive ? 'active' : ''}`}>
                <span className="db-nav-icon"><Icon size={18} /></span>
                <span className="db-nav-label">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="db-sidebar-bottom">
        <NavLink to="/dashboard/suggestions" onClick={handleNavigate} title={!expanded ? 'Suggestion Box' : undefined} className={({ isActive }) => `db-nav-item ${isActive ? 'active' : ''}`}>
          <span className="db-nav-icon"><span className="db-lightbulb-mark">✦</span></span>
          <span className="db-nav-label">Suggestion Box</span>
        </NavLink>
      </div>
    </aside>
  );
}
