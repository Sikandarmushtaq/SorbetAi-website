import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Eye, EyeOff, Pencil } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import GoogleButton from '../../../components/auth/GoogleButton';
import { useAuth } from '../../../context/AuthContext';
import { authApi, authErrorMessage, dashboardDestination } from '../../../services/auth.api';
import './SignIn.css';

gsap.registerPlugin(useGSAP);

export default function SignIn() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useAuth();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useGSAP(() => {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timeline
      .from('.signin-circle-yellow', { scale: 0.72, opacity: 0, duration: 0.9 })
      .from('.signin-card', { y: 32, opacity: 0, scale: 0.97, duration: 0.7 }, '-=0.5')
      .from('.signin-card > *', { y: 18, opacity: 0, duration: 0.5, stagger: 0.07 }, '-=0.4')
      .from('.signin-api-badge, .signin-page-footer', { y: 12, opacity: 0, duration: 0.5 }, '-=0.3');
  }, { scope: pageRef });

  function changeStep(nextStep) {
    setNotice('');
    setPassword('');
    setShowPassword(false);
    setStep(nextStep);
  }

  async function handleSignIn(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotice('');
    const address = email.trim().toLowerCase();
    try {
      const result = await authApi.signIn(address, password);
      const confirmedUser = await saveSession(result.tokens ?? result);
      // Never redirect using a local isAdmin flag. Verify role with /auth/me.
      if (!confirmedUser) throw new Error('Unable to verify your session. Please try again.');
      navigate(dashboardDestination(location.state, confirmedUser, result.goto), { replace: true });
    } catch (error) {
      if (error.code === 'AUTH_403_EMAIL_NOT_VERIFIED') {
        window.localStorage.setItem('bellbee_pending_verification_email', address);
        navigate('/verify-email', {
          replace: true,
          state: { ...location.state, email: address },
        });
        return;
      }
      setNotice(authErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotice('');
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setNotice('If that email has an account, a reset link has been sent. Check your inbox.');
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main ref={pageRef} className="signin-page">
      <span className="signin-circle signin-circle-yellow" aria-hidden="true" />
      <span className="signin-circle signin-circle-lavender" aria-hidden="true" />
      <div className="signin-stage">
        <section className="signin-card">
          <div className="signin-welcome">
            <span className="signin-welcome-line" />
            <span>WELCOME BACK</span>
          </div>

          {step === 'email' ? (
            <>
              <h1>Welcome <em>back.</em></h1>
              <p className="signin-description">Manage your business automation with ease.</p>
              <GoogleButton />
              <div className="signin-divider"><span /><p>Or continue with email</p><span /></div>
              <form className="signin-form" onSubmit={(event) => {
                event.preventDefault();
                changeStep('password');
              }}>
                <div className="signin-input-wrap">
                  <input
                    id="signin-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setNotice('');
                    }}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    autoComplete="email"
                    required
                  />
                </div>
                <button type="submit" className="signin-submit">
                  Continue with email <ArrowRight size={17} />
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Enter your <em>password.</em></h1>
              <p className="signin-description">Enter your password to access your Bellbee account.</p>
              <div className="signin-email-summary">
                <span className="signin-email-icon"><Mail size={16} /></span>
                <span className="signin-email-details"><small>CONTINUING AS</small><strong>{email}</strong></span>
                <button type="button" className="signin-change-email" disabled={isSubmitting}
                  onClick={() => changeStep('email')} aria-label="Change email address">
                  <Pencil size={13} /> Change
                </button>
              </div>
              <form className="signin-form" onSubmit={handleSignIn}>
                <div className="signin-input-wrap signin-password-wrap">
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setNotice('');
                    }}
                    placeholder="Enter your password"
                    aria-label="Password"
                    autoComplete="current-password"
                    required
                    autoFocus
                  />
                  <button type="button" className="signin-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <button type="button" className="signin-forgot-password" onClick={handleForgotPassword} disabled={isSubmitting}>
                  Forgot password?
                </button>
                <button type="submit" className="signin-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait…' : 'Sign in'} <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}

          {notice && <p className="signin-notice" role="status">{notice}</p>}
          <p className="signin-signup">
            Don’t have an account? <Link to="/signup" state={location.state}>Create an account</Link>
          </p>
        </section>
      </div>
      <div className="signin-api-badge">
        <span className="signin-api-dot" /> Built on the official WhatsApp Cloud API
      </div>
      <footer className="signin-page-footer">© 2026 Bellbee. All rights reserved.</footer>
    </main>
  );
}