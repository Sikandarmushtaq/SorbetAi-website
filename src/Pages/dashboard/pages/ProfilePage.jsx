import { businessProfileApi } from '../../../services/dashboard/business-profile.api.js';
import { deleteAccountApi } from '../../../services/dashboard/delete-account.api.js';
import { devicesApi } from '../../../services/dashboard/devices.api.js';
import { profileNotificationsApi } from '../../../services/dashboard/profile-notifications.api.js';
import './ProfilePage.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell, Building2, LockKeyhole, LogOut, Save, ShieldCheck, Smartphone, Trash2, UserRound,
} from 'lucide-react';
import {
  FieldInput, FieldSelect, FormField, Modal, PageHeader, Panel, useNotice,
} from '../../../components/dashboard/common/DashboardUI';
import { getCurrentUser, getCurrentWorkspace } from '../../../services/dashboardApi';
import { authApi } from '../../../services/auth.api';
const defaultBusiness = {
  businessName: '', businessType: 'hybrid', address1: '', address2: '', city: '', state: '',
  postalCode: '', country: 'Pakistan', timezone: 'Asia/Karachi', billingCurrency: 'PKR', storefrontCurrency: 'PKR',
};

function splitName(user) {
  const first = user?.first_name || user?.given_name || '';
  const last = user?.last_name || user?.family_name || '';
  if (first || last) return { firstName: first, lastName: last };
  const parts = String(user?.full_name || user?.name || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || '', lastName: parts.join(' ') };
}

function browserDetails() {
  const agent = window.navigator.userAgent;
  const browser = /Edg\//.test(agent) ? 'Microsoft Edge' : /Chrome\//.test(agent) ? 'Chrome' : /Firefox\//.test(agent) ? 'Firefox' : /Safari\//.test(agent) && !/Chrome\//.test(agent) ? 'Safari' : 'Browser';
  const os = /Windows/.test(agent) ? 'Windows' : /Mac OS/.test(agent) ? 'macOS' : /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Linux/.test(agent) ? 'Linux' : 'Device';
  return `${browser} on ${os}`;
}

function normaliseBusiness(value, workspace) {
  const source = value?.business || value?.profile || value || {};
  return {
    businessName: source.business_name || source.name || workspace?.name || '',
    businessType: source.business_type || 'hybrid',
    address1: source.address_line_1 || source.address1 || '',
    address2: source.address_line_2 || source.address2 || '',
    city: source.city || '',
    state: source.state || '',
    postalCode: source.postal_code || source.postalCode || '',
    country: source.country || 'Pakistan',
    timezone: source.timezone || 'Asia/Karachi',
    billingCurrency: source.billing_currency || source.currency || 'PKR',
    storefrontCurrency: source.storefront_currency || 'PKR',
  };
}

