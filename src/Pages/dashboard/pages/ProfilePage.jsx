
import { businessProfileApi } from '../../../services/dashboard/business-profile.api.js';
import { deleteAccountApi } from '../../../services/dashboard/delete-account.api.js';
import { devicesApi } from '../../../services/dashboard/devices.api.js';
import { profileNotificationsApi } from '../../../services/dashboard/profile-notifications.api.js';

import { getCurrentUser, getCurrentWorkspace } from '../../../services/dashboardApi';
import { authApi } from '../../../services/auth.api';
import { useAuth } from '../../../context/AuthContext';

import {
  PageHeader,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

import { ImagePlus, Laptop } from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import './ProfilePage.css';

const initialBusiness = {
  businessName: '',
  businessType: 'hybrid',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Pakistan',
  timezone: 'Asia/Karachi',
  billingCurrency: 'PKR',
  storefrontCurrency: 'PKR',
};

function splitName(person) {
  const first = person?.first_name || person?.given_name || '';
  const last = person?.last_name || person?.family_name || '';

  if (first || last) {
    return { firstName: first, lastName: last };
  }

  const words = String(
    person?.full_name || person?.name || ''
  ).trim().split(/\s+/).filter(Boolean);

  return {
    firstName: words.shift() || '',
    lastName: words.join(' '),
  };
}

function normaliseBusiness(value, workspace) {
  const source = value?.business || value?.profile || value || {};

  return {
    businessName:
      source.business_name ||
      source.name ||
      workspace?.name ||
      '',
    businessType: source.business_type || 'hybrid',
    address1: source.address_line_1 || source.address1 || '',
    address2: source.address_line_2 || source.address2 || '',
    city: source.city || '',
    state: source.state || '',
    postalCode: source.postal_code || source.postalCode || '',
    country: source.country || 'Pakistan',
    timezone: source.timezone || 'Asia/Karachi',
    billingCurrency:
      source.billing_currency || source.currency || 'PKR',
    storefrontCurrency: source.storefront_currency || 'PKR',
  };
}

// The same key is used in Header.jsx.
function avatarStorageKey(person) {
  const owner =
    person?.id ??
    person?.user_id ??
    person?.email;

  return owner
    ? `bellbee:profile-avatar:${String(owner).trim().toLowerCase()}`
    : '';
}

function currentBrowserName() {
  const agent = window.navigator.userAgent;

  const browser = /Edg\//.test(agent)
    ? 'Microsoft Edge'
    : /Chrome\//.test(agent)
      ? 'Chrome'
      : /Firefox\//.test(agent)
        ? 'Firefox'
        : /Safari\//.test(agent)
          ? 'Safari'
          : 'Browser';

  const os = /Windows/.test(agent)
    ? 'Windows'
    : /Mac OS/.test(agent)
      ? 'macOS'
      : /Android/.test(agent)
        ? 'Android'
        : /iPhone|iPad/.test(agent)
          ? 'iOS'
          : /Linux/.test(agent)
            ? 'Linux'
            : 'Device';

  return `${browser} on ${os}`;
}

// Resize uploaded image for safe, compact browser storage.
function prepareAvatar(file) {
  return new Promise((resolve, reject) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowed.includes(file.type)) {
      reject(
        new Error('Please choose a JPG, PNG or WEBP image.')
      );
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      reject(
        new Error('Profile picture must be smaller than 3 MB.')
      );
      return;
    }

    const url = URL.createObjectURL(file);
    const picture = new Image();

    picture.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 240;

        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Image processing is not supported.');
        }

        const side = Math.min(
          picture.naturalWidth,
          picture.naturalHeight
        );

        const x = (picture.naturalWidth - side) / 2;
        const y = (picture.naturalHeight - side) / 2;

        context.drawImage(
          picture,
          x,
          y,
          side,
          side,
          0,
          0,
          size,
          size
        );

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    picture.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error('Could not read this image. Try another photo.')
      );
    };

    picture.src = url;
  });
}

