
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Bell,
  Bot,
  CalendarDays,
  CheckCheck,
  CreditCard,
  MessageSquare,
  Package,
  RefreshCw,
  Settings,
} from 'lucide-react';

import {
  notificationsApi,
} from '../../../services/dashboard/notifications.api.js';

import {
  getCurrentWorkspace,
} from '../../../services/dashboardApi';

import {
  EmptyState,
  PageHeader,
  Panel,
  Tabs,
} from '../../../components/dashboard/common/DashboardUI';

import {
  useDashboardToast,
} from '../../../components/dashboard/common/DashboardToastProvider';

import './NotificationsPage.css';

const categories = [
  'All',
  'Orders',
  'Appointments',
  'AI',
  'Billing',
  'WhatsApp',
  'System',
];

const categoryIcons = {
  Orders: Package,
  Appointments: CalendarDays,
  AI: Bot,
  Billing: CreditCard,
  WhatsApp: MessageSquare,
  System: Settings,
};

function notificationRecords(response) {
  const data = response?.data || response;

  const records = Array.isArray(data)
    ? data
    : data?.items ||
      data?.results ||
      data?.notifications ||
      [];

  return Array.isArray(records)
    ? records
    : [];
}

function notificationDestination(notification) {
  const category = String(
    notification.category ||
      notification.type ||
      ''
  ).toLowerCase();

  if (category.includes('order')) {
    return `/dashboard/orders${
      notification.order_id
        ? `?order=${encodeURIComponent(
            notification.order_id
          )}`
        : ''
    }`;
  }

  if (
    category.includes('appointment') ||
    category.includes('booking')
  ) {
    return `/dashboard/appointments${
      notification.appointment_id
        ? `?appointment=${encodeURIComponent(
            notification.appointment_id
          )}`
        : ''
    }`;
  }

  if (
    category.includes('billing') ||
    category.includes('payment')
  ) {
    return '/dashboard/billing';
  }

  if (
    category.includes('whatsapp') ||
    category.includes('channel')
  ) {
    return '/dashboard/whatsapp';
  }

  if (category.includes('ai')) {
    return '/dashboard/brain';
  }

  return '/dashboard';
}

function relativeTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - date.getTime()) / 1000
    )
  );

  if (seconds < 60) return 'Just now';

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function notificationId(notification) {
  return (
    notification.id ||
    notification.notification_id
  );
}

function unread(notification) {
  return (
    !notification.is_read &&
    !notification.read_at
  );
}

