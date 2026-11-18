import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  LifeBuoy,
  Lightbulb,
  LogOut,
  Package,
  Search,
  ShoppingCart,
  UserRound,
  X,
  MessageSquare,
} from 'lucide-react';
import { allDashboardItems } from './navigation';
import {
  clearStoredSession,
  getCurrentUser,
  hasAccessToken,
  logoutSession,
  resourceRequest,
  isResourceConfigured,
} from '../../../services/dashboardApi';

const searchLinkDefinitions = [
  {
    id: 'customers',
    label: 'Browse Customers',
    icon: UserRound,
    keywords: 'customer contact people client',
  },
  {
    id: 'orders',
    label: 'Browse Orders',
    icon: ShoppingCart,
    keywords: 'order sale purchase cart',
  },
  {
    id: 'products',
    label: 'Browse Products',
    icon: Package,
    keywords: 'product item inventory box',
  },
];

function getUserName(user) {
  return user?.full_name
    || user?.name
    || [user?.first_name, user?.last_name].filter(Boolean).join(' ')
    || '';
}

function getNotificationTitle(notification) {
  const title = [notification?.title, notification?.subject, notification?.heading]
    .find((value) => typeof value === 'string' && value.trim());

  return title || 'Notification';
}

function getNotificationMessage(notification) {
  const message = [
    notification?.message,
    notification?.body,
    notification?.description,
    notification?.content,
  ].find((value) => typeof value === 'string' && value.trim());

  return message || 'You have a new update.';
}

