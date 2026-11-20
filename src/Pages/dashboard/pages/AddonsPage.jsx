import './Addonspage.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleAlert, MessageCircle, Puzzle, Store, Truck, X } from 'lucide-react';
import { billingApi } from '../../../services/dashboard/billing.api.js';
import { useFreePlan } from '../../../components/dashboard/common/FreePlanContext';
import { Modal } from '../../../components/dashboard/common/DashboardUI';

// Visual catalog only. Backend billing determines the actual active state and checkout price.
const ADDONS = [
  { id: 'store_integration', title: 'Store Integration', price: '£5', paid: true,
    description: 'Connect your online store (WooCommerce or a custom integration) so orders and data flow directly into Bellbee.', icon: Store },
  { id: 'courier_integrations', title: 'Courier Integrations', price: '£6', paid: true,
    description: 'Connect your store to supported courier services for automatic shipment booking on new orders.', icon: Truck },
  { id: 'website_chat', title: 'Website Chat Widget', price: 'Free', paid: false,
    description: 'Embed a WhatsApp-powered live chat widget directly on your business website.', icon: MessageCircle, manageRoute: '/dashboard/website-chat' },
  { id: 'facebook_instagram', title: 'Facebook & Instagram', price: 'Free', paid: false,
    description: 'Answer Facebook Messenger and Instagram messages and comments with your AI assistant, in the same inbox as WhatsApp.', icon: Puzzle },
];

const ACTIVE_STATUSES = new Set(['active', 'enabled', 'trialing', 'started']);
const normalizeId = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

// Supports the common response shapes without marking unconfirmed subscriptions active.
function readAddons(value) {
  const data = value?.data || value || {};
  const list = data?.addons || data?.subscriptions?.addons || data?.active_addons || data?.items || [];
  if (Array.isArray(list)) {
    return list.map((item) => typeof item === 'string'
      ? { addon_id: item, status: 'active' }
      : item).filter(Boolean);
  }
  if (list && typeof list === 'object') {
    return Object.entries(list).map(([id, item]) => typeof item === 'boolean'
      ? { addon_id: id, status: item ? 'active' : 'inactive' }
      : { addon_id: id, ...(item || {}) });
  }
  return [];
}

function isAddonActive(entries, addonId) {
  return entries.some((entry) => {
    const id = normalizeId(entry.addon_id || entry.id || entry.code || entry.slug || entry.name);
    const status = String(entry.status || '').toLowerCase();
    return id === addonId && (ACTIVE_STATUSES.has(status) || entry.is_active === true || entry.active === true);
  });
}

function getConfirmedStatus(response) {
  return String(response?.subscription?.status || response?.addon?.status || response?.status || '').toLowerCase();
}

