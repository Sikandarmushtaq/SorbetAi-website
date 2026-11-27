import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';
import { authApi, authErrorMessage, dashboardDestination } from '../../../services/auth.api';
import { countries, CountrySelect, normalizePhone } from './CountrySelect';
import './SignUp.css';
import './VerifyEmail.css';
import './ProfileSetup.css';

export default function Onboarding() {
  const { user, needsOnboarding, refreshUser, saveSession, signOut } = useAuth();
  const { state } = useLocation();
  const [country, setCountry] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialCode = countries.find((item) => item.code === country)?.dialCode || '';

  if (!needsOnboarding) return <Navigate to={dashboardDestination(state)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setFieldErrors({});
    setMessage('');
    const fields = new FormData(event.currentTarget);
    const rawPhone = fields.get('phone').trim();
    const workspaceName = fields.get('workspace_name').trim();
    const promoCode = fields.get('promo_code').trim();
    const international = rawPhone.replace(/^00/, '+');
    const phone = international.startsWith('+')
      ? `+${international.replace(/\D/g, '')}`
      : `${dialCode}${normalizePhone(rawPhone, dialCode)}`;

    const errors = {};
    if (!country) errors.country = 'Select your country.';
    if (country && (!/^[+\d().\s-]+$/.test(rawPhone) || !/^\+[1-9]\d{6,14}$/.test(phone))) {
      errors.phone = 'Enter a valid phone number.';
    }
    if (!workspaceName) errors.workspace_name = 'Enter your business name.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authApi.completeOnboarding({
        country,
        phone,
        workspace_name: workspaceName,
        ...(promoCode ? { promo_code: promoCode } : {}),
      });
      await saveSession(result.tokens, { userId: user.id, isOnboarded: true });
    } catch (error) {
      if (error.code === 'MEMBER_409') {
        const currentUser = await refreshUser();
        if (!currentUser || currentUser.is_onboarded === false || (!currentUser.phone && !currentUser.workspaces?.length)) {
          setMessage(authErrorMessage(error));
        }
      } else if (Array.isArray(error.errors) && error.errors.length) {
        const fields = ['country', 'phone', 'workspace_name', 'promo_code'];
        setFieldErrors(Object.fromEntries(error.errors.filter(({ field }) => fields.includes(field))
          .map(({ field, message }) => [field, message])));
        setMessage(error.errors.filter(({ field }) => !fields.includes(field))
          .map(({ message }) => message).join(' '));
      } else {
        setMessage(authErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const profileName = user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ');
  const initials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join('');
  const picture = user.avatar_url || user.picture;

  return (
    <main className="verify-email-page profile-setup">
      <span className="verify-email-blob verify-blob-one" aria-hidden="true" />
      <span className="verify-email-blob verify-blob-two" aria-hidden="true" />
      <section className="verify-email-card" aria-labelledby="profile-setup-title">
        <h1 id="profile-setup-title">Complete your <em>profile.</em></h1>
        <p className="verify-email-description">Add your contact and business details to open your dashboard.</p>
        <div className="verify-email-address">
          <span className="profile-setup-avatar" aria-hidden="true">
            {initials || 'B'}
            {picture && <img src={picture} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />}
          </span>
          <div className="verify-address-copy">
            {profileName && <strong>{profileName}</strong>}
            <span>{user.email}</span>
          </div>
        </div>
        <form className="profile-setup-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signup-country">Country</label>
            <CountrySelect value={country} onChange={setCountry} hasError={Boolean(fieldErrors.country)} />
            {fieldErrors.country && <small role="alert">{fieldErrors.country}</small>}
          </div>
          <div>
            <label htmlFor="onboarding-phone">Phone number</label>
            <div className="profile-setup-phone">
              {dialCode && <span aria-hidden="true">{dialCode}</span>}
              <input id="onboarding-phone" name="phone" type="tel" autoComplete="tel"
                placeholder={country === 'PK' ? '0300 1234567' : 'Enter your phone number'}
                aria-invalid={Boolean(fieldErrors.phone)} required />
            </div>
            {fieldErrors.phone && <small role="alert">{fieldErrors.phone}</small>}
          </div>
          <div>
            <label htmlFor="onboarding-business">Business name</label>
            <input id="onboarding-business" name="workspace_name" autoComplete="organization"
              maxLength={120} aria-invalid={Boolean(fieldErrors.workspace_name)} required />
            {fieldErrors.workspace_name && <small role="alert">{fieldErrors.workspace_name}</small>}
          </div>
          <div>
            <label htmlFor="onboarding-promo">Promo code <span>(optional)</span></label>
            <input id="onboarding-promo" name="promo_code" maxLength={40} aria-invalid={Boolean(fieldErrors.promo_code)} />
            {fieldErrors.promo_code && <small role="alert">{fieldErrors.promo_code}</small>}
          </div>
          {message && <p role="alert">{message}</p>}
          <button type="submit" className="verify-email-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Continue to dashboard'} <ArrowRight size={17} />
          </button>
        </form>
        <button type="button" className="profile-setup-signout" disabled={isSubmitting}
          onClick={() => signOut().catch((error) => setMessage(authErrorMessage(error)))}>
          Sign out
        </button>
      </section>
    </main>
  );
}