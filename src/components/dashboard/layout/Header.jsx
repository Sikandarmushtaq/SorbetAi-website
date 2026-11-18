import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, LifeBuoy, Lightbulb, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { allDashboardItems } from './navigation';

// Provides global search, notifications, quick links, and the account menu.
export default function Header({ onMenuClick }) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return allDashboardItems.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const closeMenus = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  const goTo = (id) => {
    navigate(id ? `/dashboard/${id}` : '/dashboard');
    setQuery('');
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const logout = () => {
    // Authentication will be connected when the backend is integrated.
    navigate('/signin');
  };

  return (
    <header className="db-header">
      <div className="db-header-left">
        <button type="button" className="db-mobile-menu-button" onClick={onMenuClick} aria-label="Open dashboard navigation"><Menu size={19} /></button>
        <div className="db-search-wrap">
          <Search size={17} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search customers, orders, products…"
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results.length) goTo(results[0].id);
            }}
          />
          {query && <button type="button" className="db-clear-search" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
          <kbd>Ctrl K</kbd>
          {searchOpen && query.trim() && (
            <div className="db-search-results">
              {results.length ? results.map((item) => {
                const Icon = item.icon;
                return <button type="button" key={item.id} onClick={() => goTo(item.id)}><Icon size={16} /><span>{item.label}</span><ChevronRight size={14} /></button>;
              }) : <p>No matching sections found.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="db-header-actions" ref={menuRef}>
        <button type="button" className="db-header-link" onClick={() => goTo('suggestions')}><Lightbulb size={16} /><span>Suggestion Box</span></button>
        <div className="db-menu-anchor">
          <button type="button" className={`db-header-icon-button ${notificationsOpen ? 'is-open' : ''}`} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen}>
            <Bell size={18} /><i className="db-notification-dot" />
          </button>
          {notificationsOpen && <div className="db-dropdown db-notification-dropdown">
            <div className="db-dropdown-heading"><strong>Notifications</strong><span>Recent</span></div>
            <div className="db-notification-empty"><Bell size={19} /><strong>You're all caught up</strong><p>New orders, messages and account updates will appear here.</p></div>
            <button type="button" className="db-dropdown-footer" onClick={() => goTo('notifications')}>View all notifications <ChevronRight size={14} /></button>
          </div>}
        </div>
        <button type="button" className="db-header-link" onClick={() => goTo('support')}><LifeBuoy size={16} /><span>Support</span></button>
        <div className="db-menu-anchor">
          <button type="button" className="db-header-avatar" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }} aria-label="Open profile menu" aria-expanded={profileOpen}>S</button>
          {profileOpen && <div className="db-dropdown db-profile-dropdown">
            <div className="db-profile-summary"><span>S</span><div><strong>Account</strong><small>Business owner</small></div></div>
            <button type="button" onClick={() => goTo('profile')}><UserRound size={16} /> Profile</button>
            <button type="button" onClick={logout}><LogOut size={16} /> Log out</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
