import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageCircle,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  LoaderCircle,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import './VerifyEmail.css';
import { useAuth } from '../../../context/AuthContext';
import { authApi, authErrorMessage, dashboardDestination } from '../../../services/auth.api';

gsap.registerPlugin(useGSAP);

export default function VerifyEmail() {
  const pageRef = useRef(null);
  const verificationStarted = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const returnTo = dashboardDestination(location.state);

  const searchParams = new URLSearchParams(location.search);
  const verificationToken = searchParams.get('token') || '';

  const email =
    location.state?.email ||
    window.localStorage.getItem('bellbee_pending_verification_email') ||
    '';

  const [verifiedEmail, setVerifiedEmail] = useState(email);
  const [status, setStatus] = useState(
    verificationToken ? 'verifying' : 'waiting'
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

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

  // Verifies the single-use token received from the email link.
  useEffect(() => {
    if (!verificationToken || verificationStarted.current) return;

    verificationStarted.current = true;

    const verifyEmail = async () => {
      setStatus('verifying');
      setErrorMessage('');

      try {
        const result = await authApi.verifyEmail(verificationToken);
        await saveSession(result.tokens);
        if (result.user?.email) setVerifiedEmail(result.user.email);
        window.localStorage.removeItem('bellbee_pending_verification_email');
        setStatus('success');
        navigate(returnTo, { replace: true });
      } catch (error) {
        console.error('[Bellbee Email Verification]', {
          endpoint: '/api/v1/auth/verify-email',
          message: error.message,
        });

        setErrorMessage(
          authErrorMessage(error) || 'Something went wrong. Please try again.'
        );

        setStatus('error');
      }
    };

    verifyEmail();
  }, [verificationToken, saveSession, navigate, returnTo]);

  // Requests a fresh verification link from the backend.
  const handleResend = async () => {
    if (!verifiedEmail || isResending) return;

    setIsResending(true);
    setResendMessage('');
    setErrorMessage('');

    try {
      await authApi.resendVerification(verifiedEmail);
      setResendMessage(
        'If this email has an unverified account, a new verification link has been sent. Please check your inbox.'
      );
    } catch (error) {
      console.error('[Bellbee Resend Verification]', {
        endpoint: '/api/v1/auth/resend-verification',
        message: error.message,
      });

      setErrorMessage(
        authErrorMessage(error) || 'Unable to resend the verification email.'
      );
    } finally {
      setIsResending(false);
    }
  };

  // Opens the dashboard after successful email verification.
  const handleContinue = () => {
    navigate('/dashboard', { replace: true });
  };

  const userEmail = verifiedEmail || email;

  const heading = {
    waiting: (
      <>
        Check your <em>inbox.</em>
      </>
    ),
    verifying: (
      <>
        Verifying your <em>email.</em>
      </>
    ),
    success: (
      <>
        Email verified <em>successfully.</em>
      </>
    ),
    error: (
      <>
        Verification <em>unsuccessful.</em>
      </>
    ),
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

        <div
          className={`verify-email-icon verify-icon-${status}`}
        >
          {status === 'verifying' ? (
            <LoaderCircle size={32} className="verify-spinner" />
          ) : status === 'success' ? (
            <CheckCircle2 size={34} />
          ) : status === 'error' ? (
            <AlertCircle size={34} />
          ) : (
            <Mail size={31} strokeWidth={1.7} />
          )}

          {status !== 'verifying' && (
            <span className="verify-email-icon-check">
              <ShieldCheck size={17} />
            </span>
          )}
        </div>

        <p className="verify-email-eyebrow">
          {status === 'success'
            ? 'ACCOUNT ACTIVATED'
            : status === 'verifying'
              ? 'SECURE VERIFICATION'
              : status === 'error'
                ? 'VERIFICATION ISSUE'
                : 'ONE LAST STEP'}
        </p>

        <h1>{heading[status]}</h1>

        {status === 'waiting' && (
          <>
            <p className="verify-email-description">
              We have sent a verification link to your email address.
              Open the email and click the verification button to
              activate your Bellbee account.
            </p>

            <div className="verify-email-address">
              <span className="verify-address-icon">
                <Mail size={17} />
              </span>

              <span className="verify-address-copy">
                <small>VERIFICATION EMAIL SENT TO</small>
                <strong>
                  {userEmail || 'Your registered email address'}
                </strong>
              </span>
            </div>

            <div className="verify-email-info">
              <ShieldCheck size={18} />

              <span>
                Your verification link is valid for 24 hours and
                can only be used once.
              </span>
            </div>

            <div className="verify-email-instructions">
              <strong>What to do next?</strong>

              <p>
                1. Open your inbox.
                <br />
                2. Find the email from Bellbee.
                <br />
                3. Click the Verify Email link.
              </p>
            </div>
          </>
        )}

        {status === 'verifying' && (
          <div className="verify-email-status-panel is-neutral">
            <LoaderCircle size={19} className="verify-spinner" />

            <span>
              We're securely verifying your email address and
              activating your account. Please don't close this page.
            </span>
          </div>
        )}

        {status === 'success' && (
          <>
            <p className="verify-email-description">
              Your email address has been verified and your Bellbee
              account is now active.
            </p>

            <div className="verify-email-status-panel is-success">
              <CheckCircle2 size={21} />

              <span>
                Your account has been created successfully. You are
                now signed in.
              </span>
            </div>

            <button
              type="button"
              className="verify-email-submit"
              onClick={handleContinue}
            >
              Continue to dashboard
              <ArrowRight size={17} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="verify-email-description">
              We couldn't verify your email address. The link may
              have expired, already been used, or may be invalid.
            </p>

            <div className="verify-email-status-panel is-error">
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
          </>
        )}

        {(status === 'waiting' || status === 'error') && (
          <>
            {userEmail ? (
              <div className="verify-email-resend">
                <span>Didn't receive the email?</span>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <RefreshCw
                        size={14}
                        className="verify-spinner"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      Resend verification email
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="verify-email-no-address">
                To request another verification link, return to
                signup and enter your email address.
              </p>
            )}

            {resendMessage && (
              <div className="verify-email-status-panel is-success">
                <CheckCircle2 size={19} />
                <span>{resendMessage}</span>
              </div>
            )}

            {errorMessage && status === 'waiting' && (
              <div className="verify-email-status-panel is-error">
                <AlertCircle size={19} />
                <span>{errorMessage}</span>
              </div>
            )}
          </>
        )}

        <div className="verify-email-divider" />

        {status === 'success' ? (
          <Link to="/dashboard" className="verify-back-link">
            <ArrowLeft size={15} />
            Go to dashboard
          </Link>
        ) : (
          <Link to="/signin" className="verify-back-link">
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        )}

        <p className="verify-email-copyright">
          © 2026 Bellbee. All rights reserved.
        </p>
      </section>
    </main>
  );
}