function Field({ label, hint, children, full = false }) {
  return (
    <label className={`dp-profile-field ${full ? 'full' : ''}`}>
      <span className="dp-profile-field-label">
        {label}
      </span>

      {children}

      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showNotice, Notice } = useNotice();

  const photoInputRef = useRef(null);

  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  });

  const [business, setBusiness] = useState(initialBusiness);
  const [avatar, setAvatar] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [saving, setSaving] = useState({
    profile: false,
    password: false,
    devices: false,
    notifications: false,
    deletion: false,
  });

  const [passwordOpen, setPasswordOpen] = useState(false);

  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const [devices, setDevices] = useState([]);

  const [notifications, setNotifications] = useState({
    orders: false,
    bookings: false,
    messages: false,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Load existing backend data.
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const results = await Promise.allSettled([
        getCurrentUser(),
        getCurrentWorkspace(),

        businessProfileApi.isConfigured()
          ? businessProfileApi.request()
          : Promise.resolve(null),

        devicesApi.isConfigured()
          ? devicesApi.request()
          : Promise.resolve(null),

        profileNotificationsApi.isConfigured()
          ? profileNotificationsApi.request()
          : Promise.resolve(null),
      ]);

      const [u, w, b, d, n] = results;

      const person =
        u.status === 'fulfilled' ? u.value : user;

      const workspace =
        w.status === 'fulfilled' ? w.value : null;

      if (person) {
        const names = splitName(person);

        setAccount({
          ...names,
          email: person.email || '',
          mobile:
            person.mobile_number ||
            person.phone_number ||
            person.phone ||
            '',
        });
      } else if (u.status === 'rejected') {
        setLoadError(
          u.reason?.message || 'Could not load account details.'
        );
      }

      if (b.status === 'fulfilled' && b.value) {
        setBusiness(normaliseBusiness(b.value, workspace));
      } else {
        setBusiness((old) => ({
          ...old,
          businessName:
            workspace?.name || old.businessName,
        }));
      }

      if (d.status === 'fulfilled' && d.value) {
        const value = d.value;

        const rows = Array.isArray(value)
          ? value
          : value?.devices || value?.items || [];

        setDevices(Array.isArray(rows) ? rows : []);
      }

      if (n.status === 'fulfilled' && n.value) {
        const value = n.value?.preferences || n.value;

        setNotifications({
          orders: Boolean(
            value.orders ??
            value.order_alerts ??
            value.enabled ??
            false
          ),
          bookings: Boolean(
            value.bookings ??
            value.booking_alerts ??
            value.enabled ??
            false
          ),
          messages: Boolean(
            value.messages ??
            value.message_alerts ??
            value.enabled ??
            false
          ),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load avatar from browser storage or the account's existing URL.
  useEffect(() => {
    const key = avatarStorageKey(user);
    let saved = '';

    if (key) {
      try {
        saved = localStorage.getItem(key) || '';
      } catch {
        saved = '';
      }
    }

    setAvatar(
      saved ||
      user?.avatar_url ||
      user?.picture ||
      ''
    );
  }, [user]);

  const updateAccount = (key, value) => {
    setAccount((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const updateBusiness = (key, value) => {
    setBusiness((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const updatePassword = (key, value) => {
    setPassword((old) => ({
      ...old,
      [key]: value,
    }));
  };

  // New: Upload profile picture and update Header instantly.
  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const key = avatarStorageKey(user);

    if (!key) {
      showNotice('Your signed-in account could not be identified.');
      event.target.value = '';
      return;
    }

    try {
      const image = await prepareAvatar(file);

      localStorage.setItem(key, image);
      setAvatar(image);

      window.dispatchEvent(
        new CustomEvent('bellbee:profile-avatar-changed', {
          detail: { key },
        })
      );

      showNotice('Profile picture updated on this browser.');
    } catch (error) {
      showNotice(
        error.message || 'Photo could not be saved.'
      );
    } finally {
      event.target.value = '';
    }
  };

  const removePhoto = () => {
    const key = avatarStorageKey(user);
    if (!key) return;

    try {
      localStorage.removeItem(key);

      setAvatar(
        user?.avatar_url ||
        user?.picture ||
        ''
      );

      window.dispatchEvent(
        new CustomEvent('bellbee:profile-avatar-changed', {
          detail: { key },
        })
      );

      showNotice('Local profile picture removed.');
    } catch (error) {
      showNotice(
        error.message || 'Could not remove the photo.'
      );
    }
  };

  // Keep the existing account and business backend APIs.
  const saveProfile = async (event) => {
    event.preventDefault();

    setSaving((old) => ({
      ...old,
      profile: true,
    }));

    let accountSaved = false;

    try {
      await authApi.updateProfile({
        first_name: account.firstName.trim(),
        last_name: account.lastName.trim(),
        phone: account.mobile.trim(),
      });

      accountSaved = true;

      if (businessProfileApi.isConfigured()) {
        await businessProfileApi.request({
          method: 'PATCH',

          body: {
            business_name: business.businessName.trim(),
            business_type: business.businessType,
            address_line_1: business.address1.trim(),
            address_line_2: business.address2.trim(),
            city: business.city.trim(),
            state: business.state.trim(),
            postal_code: business.postalCode.trim(),
            country: business.country,
            timezone: business.timezone,
            billing_currency: business.billingCurrency,
            storefront_currency: business.storefrontCurrency,
          },
        });

        showNotice('Account and business changes saved.');
      } else {
        showNotice(
          'Account saved. Business details need the business-profile API to be configured.'
        );
      }

      if (typeof refreshUser === 'function') {
        await refreshUser();
      }
    } catch (error) {
      showNotice(
        `${
          accountSaved
            ? 'Account saved, but business details failed: '
            : ''
        }${error.message || 'Unable to save changes.'}`
      );
    } finally {
      setSaving((old) => ({
        ...old,
        profile: false,
      }));
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (password.next.length < 8) {
      return showNotice(
        'Use at least 8 characters for your new password.'
      );
    }

    if (password.next !== password.confirm) {
      return showNotice('The new passwords do not match.');
    }

    setSaving((old) => ({
      ...old,
      password: true,
    }));

    try {
      await authApi.changePassword(
        password.current,
        password.next
      );

      setPassword({
        current: '',
        next: '',
        confirm: '',
      });

      setPasswordOpen(false);
      showNotice('Your password has been changed.');
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving((old) => ({
        ...old,
        password: false,
      }));
    }
  };

  const signOutDevices = async () => {
    if (!devicesApi.isConfigured()) {
      return showNotice(
        'Device-session management API is not configured yet.'
      );
    }

    setSaving((old) => ({
      ...old,
      devices: true,
    }));

    try {
      await devicesApi.request({
        method: 'DELETE',
        action: 'revoke-all',
      });

      setDevices([]);

      showNotice(
        'Sign-out request completed. You may need to sign in again.'
      );
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving((old) => ({
        ...old,
        devices: false,
      }));
    }
  };

  const notificationsEnabled =
    notifications.orders &&
    notifications.bookings &&
    notifications.messages;

  const toggleNotifications = async () => {
    if (!profileNotificationsApi.isConfigured()) {
      return showNotice(
        'Notification preferences API is not configured yet.'
      );
    }

    const enabled = !notificationsEnabled;

    const next = {
      orders: enabled,
      bookings: enabled,
      messages: enabled,
    };

    setSaving((old) => ({
      ...old,
      notifications: true,
    }));

    try {
      await profileNotificationsApi.request({
        method: 'PATCH',
        body: next,
      });

      setNotifications(next);

      showNotice(
        enabled
          ? 'Notifications enabled.'
          : 'Notifications disabled.'
      );
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving((old) => ({
        ...old,
        notifications: false,
      }));
    }
  };

  const requestDeletion = async (event) => {
    event.preventDefault();

    if (
      deleteEmail.trim().toLowerCase() !==
      account.email.trim().toLowerCase()
    ) {
      showNotice(
        'Enter your account email to confirm this request.'
      );
      return;
    }

    if (!deleteAccountApi.isConfigured()) {
      showNotice('Account deletion API is not configured yet.');
      return;
    }

    setSaving((old) => ({
      ...old,
      deletion: true,
    }));

    try {
      await deleteAccountApi.request({
        method: 'POST',

        body: {
          confirmation: 'DELETE',
          email: deleteEmail.trim(),
          reason: deleteReason.trim(),
        },
      });

      setDeleteOpen(false);
      setDeleteEmail('');
      setDeleteReason('');

      showNotice(
        'Deletion request submitted for identity verification.'
      );
    } catch (error) {
      showNotice(error.message, 'error');
    } finally {
      setSaving((old) => ({
        ...old,
        deletion: false,
      }));
    }
  };

  const currentDevice = useMemo(
    () => currentBrowserName(),
    []
  );

  const sortedDevices = [...devices].sort(
    (a, b) =>
      Number(Boolean(b.is_current || b.current)) -
      Number(Boolean(a.is_current || a.current))
  );

  const currentSession =
    sortedDevices.find(
      (device) => device.is_current || device.current
    ) || {
      device_name: currentDevice,
      location: '',
      status: 'Active now',
    };

  const otherDevices = sortedDevices.filter(
    (device) => device !== currentSession
  );

  const initials = (
    account.firstName ||
    user?.first_name ||
    user?.name ||
    'U'
  ).charAt(0).toUpperCase();

  return (
    <div className="dp-profile-page">
      <PageHeader
        title="Profile"
        description="Manage your account and business details."
      />

      {Notice}

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error"
          role="status"
        >
          {loadError}
        </div>
      )}

      {isLoading && (
        <p className="dp-profile-loading">
          Loading your profile…
        </p>
      )}

      <div className="dp-profile-column">
        {/* ACCOUNT + BUSINESS */}
        <form
          className="dp-profile-card"
          onSubmit={saveProfile}
        >
          <h2 className="dp-profile-section-title">
            Account
          </h2>

          <div className="dp-profile-fields">
            <Field label="First Name">
              <input
                value={account.firstName}
                onChange={(event) =>
                  updateAccount('firstName', event.target.value)
                }
                autoComplete="given-name"
                required
              />
            </Field>

            <Field label="Last Name">
              <input
                value={account.lastName}
                onChange={(event) =>
                  updateAccount('lastName', event.target.value)
                }
                autoComplete="family-name"
              />
            </Field>

            <Field
              full
              label="Email"
              hint="Email cannot be changed."
            >
              <input
                type="email"
                value={account.email}
                readOnly
                disabled
                autoComplete="email"
              />
            </Field>

            <Field
              full
              label="Your mobile number"
              hint="Your own number, so Bellbee can reach you. It is not shown to your customers."
            >
              <input
                type="tel"
                value={account.mobile}
                onChange={(event) =>
                  updateAccount('mobile', event.target.value)
                }
                autoComplete="tel"
                placeholder="+923001234567"
              />
            </Field>

            {/* NEW PROFILE PICTURE FIELD */}
            <div className="dp-profile-photo-field">
              <span className="dp-profile-field-label">
                Profile picture
              </span>

              <div className="dp-profile-photo-row">
                <span className="dp-profile-photo-preview">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Your profile"
                      onError={() => setAvatar('')}
                    />
                  ) : (
                    initials
                  )}
                </span>

                <div className="dp-profile-photo-actions">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadPhoto}
                    className="dp-profile-hidden-input"
                    aria-label="Choose profile picture"
                  />

                  <div className="dp-profile-photo-buttons">
                    <button
                      type="button"
                      className="dp-secondary-button"
                      onClick={() =>
                        photoInputRef.current?.click()
                      }
                    >
                      <ImagePlus size={15} />
                      {avatar
                        ? 'Change photo'
                        : 'Add profile picture'}
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        className="dp-profile-text-action"
                        onClick={removePhoto}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <small>
                    JPG, PNG or WEBP · Max 3 MB.
                    Saved on this browser.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <h2 className="dp-profile-section-title dp-profile-business-title">
            Business
          </h2>

          <div className="dp-profile-fields">
            <Field full label="Business Name">
              <input
                value={business.businessName}
                onChange={(event) =>
                  updateBusiness(
                    'businessName',
                    event.target.value
                  )
                }
                required
              />
            </Field>

            <Field full label="Business Type">
              <select
                value={business.businessType}
                onChange={(event) =>
                  updateBusiness(
                    'businessType',
                    event.target.value
                  )
                }
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="hybrid">Hybrid (Both)</option>
              </select>
            </Field>

            <Field full label="Address Line 1">
              <input
                value={business.address1}
                onChange={(event) =>
                  updateBusiness('address1', event.target.value)
                }
                autoComplete="address-line1"
              />
            </Field>

            <Field full label="Address Line 2">
              <input
                value={business.address2}
                onChange={(event) =>
                  updateBusiness('address2', event.target.value)
                }
                autoComplete="address-line2"
              />
            </Field>

            <Field label="City">
              <input
                value={business.city}
                onChange={(event) =>
                  updateBusiness('city', event.target.value)
                }
                autoComplete="address-level2"
              />
            </Field>

            <Field label="State">
              <input
                value={business.state}
                onChange={(event) =>
                  updateBusiness('state', event.target.value)
                }
                autoComplete="address-level1"
              />
            </Field>

            <Field label="Postal Code">
              <input
                value={business.postalCode}
                onChange={(event) =>
                  updateBusiness(
                    'postalCode',
                    event.target.value
                  )
                }
                autoComplete="postal-code"
              />
            </Field>

            <Field label="Country">
              <select
                value={business.country}
                onChange={(event) =>
                  updateBusiness('country', event.target.value)
                }
              >
                {![
                  'Pakistan',
                  'United Kingdom',
                  'United States',
                  'United Arab Emirates',
                  'Other',
                ].includes(business.country) && (
                  <option value={business.country}>
                    {business.country}
                  </option>
                )}

                <option>Pakistan</option>
                <option>United Kingdom</option>
                <option>United States</option>
                <option>United Arab Emirates</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Timezone">
              <select
                value={business.timezone}
                onChange={(event) =>
                  updateBusiness('timezone', event.target.value)
                }
              >
                {![
                  'Asia/Karachi',
                  'Europe/London',
                  'Asia/Dubai',
                  'America/New_York',
                  'UTC',
                ].includes(business.timezone) && (
                  <option value={business.timezone}>
                    {business.timezone}
                  </option>
                )}

                <option value="Asia/Karachi">Karachi</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Dubai">Dubai</option>
                <option value="America/New_York">New York</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>

            <Field label="Billing Currency">
              <input
                value={business.billingCurrency}
                disabled
                readOnly
              />
            </Field>

            <Field
              full
              label="Storefront Currency"
              hint="What your AI shows your own customers for prices and orders. It's separate from your billing currency above."
            >
              <select
                value={business.storefrontCurrency}
                onChange={(event) =>
                  updateBusiness(
                    'storefrontCurrency',
                    event.target.value
                  )
                }
              >
                {[
                  'PKR',
                  'GBP',
                  'USD',
                  'AED',
                  'EUR',
                ].map((currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="submit"
            className="dp-primary-button dp-profile-save-button"
            disabled={saving.profile || isLoading}
          >
            {saving.profile ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* PASSWORD */}
        <section className="dp-profile-card dp-profile-compact-card">
          <div className="dp-profile-heading-row">
            <h2>Password</h2>

            <button
              type="button"
              className="dp-profile-text-action"
              onClick={() =>
                setPasswordOpen((value) => !value)
              }
            >
              {passwordOpen ? 'Cancel' : 'Change password'}
            </button>
          </div>

          <p className="dp-profile-muted">
            Use a strong password you don't use anywhere else.
          </p>

          {passwordOpen && (
            <form
              className="dp-profile-password-form"
              onSubmit={changePassword}
            >
              <Field full label="Current password">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password.current}
                  onChange={(event) =>
                    updatePassword(
                      'current',
                      event.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field full label="New password">
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password.next}
                  onChange={(event) =>
                    updatePassword(
                      'next',
                      event.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field full label="Confirm new password">
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password.confirm}
                  onChange={(event) =>
                    updatePassword(
                      'confirm',
                      event.target.value
                    )
                  }
                  required
                />
              </Field>

              <button
                type="submit"
                className="dp-primary-button"
                disabled={saving.password}
              >
                {saving.password
                  ? 'Saving…'
                  : 'Update password'}
              </button>
            </form>
          )}
        </section>

        {/* DEVICES */}
        <section className="dp-profile-card dp-profile-compact-card">
          <div className="dp-profile-heading-row">
            <h2>Your devices</h2>
          </div>

          <div className="dp-profile-device-row">
            <Laptop size={18} />

            <div>
              <strong>
                {currentSession.device_name ||
                  currentSession.browser ||
                  currentDevice}
              </strong>

              <span className="dp-profile-current-device">
                This device
              </span>

              <small>
                {[
                  currentSession.location || business.country,
                  currentSession.status || 'Active now',
                ].filter(Boolean).join(' · ')}
              </small>
            </div>
          </div>

          {otherDevices.map((device, index) => (
            <div
              className="dp-profile-device-row"
              key={device.id || index}
            >
              <Laptop size={18} />

              <div>
                <strong>
                  {device.device_name ||
                    device.browser ||
                    'Signed-in device'}
                </strong>

                <small>
                  {[
                    device.location,
                    device.last_active || device.status,
                  ].filter(Boolean).join(' · ')}
                </small>
              </div>
            </div>
          ))}

          <div className="dp-profile-device-footer">
            <button
              type="button"
              className="dp-profile-text-action"
              disabled={saving.devices}
              onClick={signOutDevices}
            >
              {saving.devices
                ? 'Signing out…'
                : 'Sign out everywhere'}
            </button>

            <p className="dp-profile-muted">
              Signs out every device, this one too.
              Use it if you think someone else has your
              password, then change it.
            </p>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="dp-profile-card dp-profile-compact-card">
          <div className="dp-profile-heading-row">
            <h2>Notifications</h2>
          </div>

          <div className="dp-profile-notifications-row">
            <span className="dp-profile-muted">
              Get instant alerts for orders, bookings,
              and messages.
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(notificationsEnabled)}
              aria-label="Enable notifications"
              disabled={saving.notifications}
              className={`dp-profile-switch ${
                notificationsEnabled ? 'on' : ''
              }`}
              onClick={toggleNotifications}
            >
              <span />
            </button>
          </div>
        </section>

        {/* DELETE ACCOUNT */}
        <section className="dp-profile-card dp-profile-compact-card">
          <div className="dp-profile-heading-row">
            <h2>Delete account</h2>

            {!deleteOpen && (
              <button
                type="button"
                className="dp-profile-text-action dp-profile-delete-link"
                onClick={() => setDeleteOpen(true)}
              >
                Request account deletion
              </button>
            )}
          </div>

          <p className="dp-profile-muted">
            Ask us to delete your account and everything
            in it. We check the request is really from
            you, then delete the account and email you.
          </p>

          {deleteOpen && (
            <form
              onSubmit={requestDeletion}
              className="dp-profile-delete-form"
            >
              <div className="dp-profile-delete-columns">
                <div>
                  <strong>We delete</strong>

                  <ul>
                    <li>
                      Your account and the way you sign in
                    </li>
                    <li>
                      Your business details, AI knowledge,
                      services and products
                    </li>
                    <li>
                      Your customers, their chats and
                      the files they sent
                    </li>
                    <li>
                      Orders, appointments, campaigns and leads
                    </li>
                    <li>
                      Your WhatsApp, Facebook, Instagram
                      and website chat connections
                    </li>
                  </ul>
                </div>

                <div>
                  <strong>We keep</strong>

                  <ul>
                    <li>
                      Payment and invoice records, kept for
                      6 years for tax and accounting
                    </li>
                    <li>
                      Security and technical logs, kept
                      for security, fraud prevention
                      and legal compliance
                    </li>
                  </ul>
                </div>
              </div>

              <Field full label="Your account email">
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(event) =>
                    setDeleteEmail(event.target.value)
                  }
                  required
                />
              </Field>

              <Field
                full
                label="Anything we should know? (optional)"
              >
                <textarea
                  rows={3}
                  value={deleteReason}
                  onChange={(event) =>
                    setDeleteReason(event.target.value)
                  }
                  maxLength={1500}
                />
              </Field>

              <div className="dp-profile-delete-actions">
                <button
                  type="submit"
                  className="dp-danger-button"
                  disabled={saving.deletion}
                >
                  {saving.deletion
                    ? 'Sending…'
                    : 'Send deletion request'}
                </button>

                <button
                  type="button"
                  className="dp-profile-text-action"
                  disabled={saving.deletion}
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteEmail('');
                    setDeleteReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}