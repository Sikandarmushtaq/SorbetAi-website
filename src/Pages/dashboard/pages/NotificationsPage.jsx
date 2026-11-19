import { notificationsApi } from '../../../services/dashboard/notifications.api.js';
import './NotificationsPage.css';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell, Bot, CalendarDays, CreditCard, MessageSquare, Package,
  Settings, CheckCheck,
} from 'lucide-react';
import { EmptyState, PageHeader, Panel, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { getCurrentWorkspace } from '../../../services/dashboardApi';
const categories = ['All', 'Orders', 'Appointments', 'AI', 'Billing', 'WhatsApp', 'System'];
const categoryIcons = { Orders: Package, Appointments: CalendarDays, AI: Bot, Billing: CreditCard, WhatsApp: MessageSquare, System: Settings };

function notificationRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.notifications || [];
}

function notificationDestination(notification) {
  const category = String(notification.category || notification.type || '').toLowerCase();
  if (category.includes('order')) return `/dashboard/orders${notification.order_id ? `?order=${encodeURIComponent(notification.order_id)}` : ''}`;
  if (category.includes('appointment') || category.includes('booking')) return `/dashboard/appointments${notification.appointment_id ? `?appointment=${encodeURIComponent(notification.appointment_id)}` : ''}`;
  if (category.includes('billing') || category.includes('payment')) return '/dashboard/billing';
  if (category.includes('whatsapp') || category.includes('channel')) return '/whatsapp';
  if (category.includes('ai')) return '/dashboard/brain';
  return '/dashboard';
}

function relativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Loads notification events, applies URL filters, and marks records as read when opened.
export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = categories.includes(searchParams.get('category')) ? searchParams.get('category') : 'All';
  const unreadOnly = searchParams.get('unread') === 'true';
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [appName, setAppName] = useState('Bellbee');
  const { showNotice, Notice } = useNotice();

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await notificationsApi.request({ query: { category: category === 'All' ? undefined : category, unread_only: unreadOnly } });
      setNotifications(notificationRecords(response));
    } catch (error) {
      setNotifications([]);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [category, unreadOnly]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  useEffect(() => {
    getCurrentWorkspace().then((workspace) => { if (workspace?.name) setAppName(workspace.name); }).catch(() => {});
  }, []);

  const changeFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value) params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const openNotification = async (notification) => {
    const id = notification.id || notification.notification_id;
    if (!notification.is_read && !notification.read_at) {
      try {
        await notificationsApi.request({ method: 'PATCH', id, action: 'read', body: { is_read: true } });
        setNotifications((current) => current.map((item) => String(item.id || item.notification_id) === String(id) ? { ...item, is_read: true, read_at: new Date().toISOString() } : item));
        window.dispatchEvent(new Event('bellbee:notifications-updated'));
      } catch (error) {
        showNotice(error.message);
      }
    }
    navigate(notificationDestination(notification));
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.request({ method: 'POST', action: 'read-all', body: {} });
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })));
      window.dispatchEvent(new Event('bellbee:notifications-updated'));
      showNotice('All notifications marked as read.');
    } catch (error) {
      showNotice(error.message);
    }
  };

  return (
    <>
      <PageHeader title="Notifications" actions={<button type="button" className="dp-secondary-button" onClick={markAllRead} disabled={!notifications.some((item) => !item.is_read && !item.read_at)}><CheckCheck size={14} /> Mark all as read</button>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel className="dp-notifications-panel">
        <div className="dp-notification-tabs-row">
          <Tabs items={categories} active={category} onChange={(value) => changeFilter('category', value === 'All' ? '' : value)} />
          <label className="dp-unread-filter"><input type="checkbox" checked={unreadOnly} onChange={(event) => changeFilter('unread', event.target.checked ? 'true' : '')} /> <span>Unread only</span></label>
        </div>
        {isLoading ? <div className="dp-api-empty-state">Loading notifications…</div> : notifications.length ? (
          <div className="dp-notification-list">
            {notifications.map((notification) => {
              const recordCategory = categories.includes(notification.category) ? notification.category : (notification.category || 'System');
              const Icon = categoryIcons[recordCategory] || Bell;
              const unread = !notification.is_read && !notification.read_at;
              return (
                <button type="button" className={`dp-notification-row ${unread ? 'unread' : ''}`} key={notification.id || notification.notification_id} onClick={() => openNotification(notification)}>
                  <span className="dp-notification-category-icon"><Icon size={17} /></span>
                  <span className="dp-notification-copy"><strong>{notification.title}</strong><small>{notification.message || notification.description || ''}</small></span>
                  <time>{relativeTime(notification.created_at || notification.sent_at)}</time>
                  <span className="dp-notification-unread-dot" aria-label={unread ? 'Unread' : 'Read'} />
                </button>
              );
            })}
          </div>
        ) : loadError ? (
          <div className="dp-api-empty-state"><Bell size={22} /><strong>Notifications are ready to connect</strong><p>Connect the notifications API to show account and activity updates.</p></div>
        ) : (
          <EmptyState icon={Bell} title="No notifications" description={`Nothing here yet. Notifications will appear as you use ${appName}.`} />
        )}
      </Panel>
    </>
  );
}