export default function AddonsPage() {
  const navigate = useNavigate();
  const { isStarted, isChecking, isStatusKnown, openFreePlan } = useFreePlan();
  const [subscriptions, setSubscriptions] = useState([]);
  const [statusAvailable, setStatusAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [selected, setSelected] = useState(null);
  const [dialogMode, setDialogMode] = useState('cancel');
  const [toast, setToast] = useState(null);
  const toastCounter = useRef(0);

  const notify = useCallback((message, type = 'error') => {
    setToast({ message, type, key: ++toastCounter.current });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast((current) => current?.key === toast.key ? null : current), 5500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const reloadAddons = useCallback(async () => {
    if (!billingApi.isConfigured()) {
      setStatusAvailable(false);
      setLoading(false);
      return null;
    }
    try {
      const result = await billingApi.request();
      const current = readAddons(result);
      setSubscriptions(current);
      setStatusAvailable(true);
      return current;
    } catch (error) {
      setStatusAvailable(false);
      notify(error.message || 'Could not check add-on status.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { reloadAddons(); }, [reloadAddons]);

  const active = (id) => statusAvailable && isAddonActive(subscriptions, id);
  const ordered = [...ADDONS].sort((first, second) => {
    const a = Number(active(first.id));
    const b = Number(active(second.id));
    if (a !== b) return b - a;
    if (a) return (first.id === 'facebook_instagram' ? -1 : first.id === 'website_chat' ? 0 : 1)
      - (second.id === 'facebook_instagram' ? -1 : second.id === 'website_chat' ? 0 : 1);
    return ADDONS.indexOf(first) - ADDONS.indexOf(second);
  });

  const activate = async (addon) => {
    if (busyId) return;
    if (!billingApi.isConfigured()) {
      notify('Add-ons billing API is not configured yet.');
      return;
    }
    setBusyId(addon.id);
    try {
      // Keep the original billing resource contract. Backend must explicitly activate.
      const result = await billingApi.request({ method: 'POST', action: 'addons', body: {
        addon_id: addon.id, action: 'subscribe', ...(addon.paid ? { payment_method: 'card' } : {}),
      } });
      const checkout = result?.checkout_url || result?.payment_url || result?.authorization_url;
      if (checkout) {
        const destination = new URL(checkout, window.location.href);
        if (destination.protocol !== 'https:' && !(destination.protocol === 'http:' && destination.hostname === 'localhost')) {
          throw new Error('Billing returned an unsafe checkout URL.');
        }
        window.location.assign(destination.href);
        return;
      }
      // A successful HTTP request alone isn't proof that this add-on is active.
      const serverStatus = getConfirmedStatus(result);
      const latest = await reloadAddons();
      const confirmedActive = Boolean(latest && isAddonActive(latest, addon.id)) || ACTIVE_STATUSES.has(serverStatus);
      if (confirmedActive) {
        notify(`${addon.title} activated ${addon.paid ? 'successfully!' : 'free of charge!'}`, 'success');
        if (!latest || !isAddonActive(latest, addon.id)) {
          // Only use a confirmed response status as a temporary UI state.
          setSubscriptions((current) => [...current.filter((item) => normalizeId(item.addon_id || item.id) !== addon.id),
            { addon_id: addon.id, status: serverStatus }]);
          setStatusAvailable(true);
        }
      } else {
        notify('Activation requested. The backend has not confirmed Active status yet.', 'info');
      }
      setSelected(null);
    } catch (error) {
      notify(error.message || 'Could not activate this add-on.');
    } finally {
      setBusyId('');
    }
  };

  const clickAdd = (addon) => {
    if (busyId) return;
    if (!statusAvailable) return notify('Unable to verify your add-ons. Check the billing connection and retry.');
    if (!addon.paid) {
      if (isChecking || !isStatusKnown) return notify('Your free-plan status is not available yet. Please try again.');
      if (!isStarted) {
        openFreePlan(() => activate(addon));
        return;
      }
      activate(addon);
      return;
    }
    if (isStatusKnown && !isStarted) {
      notify('An active subscription is required to purchase addons.');
      return;
    }
    setSelected(addon);
    setDialogMode('subscribe');
  };

  const cancelAddon = async () => {
    if (!selected || busyId) return;
    if (!billingApi.isConfigured()) return notify('Add-ons billing API is not configured yet.');
    setBusyId(selected.id);
    try {
      const result = await billingApi.request({ method: 'POST', action: 'addons', body: {
        addon_id: selected.id, action: 'cancel',
      } });
      const latest = await reloadAddons();
      const serverStatus = getConfirmedStatus(result);
      const inactiveConfirmed = latest && !isAddonActive(latest, selected.id);
      if (inactiveConfirmed || ['cancelled', 'canceled', 'inactive', 'disabled'].includes(serverStatus)) {
        if (!inactiveConfirmed) {
          setSubscriptions((current) => current.filter((entry) => normalizeId(entry.addon_id || entry.id || entry.code) !== selected.id));
        }
        notify(`${selected.title} cancelled successfully.`, 'success');
      } else {
        notify('Cancellation requested. Waiting for the backend to confirm the final status.', 'info');
      }
      setSelected(null);
    } catch (error) {
      notify(error.message || 'Cancellation could not be completed.');
    } finally {
      setBusyId('');
    }
  };

  const dialogClosed = () => { if (!busyId) setSelected(null); };

  return (
    <>
      <div className="dp-addon-page">
        <button type="button" className="dp-addon-back" onClick={() => navigate('/dashboard/billing')}>
          <ArrowLeft size={14} /> Back to Billing
        </button>
        <header className="dp-addon-heading">
          <h1>Available Add-ons</h1>
          <p>Enhance your business automation with specialized tools designed to help you scale.</p>
        </header>

        <div className="dp-addon-grid dp-addon-grid-four">
          {ordered.map((addon) => {
            const Icon = addon.icon;
            const enabled = active(addon.id);
            const working = busyId === addon.id;
            return (
              <article className={`dp-panel dp-addon-card ${enabled ? 'dp-addon-is-active' : ''}`} key={addon.id}>
                <div className="dp-addon-card-top">
                  <span className={`dp-addon-icon ${enabled ? 'dp-addon-icon-active' : ''}`}><Icon size={19} /></span>
                  {enabled && <span className="dp-addon-active-badge">Active</span>}
                </div>
                <h3>{addon.title}</h3>
                <p>{addon.description}</p>
                <strong>{addon.price}</strong>
                <div className="dp-addon-actions">
                  {!enabled ? (
                    <button type="button" className="dp-primary-button dp-addon-add-button"
                      onClick={() => clickAdd(addon)} disabled={working || loading}>
                      {working ? 'Activating…' : 'Add'}
                    </button>
                  ) : (
                    <>
                      {addon.id !== 'facebook_instagram' && (
                        <button type="button" className="dp-secondary-button dp-addon-manage-button"
                          onClick={() => navigate(addon.manageRoute || '/dashboard/billing')} disabled={working}>
                          Manage →
                        </button>
                      )}
                      <button type="button" className="dp-secondary-button dp-addon-cancel-button"
                        onClick={() => { setSelected(addon); setDialogMode('cancel'); }} disabled={working}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <section className="dp-support-cta dp-addon-support">
          <div><h3>Need a custom integration?</h3>
            <p>Our team can build custom workflows for larger businesses. Contact us to discuss your requirements.</p></div>
          <button type="button" className="dp-secondary-button" onClick={() => navigate('/dashboard/support')}>
            Contact Enterprise Support
          </button>
        </section>
      </div>

      {toast && (
        <div role={toast.type === 'error' ? 'alert' : 'status'}
          className={`dp-addon-toast dp-addon-toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={19} /> : <CircleAlert size={19} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={17} /></button>
        </div>
      )}

      {selected && (
        <Modal
          title={dialogMode === 'cancel' ? 'Cancel Add-on' : `Add ${selected.title}`}
          onClose={dialogClosed}
          footer={(
            <>
              <button type="button" className="dp-secondary-button" onClick={dialogClosed} disabled={Boolean(busyId)}>Cancel</button>
              <button type="button" className={dialogMode === 'cancel' ? 'dp-addon-danger-button' : 'dp-primary-button'}
                disabled={Boolean(busyId)} onClick={() => dialogMode === 'cancel' ? cancelAddon() : activate(selected)}>
                {busyId ? 'Processing…' : dialogMode === 'cancel' ? 'Cancel Add-on' : 'Continue'}
              </button>
            </>
          )}
        >
          <div className="dp-addon-confirm-details">
            {dialogMode === 'cancel'
              ? <p>Cancel {selected.title}? Access ends immediately, not at the end of your billing period.</p>
              : <><p><strong>{selected.title}</strong> — {selected.price}{selected.paid ? ' / month' : ''}</p>
                <p>Continue using the billing service. Any payment will be handled securely by the backend checkout.</p></>}
            {!billingApi.isConfigured() && <p role="alert">Billing API is not configured.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
