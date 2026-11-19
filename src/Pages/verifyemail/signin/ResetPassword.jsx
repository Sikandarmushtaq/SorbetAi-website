import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authApi, authErrorMessage } from '../../../services/auth.api';
import { clearStoredSession } from '../../../services/apiClient';
import './VerifyEmail.css';
import './ProfileSetup.css';

export default function ResetPassword() {
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = query.get('token');

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const fields = new FormData(event.currentTarget);
    const password = fields.get('password');
    if (password !== fields.get('confirmation')) {
      setError('Your passwords do not match.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      clearStoredSession();
      navigate('/signin', { replace: true, state: { notice: 'Password reset. Sign in with your new password.' } });
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="verify-email-page profile-setup">
      <span className="verify-email-blob verify-blob-one" aria-hidden="true" />
      <span className="verify-email-blob verify-blob-two" aria-hidden="true" />
      <section className="verify-email-card">
        <h1>Reset your <em>password.</em></h1>
        {token ? (
          <form className="profile-setup-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="reset-password">New password</label>
              <input id="reset-password" name="password" type="password" autoComplete="new-password"
                minLength={8} maxLength={128} required />
            </div>
            <div>
              <label htmlFor="reset-confirmation">Confirm new password</label>
              <input id="reset-confirmation" name="confirmation" type="password" autoComplete="new-password"
                minLength={8} maxLength={128} required />
            </div>
            {error && <p role="alert">{error}</p>}
            <button className="verify-email-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        ) : (
          <p className="verify-email-description" role="alert">Open the reset link from your email.</p>
        )}
        <div className="verify-email-divider" />
        <Link className="verify-back-link" to="/signin">Back to sign in</Link>
      </section>
    </main>
  );
}
