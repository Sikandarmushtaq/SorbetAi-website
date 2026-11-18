
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import './VerifyEmail.css';

gsap.registerPlugin(useGSAP);

// Formats seconds as MM:SS.
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

export default function VerifyEmail() {
  const pageRef = useRef(null);
  const location = useLocation();

  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [expiryTime, setExpiryTime] = useState(592);
  const [resendTime, setResendTime] = useState(52);
  const [notice, setNotice] = useState('');

  useGSAP(
    () => {
      gsap.from('.verify-email-card > *', {
        y: 22,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      });
    },
    { scope: pageRef }
  );

  // Updates the verification expiry and resend countdowns.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpiryTime((previous) => Math.max(0, previous - 1));
      setResendTime((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // Handles verification code submission when the backend is connected.
  const handleVerify = (event) => {
    event.preventDefault();

    setNotice(
      'Email verification will be available once the authentication service is connected.'
    );
  };

  // Handles requesting a new verification code when email delivery is connected.
  const handleResend = () => {
    setNotice(
      'A new verification code can be requested once the email service is connected.'
    );
  };

  return (
    <main ref={pageRef} className="verify-email-page">
      <div className="verify-email-blob verify-blob-one" />
      <div className="verify-email-blob verify-blob-two" />

      <section className="verify-email-card">
        <Link to="/" className="verify-email-brand">
          <span className="verify-brand-icon">
            <MessageCircle size={22} strokeWidth={2.5} />
          </span>
          <span>Bellbee</span>
        </Link>

        <div className="verify-email-icon">
          <Mail size={31} strokeWidth={1.7} />
          <span className="verify-email-icon-check">
            <ShieldCheck size={17} />
          </span>
        </div>

        <p className="verify-email-eyebrow">
          ONE LAST STEP
        </p>

        <h1>
          Verify your <em>email.</em>
        </h1>

        <p className="verify-email-description">
          {email ? (
            <>
              We sent a verification code to{' '}
              <strong>{email}</strong>. Enter it below to activate your
              account.
            </>
          ) : (
            <>
              Enter the verification code sent to your email address
              to activate your account.
            </>
          )}
        </p>

        <form className="verify-email-form" onSubmit={handleVerify}>
          <label htmlFor="verification-code">
            Verification code
          </label>

          <input
            id="verification-code"
            type="text"
            name="code"
            value={code}
            onChange={(event) => {
              const value = event.target.value
                .replace(/\D/g, '')
                .slice(0, 6);

              setCode(value);
              setNotice('');
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
          />

          <div className="verify-email-timer">
            <span>
              Code expires in{' '}
              <strong>{formatTime(expiryTime)}</strong>
            </span>

            <span className="verify-timer-dot" />

            <span>
              {expiryTime === 0 ? 'Code expired' : 'Check your inbox'}
            </span>
          </div>

          <button
            type="submit"
            className="verify-email-submit"
            disabled={code.length !== 6 || expiryTime === 0}
          >
            Verify email
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="verify-email-resend">
          <span>Didn't receive it?</span>

          {resendTime > 0 ? (
            <strong>
              Resend in {resendTime}s
            </strong>
          ) : (
            <button type="button" onClick={handleResend}>
              Resend code
            </button>
          )}
        </div>

        {notice && (
          <p className="verify-email-notice" role="status">
            {notice}
          </p>
        )}

        <div className="verify-email-divider" />

        <Link to="/signin" className="verify-back-link">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>

        <p className="verify-email-copyright">
          © 2026 Bellbee. All rights reserved.
        </p>
      </section>
    </main>
  );
}