function formatNotificationTime(value) {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function isNotificationRead(notification) {
  return Boolean(notification?.is_read || notification?.read || notification?.read_at);
}

// Handles dashboard search, notification previews, and the account menu.
export default function Header() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const searchAnchorRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const quickLinks = useMemo(() => searchLinkDefinitions
    .map((link) => ({
      ...link,
      route: allDashboardItems.find((item) => item.id === link.id),
    }))
    .filter((link) => link.route), []);

  const filteredQuickLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return quickLinks;

    return quickLinks.filter((link) => {
      const searchableText = `${link.label} ${link.id} ${link.keywords}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [query, quickLinks]);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      if (!hasAccessToken()) return;

      try {
        const currentUser = await getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        if (active) setUser(null);
      }
    };

    const loadNotifications = async () => {
      if (!isResourceConfigured('notifications')) {
        if (active) {
          setNotifications([]);
          setUnreadCount(0);
        }
        return;
      }

      if (active) setNotificationsLoading(true);

      try {
        const response = await resourceRequest('notifications', {
          query: { limit: 5 },
        });
        const rawRecords = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : response?.items
              || response?.results
              || response?.data?.items
              || response?.data?.results
              || [];
        const records = Array.isArray(rawRecords) ? rawRecords : [];
        const unread = response?.unread_count
          ?? response?.data?.unread_count
          ?? records.filter((item) => !isNotificationRead(item)).length;

        if (active) {
          setNotifications(records.slice(0, 5));
          setUnreadCount(Number(unread) || 0);
        }
      } catch {
        if (active) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };

    loadUser();
    loadNotifications();
    window.addEventListener('bellbee:notifications-updated', loadNotifications);

    return () => {
      active = false;
      window.removeEventListener('bellbee:notifications-updated', loadNotifications);
    };
  }, []);

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.removeItem('bellbee-theme');
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
      setHighlightedIndex(-1);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        setProfileOpen(false);
        setNotificationsOpen(false);
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };

    const closeMenus = (event) => {
      if (searchAnchorRef.current && !searchAnchorRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', closeMenus);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', closeMenus);
    };
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setHighlightedIndex(-1);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  const goTo = (id) => {
    navigate(id ? `/dashboard/${id}` : '/dashboard');
    setQuery('');
    setSearchOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSearchSubmit = () => {
    if (!query.trim() || !filteredQuickLinks.length) return;

    const selectedLink = filteredQuickLinks[highlightedIndex] || filteredQuickLinks[0];
    goTo(selectedLink.id);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (
        current >= filteredQuickLinks.length - 1 ? 0 : current + 1
      ));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => (
        current <= 0 ? filteredQuickLinks.length - 1 : current - 1
      ));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleBack = () => {
    const historyIndex = window.history.state?.idx;

    if (Number.isInteger(historyIndex) && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate('/dashboard');
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logoutSession();
    } catch {
      clearStoredSession();
    } finally {
      setLoggingOut(false);
      navigate('/signin', { replace: true });
    }
  };

  const fullName = getUserName(user);
  const email = user?.email || '';
  const initial = (fullName || email || 'U').trim().charAt(0).toUpperCase();
  const isDashboardHome = location.pathname.replace(/\/+$/, '') === '/dashboard';

  return (
    <header className={`db-header ${searchOpen ? 'db-search-open' : ''}`}>
      {searchOpen && (
        <button
          type="button"
          className="db-search-backdrop"
          onClick={closeSearch}
          aria-label="Close search"
          tabIndex={-1}
        />
      )}

      <div className="db-header-left">
        {!isDashboardHome && (
          <button
            type="button"
            className="db-mobile-back-button"
            onClick={handleBack}
            aria-label="Go back to previous page"
            title="Go back"
          >
            <ArrowLeft size={19} />
          </button>
        )}

        <button
          type="button"
          className="db-mobile-brand"
          onClick={() => navigate('/dashboard')}
          aria-label="Bellbee dashboard"
        >
          <MessageSquare size={19} />
          <strong>Bellbee</strong>
        </button>

        <button
          type="button"
          className="db-mobile-search-button"
          onClick={openSearch}
          aria-label="Search dashboard"
          aria-expanded={searchOpen}
        >
          <Search size={18} />
        </button>

        <div
          ref={searchAnchorRef}
          className={`db-search-anchor ${searchOpen ? 'is-open' : ''}`}
        >
          <button
            type="button"
            className="db-search-wrap"
            onClick={openSearch}
            aria-label="Open dashboard search"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
          >
            <Search size={17} />
            <span>Search dashboard sections...</span>
            <kbd>Ctrl K</kbd>
          </button>

          {searchOpen && (
            <section
              className="db-search-overlay"
              role="dialog"
              aria-label="Dashboard search"
            >
                <div className="db-search-overlay-input">
                  <button
                    type="button"
                    className="db-search-submit"
                    onClick={handleSearchSubmit}
                    aria-label="Open matching page"
                    disabled={!query.trim() || filteredQuickLinks.length === 0}
                  >
                    <Search size={18} />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search customers, orders, products, conversations..."
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    aria-label="Search customers, orders, products, conversations"
                    aria-controls="db-search-quick-links"
                  />
                  {query && (
                    <button
                      type="button"
                      className="db-search-clear"
                      onClick={() => {
                        setQuery('');
                        setHighlightedIndex(-1);
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <p className="db-search-section-label">Quick Links</p>

                <div id="db-search-quick-links" className="db-search-quick-links">
                  {filteredQuickLinks.length ? filteredQuickLinks.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`db-search-quick-link ${highlightedIndex === index ? 'is-highlighted' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => goTo(item.id)}
                      >
                        <span className="db-search-quick-link-icon"><Icon size={17} /></span>
                        <span>{item.label}</span>
                        <ChevronRight size={15} className="db-search-quick-link-arrow" />
                      </button>
                    );
                  }) : (
                    <div className="db-search-no-results">
                      <Search size={17} />
                      <p>No results found for '{query.trim()}'</p>
                    </div>
                  )}
                </div>
            </section>
          )}
        </div>
      </div>

      <div className="db-header-actions">
        <button type="button" className="db-header-link" onClick={() => goTo('suggestions')}>
          <Lightbulb size={16} />
          <span>Suggestion Box</span>
        </button>

        <div className="db-notification-anchor" ref={notificationRef}>
          <button
            type="button"
            className={`db-header-icon-button ${notificationsOpen ? 'is-open' : ''}`}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
              setSearchOpen(false);
            }}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notificationsOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="db-notification-count">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="db-notification-dropdown">
              <div className="db-notification-dropdown-heading">
                <strong>Notifications</strong>
                {unreadCount > 0 && <span>{unreadCount} unread</span>}
              </div>

              {notificationsLoading ? (
                <div className="db-notification-empty">
                  <Bell size={20} />
                  <strong>Loading notifications</strong>
                </div>
              ) : notifications.length ? (
                <div className="db-notification-preview-list">
                  {notifications.map((notification, index) => (
                    <button
                      type="button"
                      className={`db-notification-preview ${isNotificationRead(notification) ? '' : 'unread'}`}
                      key={notification.id || notification._id || `${notification.created_at || 'notification'}-${index}`}
                      onClick={() => goTo('notifications')}
                    >
                      <span className="db-notification-preview-dot" />
                      <span className="db-notification-preview-copy">
                        <strong>{getNotificationTitle(notification)}</strong>
                        <small>{getNotificationMessage(notification)}</small>
                        <time>{formatNotificationTime(notification.created_at || notification.createdAt || notification.timestamp)}</time>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="db-notification-empty">
                  <span><Bell size={20} /></span>
                  <strong>No notifications yet</strong>
                  <p>When there's something new, you'll see it here.</p>
                </div>
              )}

              <button
                type="button"
                className="db-notification-dropdown-footer"
                onClick={() => goTo('notifications')}
              >
                Show all notifications
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        <button type="button" className="db-header-link" onClick={() => goTo('support')}>
          <LifeBuoy size={16} />
          <span>Support</span>
        </button>

        <div className="db-menu-anchor" ref={profileRef}>
          <button
            type="button"
            className={`db-header-avatar ${profileOpen ? 'is-open' : ''}`}
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
              setSearchOpen(false);
            }}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <span className="db-avatar-initial">{initial}</span>
            <ChevronDown size={13} className={profileOpen ? 'is-rotated' : ''} />
          </button>

          {profileOpen && (
            <div className="db-dropdown db-profile-dropdown">
              <div className="db-profile-summary">
                <span>{initial}</span>
                <div>
                  <strong>{fullName || 'My account'}</strong>
                  <small>{email || 'Account details'}</small>
                </div>
              </div>
              <div className="db-profile-menu-divider" />
              <button type="button" onClick={() => goTo('profile')}>
                <UserRound size={16} /> Profile
              </button>
              <button
                type="button"
                className="db-signout-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
