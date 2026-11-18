import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Eye, EyeOff, Pencil } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import './SignIn.css';

gsap.registerPlugin(useGSAP);

export default function SignIn() {
  const pageRef = useRef(null);

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');

  useGSAP(
    () => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      });

      timeline
        .from('.signin-circle-yellow', {
          scale: 0.72,
          opacity: 0,
          duration: 0.9,
          ease: 'power2.out',
        })
        .from(
          '.signin-card',
          {
            y: 32,
            opacity: 0,
            scale: 0.97,
            duration: 0.7,
          },
          '-=0.5'
        )
        .from(
          '.signin-card > *',
          {
            y: 18,
            opacity: 0,
            duration: 0.5,
            stagger: 0.07,
          },
          '-=0.4'
        )
        .from(
          '.signin-api-badge, .signin-page-footer',
          {
            y: 12,
            opacity: 0,
            duration: 0.5,
          },
          '-=0.3'
        );
    },
    { scope: pageRef }
  );

  // Moves the user from the email step to the password step.
  const handleContinueWithEmail = (event) => {
    event.preventDefault();

    setNotice('');
    setPassword('');
    setStep('password');
  };

  // Returns to the email step so the user can change their email.
  const handleChangeEmail = () => {
    setStep('email');
    setPassword('');
    setNotice('');
  };

  // Handles Google sign-in when authentication is connected.
  const handleGoogleSignIn = () => {
    setNotice(
      'Google sign-in will be available once Google authentication is connected.'
    );
  };

  // Handles password login when the authentication API is connected.
  const handleSignIn = (event) => {
    event.preventDefault();

    setNotice(
      'Your login form is ready. Sign-in will work once the authentication service is connected.'
    );
  };

  // Handles password recovery when the authentication service is connected.
  const handleForgotPassword = () => {
    setNotice(
      'Password reset will be available once the authentication service is connected.'
    );
  };

  return (
    <main ref={pageRef} className="signin-page">
      {/* Background shapes */}
      <span className="signin-circle signin-circle-yellow" aria-hidden="true" />
      <span
        className="signin-circle signin-circle-lavender"
        aria-hidden="true"
      />

      {/* Sign in card */}
      <div className="signin-stage">
        <section className="signin-card">
          <div className="signin-welcome">
            <span className="signin-welcome-line" />
            <span>WELCOME BACK</span>
          </div>

          {step === 'email' ? (
            <>
              <h1>
                Welcome <em>back.</em>
              </h1>

              <p className="signin-description">
                Manage your business automation with ease.
              </p>

              <button
                type="button"
                className="signin-google-button"
                onClick={handleGoogleSignIn}
              >
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-2 4.6-4.3 6l6.7 5.2c3.9-3.6 6.2-8.9 6.2-14.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 44c5.4 0 10-1.8 13.4-4.9l-6.7-5.2c-1.8 1.2-4.1 2-6.7 2-5.1 0-9.4-3.4-11-8l-7 5.4C9.3 39.8 16.1 44 24 44z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M13 27.9c-.4-1.2-.7-2.5-.7-3.9s.2-2.7.7-3.9l-7-5.4C4.7 17.4 4 20.6 4 24s.7 6.6 2 9.3l7-5.4z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8C34.1 5.9 29.4 4 24 4 16.1 4 9.3 8.2 6 14.7l7 5.4c1.6-4.7 5.9-8.1 11-8.1z"
                  />
                </svg>

                Continue with Google
              </button>

              <div className="signin-divider">
                <span />
                <p>Or continue with email</p>
                <span />
              </div>

              <form
                className="signin-form"
                onSubmit={handleContinueWithEmail}
              >
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
                  Continue with email
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>
                Enter your <em>password.</em>
              </h1>

              <p className="signin-description">
                Welcome back! Enter your password to access your Bellbee
                account.
              </p>

              <div className="signin-email-summary">
                <span className="signin-email-icon">
                  <Mail size={16} />
                </span>

                <span className="signin-email-details">
                  <small>CONTINUING AS</small>
                  <strong>{email}</strong>
                </span>

                <button
                  type="button"
                  className="signin-change-email"
                  onClick={handleChangeEmail}
                  aria-label="Change email address"
                >
                  <Pencil size={13} />
                  Change
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

                  <button
                    type="button"
                    className="signin-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  className="signin-forgot-password"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>

                <button type="submit" className="signin-submit">
                  Sign in
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}

          {notice && (
            <p className="signin-notice" role="status">
              {notice}
            </p>
          )}

          <p className="signin-signup">
            Don't have an account?{' '}
            <Link to="/signup">Create an account</Link>
          </p>
        </section>
      </div>

      {/* WhatsApp Cloud API badge */}
      <div className="signin-api-badge">
        <span className="signin-api-dot" />
        Built on the official WhatsApp Cloud API
      </div>

      <footer className="signin-page-footer">
        © 2026 Bellbee. All rights reserved.
      </footer>
    </main>
  );
}