// Loads account, workspace, business, device and notification settings from their configured sources.
export default function ProfilePage() {
  const [account, setAccount] = useState({ firstName: '', lastName: '', email: '', mobile: '' });
  const [business, setBusiness] = useState(defaultBusiness);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [devices, setDevices] = useState([]);
  const [notifications, setNotifications] = useState({ orders: true, bookings: true, messages: true });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState({ account: false, business: false, password: false, notifications: false, devices: false, deletion: false });
  const [showDelete, setShowDelete] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { showNotice, Notice } = useNotice();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    const results = await Promise.allSettled([
      getCurrentUser(), getCurrentWorkspace(),
      businessProfileApi.isConfigured() ? businessProfileApi.request() : Promise.resolve(null),
      devicesApi.isConfigured() ? devicesApi.request() : Promise.resolve(null),
      profileNotificationsApi.isConfigured() ? profileNotificationsApi.request() : Promise.resolve(null),
    ]);
    const [userResult, workspaceResult, businessResult, devicesResult, notificationsResult] = results;
    const user = userResult.status === 'fulfilled' ? userResult.value : null;
    const workspace = workspaceResult.status === 'fulfilled' ? workspaceResult.value : null;
    if (user) {
      const name = splitName(user);
      setAccount({ ...name, email: user.email || '', mobile: user.mobile_number || user.phone_number || user.phone || '' });
    } else if (userResult.status === 'rejected') setLoadError(userResult.reason.message);
    if (businessResult.status === 'fulfilled' && businessResult.value) {
      setBusiness(normaliseBusiness(businessResult.value, workspace));
    } else setBusiness((current) => ({ ...current, businessName: workspace?.name || current.businessName }));
    if (devicesResult.status === 'fulfilled' && devicesResult.value) {
      const list = Array.isArray(devicesResult.value) ? devicesResult.value : devicesResult.value.items || devicesResult.value.devices || [];
      setDevices(list);
    }
    if (notificationsResult.status === 'fulfilled' && notificationsResult.value) {
      const value = notificationsResult.value.preferences || notificationsResult.value;
      setNotifications({
        orders: value.orders ?? value.order_alerts ?? true,
        bookings: value.bookings ?? value.booking_alerts ?? true,
        messages: value.messages ?? value.message_alerts ?? true,
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const updateAccount = (key, value) => setAccount((current) => ({ ...current, [key]: value }));
  const updateBusiness = (key, value) => setBusiness((current) => ({ ...current, [key]: value }));
  const updatePassword = (key, value) => setPassword((current) => ({ ...current, [key]: value }));

  // Saves editable account fields without allowing email changes from the profile screen.
  const saveAccount = async (event) => {
    event.preventDefault();
    setSaving((current) => ({ ...current, account: true }));
    try {
      const details = Object.fromEntries(Object.entries({
        first_name: account.firstName.trim(),
        last_name: account.lastName.trim(),
        phone: account.mobile.trim(),
      }).filter(([, value]) => value));
      if (!Object.keys(details).length) return showNotice('Enter a name or phone number to update.');
      await authApi.updateProfile(details);
      showNotice('Account details saved.');
    } catch (error) { showNotice(error.message); }
    finally { setSaving((current) => ({ ...current, account: false })); }
  };

  // Saves business identity, address, timezone and both billing and storefront currencies.
  const saveBusiness = async (event) => {
    event.preventDefault();
    setSaving((current) => ({ ...current, business: true }));
    try {
      if (!businessProfileApi.isConfigured()) throw new Error('Business profile API is not configured yet. Add REACT_APP_API_BUSINESS_PROFILE_PATH when the backend endpoint is ready.');
      await businessProfileApi.request({ method: 'PATCH', body: {
        business_name: business.businessName.trim(), business_type: business.businessType,
        address_line_1: business.address1.trim(), address_line_2: business.address2.trim(),
        city: business.city.trim(), state: business.state.trim(), postal_code: business.postalCode.trim(),
        country: business.country, timezone: business.timezone,
        billing_currency: business.billingCurrency, storefront_currency: business.storefrontCurrency,
      } });
      showNotice('Business details saved.');
    } catch (error) { showNotice(error.message); }
    finally { setSaving((current) => ({ ...current, business: false })); }
  };

  // Changes the password through the existing authenticated account endpoint.
  const changePassword = async (event) => {
    event.preventDefault();
    if (password.next.length < 8) return showNotice('Use at least 8 characters for your new password.');
    if (password.next !== password.confirm) return showNotice('New password and confirmation do not match.');
    setSaving((current) => ({ ...current, password: true }));
    try {
      await authApi.changePassword(password.current, password.next);
      setPassword({ current: '', next: '', confirm: '' });
      showNotice('Password changed. Other sessions have been signed out.');
    } catch (error) { showNotice(error.message); }
    finally { setSaving((current) => ({ ...current, password: false })); }
  };

  // Persists order, booking and message notification preferences when the matching API is configured.
  const saveNotifications = async () => {
    setSaving((current) => ({ ...current, notifications: true }));
    try {
      if (!profileNotificationsApi.isConfigured()) throw new Error('Notification preferences API is not configured yet.');
      await profileNotificationsApi.request({ method: 'PATCH', body: notifications });
      showNotice('Notification preferences saved.');
    } catch (error) { showNotice(error.message); }
    finally { setSaving((current) => ({ ...current, notifications: false })); }
  };

  // Revokes all account sessions only after the backend confirms the request.
  const signOutDevices = async () => {
    setSaving((current) => ({ ...current, devices: true }));
    try {
      if (!devicesApi.isConfigured()) throw new Error('Device-session management API is not configured yet.');
      await devicesApi.request({ method: 'DELETE', action: 'revoke-all' });
      setDevices([]);
      showNotice('All other device sessions have been signed out. Sign in again on this device if requested.');
    } catch (error) { showNotice(error.message); }
    finally { setSaving((current) => ({ ...current, devices: false })); }
  };

  // Submits a verified account-deletion request; the backend owns identity checks and final deletion.
  const requestDeletion = async () => {
    setSaving((current) => ({ ...current, deletion: true }));
    try {
      if (!deleteAccountApi.isConfigured()) throw new Error('Account deletion request API is not configured yet.');
      await deleteAccountApi.request({ method: 'POST', body: { confirmation: 'DELETE' } });
      setShowDelete(false);
      showNotice('Your deletion request has been submitted for verification.');
    } catch (error) { showNotice(error.message); }
    finally { setSaving((current) => ({ ...current, deletion: false })); }
  };

  const currentDevice = useMemo(() => browserDetails(), []);
  const sortedDevices = [...devices].sort((a, b) => Number(Boolean(b.is_current || b.current)) - Number(Boolean(a.is_current || a.current)));
  const currentSession = sortedDevices.find((device) => device.is_current || device.current) || {
    id: 'current-device', device_name: currentDevice, browser: currentDevice, status: 'Active now', location: business.country || 'Current location',
  };
  const otherDevices = sortedDevices.filter((device) => device !== currentSession);

  return (
    <>
      <PageHeader eyebrow="ACCOUNT SETTINGS" title="Profile" description="Manage your account and business details." />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      {isLoading && <p className="dp-muted">Loading your profile…</p>}

      <form onSubmit={saveAccount}>
        <Panel className="dp-profile-panel">
          <div className="dp-panel-heading"><div><span className="dp-section-kicker">ACCOUNT</span><h2>Personal details</h2></div><UserRound size={20} /></div>
          <div className="dp-form-grid">
            <FormField label="First Name"><FieldInput value={account.firstName} onChange={(event) => updateAccount('firstName', event.target.value)} autoComplete="given-name" required /></FormField>
            <FormField label="Last Name"><FieldInput value={account.lastName} onChange={(event) => updateAccount('lastName', event.target.value)} autoComplete="family-name" /></FormField>
            <FormField label="Email"><FieldInput type="email" value={account.email} disabled readOnly autoComplete="email" /><small>Email cannot be changed.</small></FormField>
            <FormField label="Your mobile number" hint="Include the country code, for example +923001234567."><FieldInput type="tel" value={account.mobile} onChange={(event) => updateAccount('mobile', event.target.value)} autoComplete="tel" placeholder="Add your mobile number" /></FormField>
          </div>
          <button type="submit" className="dp-primary-button dp-settings-save" disabled={saving.account || isLoading}>{saving.account ? 'Saving…' : 'Save account details'} <Save size={14} /></button>
        </Panel>
      </form>

      <form onSubmit={saveBusiness}>
        <Panel className="dp-profile-panel">
          <div className="dp-panel-heading"><div><span className="dp-section-kicker">BUSINESS</span><h2>Business details</h2></div><Building2 size={20} /></div>
          <div className="dp-form-grid">
            <FormField label="Business Name"><FieldInput value={business.businessName} onChange={(event) => updateBusiness('businessName', event.target.value)} required /></FormField>
            <FormField label="Business Type"><FieldSelect value={business.businessType} onChange={(event) => updateBusiness('businessType', event.target.value)}><option value="product">Product</option><option value="service">Service</option><option value="hybrid">Hybrid (Both)</option></FieldSelect></FormField>
            <FormField label="Address Line 1"><FieldInput value={business.address1} onChange={(event) => updateBusiness('address1', event.target.value)} autoComplete="address-line1" /></FormField>
            <FormField label="Address Line 2"><FieldInput value={business.address2} onChange={(event) => updateBusiness('address2', event.target.value)} autoComplete="address-line2" /></FormField>
            <FormField label="City"><FieldInput value={business.city} onChange={(event) => updateBusiness('city', event.target.value)} autoComplete="address-level2" /></FormField>
            <FormField label="State"><FieldInput value={business.state} onChange={(event) => updateBusiness('state', event.target.value)} autoComplete="address-level1" /></FormField>
            <FormField label="Postal Code"><FieldInput value={business.postalCode} onChange={(event) => updateBusiness('postalCode', event.target.value)} autoComplete="postal-code" /></FormField>
            <FormField label="Country"><FieldSelect value={business.country} onChange={(event) => updateBusiness('country', event.target.value)}><option>Pakistan</option><option>United Kingdom</option><option>United States</option><option>United Arab Emirates</option><option>Other</option></FieldSelect></FormField>
            <FormField label="Timezone"><FieldSelect value={business.timezone} onChange={(event) => updateBusiness('timezone', event.target.value)}><option value="Asia/Karachi">Karachi (UTC+05:00)</option><option value="Europe/London">London</option><option value="Asia/Dubai">Dubai</option><option value="America/New_York">New York</option><option value="UTC">UTC</option></FieldSelect></FormField>
            <FormField label="Billing Currency"><FieldSelect value={business.billingCurrency} onChange={(event) => updateBusiness('billingCurrency', event.target.value)}><option value="PKR">PKR — Pakistani Rupee</option><option value="GBP">GBP — Pound Sterling</option><option value="USD">USD — US Dollar</option><option value="AED">AED — UAE Dirham</option><option value="EUR">EUR — Euro</option></FieldSelect></FormField>
            <FormField label="Storefront Currency" hint="What your AI shows your own customers for prices and orders. It is separate from your billing currency above."><FieldSelect value={business.storefrontCurrency} onChange={(event) => updateBusiness('storefrontCurrency', event.target.value)}><option value="PKR">PKR — Pakistani Rupee</option><option value="GBP">GBP — Pound Sterling</option><option value="USD">USD — US Dollar</option><option value="AED">AED — UAE Dirham</option><option value="EUR">EUR — Euro</option></FieldSelect></FormField>
          </div>
          {!businessProfileApi.isConfigured() && <p className="dp-form-note">Business profile fields are ready. Configure the business profile endpoint to save address, timezone and currency settings.</p>}
          <button type="submit" className="dp-primary-button dp-settings-save" disabled={saving.business || isLoading}>{saving.business ? 'Saving…' : 'Save business details'} <Save size={14} /></button>
        </Panel>
      </form>

      <form onSubmit={changePassword}>
        <Panel className="dp-profile-panel">
          <div className="dp-panel-heading"><div><span className="dp-section-kicker">SECURITY</span><h2>Password</h2></div><LockKeyhole size={20} /></div>
          <p className="dp-panel-description">Use a strong password you do not use anywhere else.</p>
          <div className="dp-form-grid">
            <FormField label="Current password"><FieldInput type="password" value={password.current} onChange={(event) => updatePassword('current', event.target.value)} autoComplete="current-password" required /></FormField>
            <span />
            <FormField label="New password"><FieldInput type="password" value={password.next} onChange={(event) => updatePassword('next', event.target.value)} autoComplete="new-password" minLength={8} required /></FormField>
            <FormField label="Confirm new password"><FieldInput type="password" value={password.confirm} onChange={(event) => updatePassword('confirm', event.target.value)} autoComplete="new-password" minLength={8} required /></FormField>
          </div>
          <button type="submit" className="dp-secondary-button" disabled={saving.password}>{saving.password ? 'Updating…' : 'Update password'}</button>
        </Panel>
      </form>

      <Panel className="dp-profile-panel">
        <div className="dp-panel-heading"><div><span className="dp-section-kicker">SECURITY</span><h2>Your devices</h2></div><Smartphone size={20} /></div>
        <div className="dp-device-row"><Smartphone size={21} /><div><strong>{currentSession?.device_name || currentSession?.browser || currentDevice} <span className="dp-mini-badge">This device</span></strong><small>{currentSession?.location || business.country || 'Current location'} · {currentSession?.status || 'Active now'}</small></div><span className="dp-status-pill success">Active</span></div>
        {otherDevices.map((device, index) => <div className="dp-device-row" key={device.id || index}><Smartphone size={20} /><div><strong>{device.device_name || device.browser || 'Signed-in device'}</strong><small>{device.location || 'Location unavailable'} · {device.last_active || device.status || 'Session active'}</small></div></div>)}
        <p className="dp-panel-description">Signs out every device, this one too. Use it if you think someone else has your password, then change it.</p>
        {!devicesApi.isConfigured() && <p className="dp-form-note">Device session management will be enabled when the sessions API is connected.</p>}
        <button type="button" className="dp-secondary-button" onClick={signOutDevices} disabled={saving.devices || !devicesApi.isConfigured()}>{saving.devices ? 'Signing out…' : 'Sign out all devices'} <LogOut size={14} /></button>
      </Panel>

      <Panel className="dp-profile-panel">
        <div className="dp-panel-heading"><div><span className="dp-section-kicker">PREFERENCES</span><h2>Notifications</h2></div><Bell size={20} /></div>
        <p className="dp-panel-description">Get instant alerts for orders, bookings, and messages.</p>
        <div className="dp-profile-toggle-list">
          {[['orders', 'Order notifications'], ['bookings', 'Booking notifications'], ['messages', 'Message notifications']].map(([key, label]) => <label className="dp-profile-toggle" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(notifications[key])} onChange={(event) => setNotifications((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}
        </div>
        {!profileNotificationsApi.isConfigured() && <p className="dp-form-note">Notification preferences can be saved once the profile notifications endpoint is connected.</p>}
        <button type="button" className="dp-secondary-button dp-settings-save" onClick={saveNotifications} disabled={saving.notifications || !profileNotificationsApi.isConfigured()}>{saving.notifications ? 'Saving…' : 'Save notification preferences'} <Save size={14} /></button>
      </Panel>

      <Panel className="dp-profile-panel dp-danger-zone">
        <div><h2>Delete account</h2><p>Ask us to delete your account and everything in it. We check the request is really from you, then delete the account and email you.</p>{!deleteAccountApi.isConfigured() && <small className="dp-form-note">The verified deletion-request endpoint is not connected yet.</small>}</div>
        <button type="button" className="dp-danger-button" onClick={() => setShowDelete(true)}><Trash2 size={14} /> Request deletion</button>
      </Panel>

      {showDelete && <Modal title="Request account deletion" description="This request will be sent to the Bellbee team for identity verification. Your account will not be removed immediately." onClose={() => setShowDelete(false)} footer={<><button type="button" className="dp-secondary-button" onClick={() => setShowDelete(false)} disabled={saving.deletion}>Cancel</button><button type="button" className="dp-danger-button" onClick={requestDeletion} disabled={saving.deletion || !deleteAccountApi.isConfigured()}>{saving.deletion ? 'Submitting…' : 'Submit deletion request'}</button></>}><div className="dp-delete-confirm"><ShieldCheck size={24} /><p>After verification, Bellbee will delete the account and email you. This action cannot be undone once completed.</p></div></Modal>}
    </>
  );
}