export default function NotificationsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const navigate = useNavigate();

  const toast = useDashboardToast();

  const category = categories.includes(
    searchParams.get('category')
  )
    ? searchParams.get('category')
    : 'All';

  const unreadOnly =
    searchParams.get('unread') === 'true';

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  const [
    appName,
    setAppName,
  ] = useState('Bellbee');

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [
    openingId,
    setOpeningId,
  ] = useState(null);

  const loadNotifications = useCallback(
    async ({ notify = false } = {}) => {
      if (!notificationsApi.isConfigured()) {
        setIsLoading(false);

        setLoadError(
          'Notifications API is not configured.'
        );

        if (notify) {
          toast.warning(
            'Notifications unavailable',
            'Configure the existing notifications API endpoint.'
          );
        }

        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const response =
          await notificationsApi.request({
            query: {
              category:
                category === 'All'
                  ? undefined
                  : category,

              unread_only: unreadOnly,
            },
          });

        setNotifications(
          notificationRecords(response)
        );

        if (notify) {
          toast.success(
            'Notifications refreshed',
            'Latest notifications have been loaded.'
          );
        }
      } catch (error) {
        setLoadError(
          error?.message ||
            'Unable to load notifications.'
        );

        if (notify) {
          toast.error(
            'Could not refresh notifications',
            error?.message ||
              'Please try again.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [category, unreadOnly, toast]
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let active = true;

    getCurrentWorkspace()
      .then((workspace) => {
        if (
          active &&
          workspace?.name
        ) {
          setAppName(workspace.name);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const changeFilter = (key, value) => {
    const params = new URLSearchParams(
      searchParams
    );

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    setSearchParams(params, {
      replace: true,
    });
  };

  const openNotification = async (
    notification
  ) => {
    const id = notificationId(notification);

    if (openingId !== null) return;

    if (
      unread(notification) &&
      id &&
      notificationsApi.isConfigured()
    ) {
      setOpeningId(String(id));

      try {
        await notificationsApi.request({
          method: 'PATCH',
          id,
          action: 'read',
          body: {
            is_read: true,
          },
        });

        setNotifications((current) =>
          current.map((item) =>
            String(notificationId(item)) ===
            String(id)
              ? {
                  ...item,
                  is_read: true,
                  read_at:
                    new Date().toISOString(),
                }
              : item
          )
        );

        window.dispatchEvent(
          new Event(
            'bellbee:notifications-updated'
          )
        );
      } catch (error) {
        toast.error(
          'Could not mark notification as read',
          error?.message ||
            'Please try again.'
        );
      } finally {
        setOpeningId(null);
      }
    }

    navigate(
      notificationDestination(notification)
    );
  };

  const markAllRead = async () => {
    if (markingAll) return;

    if (!notificationsApi.isConfigured()) {
      toast.warning(
        'Notifications unavailable',
        'The notifications API endpoint is not configured.'
      );

      return;
    }

    setMarkingAll(true);

    const pendingId = toast.loading(
      'Marking notifications as read',
      'Updating your notifications…'
    );

    try {
      await notificationsApi.request({
        method: 'POST',
        action: 'read-all',
        body: {},
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,

          read_at:
            item.read_at ||
            new Date().toISOString(),
        }))
      );

      window.dispatchEvent(
        new Event(
          'bellbee:notifications-updated'
        )
      );

      toast.update(
        pendingId,
        'success',
        'All caught up',
        'Your notifications were marked as read.'
      );
    } catch (error) {
      toast.update(
        pendingId,
        'error',
        'Could not update notifications',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount =
    notifications.filter(unread).length;

  return (
    <main className="bb-notifications-premium">
      <PageHeader
        eyebrow="YOUR WORKSPACE ACTIVITY"
        title="Notifications"
        description="Important updates from your customers, orders, bookings and AI assistant."
        actions={
          <div className="bb-notifications-actions">
            <button
              type="button"
              className="dp-secondary-button"
              onClick={() =>
                loadNotifications({
                  notify: true,
                })
              }
              disabled={isLoading}
            >
              <RefreshCw size={15} />

              {isLoading
                ? 'Refreshing…'
                : 'Refresh'}
            </button>

            <button
              type="button"
              className="dp-primary-button"
              onClick={markAllRead}
              disabled={
                markingAll ||
                isLoading ||
                unreadCount === 0
              }
            >
              <CheckCheck size={15} />

              {markingAll
                ? 'Updating…'
                : 'Mark all as read'}
            </button>
          </div>
        }
      />

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error"
          role="alert"
        >
          {loadError}
        </div>
      )}

      <Panel className="dp-notifications-panel">
        <div className="bb-notifications-intro">
          <div>
            <span className="bb-notifications-kicker">
              LATEST UPDATES
            </span>

            <h2>
              Stay close to what matters
            </h2>

            <p>
              Choose a category or view just
              the updates you haven't read.
            </p>
          </div>

          <span className="bb-notifications-counter">
            {unreadCount} unread
          </span>
        </div>

        <div className="dp-notification-tabs-row">
          <Tabs
            items={categories}
            active={category}
            onChange={(value) =>
              changeFilter(
                'category',
                value === 'All'
                  ? ''
                  : value
              )
            }
          />

          <label className="dp-unread-filter">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) =>
                changeFilter(
                  'unread',
                  event.target.checked
                    ? 'true'
                    : ''
                )
              }
            />

            <span>Unread only</span>
          </label>
        </div>

        {isLoading ? (
          <div
            className="dp-api-empty-state"
            role="status"
          >
            Loading notifications…
          </div>
        ) : notifications.length ? (
          <div className="dp-notification-list">
            {notifications.map(
              (notification) => {
                const rawCategory = String(
                  notification.category ||
                    notification.type ||
                    'System'
                );

                const recordCategory =
                  categories.find(
                    (item) =>
                      item.toLowerCase() ===
                      rawCategory.toLowerCase()
                  ) || 'System';

                const Icon =
                  categoryIcons[recordCategory] ||
                  Bell;

                const isUnread =
                  unread(notification);

                const id =
                  notificationId(notification);

                return (
                  <button
                    type="button"
                    className={`dp-notification-row ${
                      isUnread
                        ? 'unread'
                        : ''
                    }`}
                    key={
                      id ||
                      `${notification.title}-${notification.created_at}`
                    }
                    disabled={
                      openingId !== null
                    }
                    onClick={() =>
                      openNotification(
                        notification
                      )
                    }
                  >
                    <span className="dp-notification-category-icon">
                      <Icon size={18} />
                    </span>

                    <span className="dp-notification-copy">
                      <strong>
                        {notification.title ||
                          'Notification'}
                      </strong>

                      <small>
                        {notification.message ||
                          notification.description ||
                          ''}
                      </small>
                    </span>

                    <time>
                      {relativeTime(
                        notification.created_at ||
                          notification.sent_at
                      )}
                    </time>

                    <span
                      className="dp-notification-unread-dot"
                      aria-label={
                        isUnread
                          ? 'Unread'
                          : 'Read'
                      }
                    />
                  </button>
                );
              }
            )}
          </div>
        ) : loadError ? (
          <div className="dp-api-empty-state">
            <Bell size={25} />

            <strong>
              Notifications couldn't be loaded
            </strong>

            <p>
              Use Refresh to try again.
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description={`Nothing here yet. Updates will appear as you use ${appName}.`}
          />
        )}
      </Panel>
    </main>
  );
}
