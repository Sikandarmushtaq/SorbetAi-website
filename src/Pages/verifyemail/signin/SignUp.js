import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  TicketPercent,
  UserRound,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import './SignUp.css';

gsap.registerPlugin(useGSAP);

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
).replace(/\/+$/, '');

const countries = [
  { name: 'Pakistan', code: '+92' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'United States', code: '+1' },
  { name: 'Canada', code: '+1' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'Saudi Arabia', code: '+966' },
  { name: 'Australia', code: '+61' },
  { name: 'India', code: '+91' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'Netherlands', code: '+31' },
  { name: 'Ireland', code: '+353' },
  { name: 'South Africa', code: '+27' },
  { name: 'Singapore', code: '+65' },
  { name: 'Malaysia', code: '+60' },
];

const emptyRegistration = {
  country: '',
  firstName: '',
  lastName: '',
  businessName: '',
  email: '',
  phone: '',
  promoCode: '',
};

// Checks the password against the account security requirements.
function getPasswordRequirements(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

// Safely reads the backend error response.
async function readApiResponse(response) {
  return response.json().catch(() => ({}));
}

export default function SignUp() {
  const pageRef = useRef(null);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showPromo, setShowPromo] = useState(false);
  const [registrationData, setRegistrationData] = useState(emptyRegistration);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [whatsappTipsEnabled, setWhatsappTipsEnabled] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedCountryData = countries.find(
    (country) => country.name === selectedCountry
  );

  const passwordRequirements = getPasswordRequirements(password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    isPasswordValid &&
    passwordsMatch &&
    acceptedTerms &&
    !isSubmitting;

  useGSAP(
    () => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      });

      timeline
        .from('.signup-brand', {
          y: 15,
          opacity: 0,
          duration: 0.6,
        })
        .from(
          '.signup-content > *',
          {
            y: 20,
            opacity: 0,
            duration: 0.55,
            stagger: 0.08,
          },
          '-=0.3'
        )
        .from(
          '.signup-visual-heading > *',
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.12,
          },
          '-=0.3'
        )
        .from(
          '.signup-flow-card',
          {
            y: 25,
            opacity: 0,
            scale: 0.96,
            duration: 0.65,
            stagger: 0.12,
          },
          '-=0.3'
        )
        .from(
          '.signup-benefit-card',
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
            stagger: 0.12,
          },
          '-=0.3'
        );

      gsap.to('.signup-blob', {
        y: -12,
        rotation: 7,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    },
    { scope: pageRef }
  );

  // Saves the first-step details before opening the password screen.
  const handleDetailsSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();

    const details = {
      country: selectedCountry,
      countryCode: selectedCountryData?.code || '',
      firstName: String(formData.get('firstName') || '').trim(),
      lastName: String(formData.get('lastName') || '').trim(),
      businessName: String(formData.get('businessName') || '').trim(),
      email,
      phone: String(formData.get('phone') || '').trim(),
      promoCode: String(formData.get('promoCode') || '').trim(),
    };

    setRegistrationData(details);
    setSubmitError('');
    setStep(2);
  };

  // Creates the account through the documented signup endpoint.
  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!isPasswordValid) {
      setSubmitError('Please meet all password requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Your passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setSubmitError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: `${registrationData.firstName} ${registrationData.lastName}`.trim(),
          email: registrationData.email,
          password,
          workspace_name: registrationData.businessName,
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok) {
        const fieldError = result?.error?.details?.[0]?.message;

        throw new Error(
          fieldError ||
            result?.error?.message ||
            result?.message ||
            'We could not create your account. Please try again.'
        );
      }

      navigate('/verify-email', {
        state: {
          email: registrationData.email,
          registrationData: {
            ...registrationData,
            whatsappTipsEnabled,
          },
        },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Returns to the details step without clearing the entered information.
  const handleChangeEmail = () => {
    setSubmitError('');
    setStep(1);
  };

  return (
    <main ref={pageRef} className="signup-page">
      <section className="signup-left">
        <Link to="/" className="signup-brand" aria-label="Bellbee home">
          <span className="signup-brand-icon">
            <MessageCircle size={22} strokeWidth={2.5} />
            <span />
          </span>
          <span>Bellbee</span>
        </Link>

        <div
          className={`signup-content ${
            step === 2 ? 'signup-content-password' : ''
          }`}
        >
          {step === 1 ? (
            <>
              <div className="signup-welcome">
                <span className="signup-welcome-line" />
                <span>GET STARTED WITH BELLBEE</span>
              </div>

              <h1>
                Create your <em>account.</em>
              </h1>

              <p className="signup-description">
                Start automating your business conversations today.
              </p>

              <div className="signup-divider">
                <span />
                <p>Continue with your details</p>
                <span />
              </div>

              <form
                className="signup-form"
                onSubmit={handleDetailsSubmit}
              >
                <div className="signup-field">
                  <label htmlFor="signup-country">Country</label>

                  <div className="signup-input-wrap signup-select-wrap">
                    <Globe2 size={17} />

                    <select
                      id="signup-country"
                      name="country"
                      value={selectedCountry}
                      onChange={(event) =>
                        setSelectedCountry(event.target.value)
                      }
                      required
                    >
                      <option value="">Select...</option>

                      {countries.map((country) => (
                        <option key={country.name} value={country.name}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>

                    <span className="signup-select-arrow" />
                  </div>
                </div>

                <div className="signup-name-row">
                  <div className="signup-field">
                    <label htmlFor="signup-first-name">First name</label>

                    <div className="signup-input-wrap">
                      <UserRound size={17} />

                      <input
                        id="signup-first-name"
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        autoComplete="given-name"
                        defaultValue={registrationData.firstName}
                        required
                      />
                    </div>
                  </div>

                  <div className="signup-field">
                    <label htmlFor="signup-last-name">Last name</label>

                    <div className="signup-input-wrap">
                      <input
                        id="signup-last-name"
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        autoComplete="family-name"
                        defaultValue={registrationData.lastName}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-business">Business name</label>

                  <div className="signup-input-wrap">
                    <Building2 size={17} />

                    <input
                      id="signup-business"
                      type="text"
                      name="businessName"
                      placeholder="Your business name"
                      autoComplete="organization"
                      defaultValue={registrationData.businessName}
                      required
                    />
                  </div>
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-email">Email address</label>

                  <div className="signup-input-wrap">
                    <Mail size={17} />

                    <input
                      id="signup-email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      defaultValue={registrationData.email}
                      required
                    />
                  </div>
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-phone">Your mobile number</label>

                  <div className="signup-input-wrap">
                    <Phone size={17} />

                    {selectedCountryData && (
                      <span className="signup-phone-code">
                        {selectedCountryData.code}
                      </span>
                    )}

                    <input
                      id="signup-phone"
                      type="tel"
                      name="phone"
                      placeholder="Enter your mobile number"
                      autoComplete="tel-national"
                      defaultValue={registrationData.phone}
                      required
                    />
                  </div>

                  <small className="signup-field-hint">
                    We may contact you on this number about your account
                    and Bellbee updates.
                  </small>
                </div>

                <div className="signup-promo-section">
                  <button
                    type="button"
                    className="signup-promo-toggle"
                    onClick={() => setShowPromo((previous) => !previous)}
                    aria-expanded={showPromo}
                  >
                    <TicketPercent size={17} />
                    <span>Have a referral or promo code?</span>
                    <span className="signup-promo-symbol">
                      {showPromo ? '−' : '+'}
                    </span>
                  </button>

                  {showPromo && (
                    <div className="signup-promo-input">
                      <input
                        type="text"
                        name="promoCode"
                        placeholder="Enter referral or promo code"
                        defaultValue={registrationData.promoCode}
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="signup-submit">
                  Continue
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                className="signup-back-button"
                onClick={handleChangeEmail}
              >
                <ArrowLeft size={16} />
                Back to details
              </button>

              <div className="signup-welcome">
                <span className="signup-welcome-line" />
                <span>SECURE YOUR ACCOUNT</span>
              </div>

              <h1>
                Create your <em>account.</em>
              </h1>

              <p className="signup-description">
                Secure your account with a password.
              </p>

              <div className="signup-email-row">
                <span className="signup-email-icon">
                  <Mail size={17} />
                </span>

                <span className="signup-email-copy">
                  <small>Your email address</small>
                  <strong>{registrationData.email}</strong>
                </span>

                <button
                  type="button"
                  className="signup-change-email"
                  onClick={handleChangeEmail}
                >
                  Change
                </button>
              </div>

              <form
                className="signup-form signup-password-form"
                onSubmit={handleCreateAccount}
              >
                <div className="signup-field">
                  <label htmlFor="signup-password">Password</label>

                  <div className="signup-input-wrap signup-password-input">
                    <LockKeyhole size={17} />

                    <input
                      id="signup-password"
                      type={showPasswords ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      className="signup-password-toggle"
                      onClick={() =>
                        setShowPasswords((previous) => !previous)
                      }
                      aria-label={
                        showPasswords ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPasswords ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <ul className="signup-password-rules" aria-live="polite">
                  <li className={passwordRequirements.length ? 'is-valid' : ''}>
                    <Check size={14} />
                    At least 8 characters
                  </li>

                  <li
                    className={passwordRequirements.uppercase ? 'is-valid' : ''}
                  >
                    <Check size={14} />
                    One uppercase letter
                  </li>

                  <li
                    className={passwordRequirements.lowercase ? 'is-valid' : ''}
                  >
                    <Check size={14} />
                    One lowercase letter
                  </li>

                  <li className={passwordRequirements.number ? 'is-valid' : ''}>
                    <Check size={14} />
                    One number
                  </li>
                </ul>

                <div className="signup-field">
                  <label htmlFor="signup-confirm-password">
                    Confirm password
                  </label>

                  <div className="signup-input-wrap signup-password-input">
                    <LockKeyhole size={17} />

                    <input
                      id="signup-confirm-password"
                      type={showPasswords ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                    />
                  </div>

                  {confirmPassword.length > 0 && (
                    <small
                      className={`signup-match-message ${
                        passwordsMatch ? 'is-valid' : 'is-invalid'
                      }`}
                    >
                      {passwordsMatch
                        ? 'Passwords match.'
                        : 'Passwords do not match.'}
                    </small>
                  )}
                </div>

                <label className="signup-terms-row">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(event.target.checked)
                    }
                    required
                  />

                  <span>
                    I agree to the{' '}
                    <a
                      href="https://cybersol360.com/terms-conditions/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://cybersol360.com/privacy-policy/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                <div className="signup-tips-row">
                  <span className="signup-tips-icon">
                    <MessageCircle size={17} />
                  </span>

                  <span className="signup-tips-copy">
                    <strong>WhatsApp setup tips</strong>
                    <small>Get helpful tips while connecting WhatsApp.</small>
                  </span>

                  <button
                    type="button"
                    className={`signup-switch ${
                      whatsappTipsEnabled ? 'is-on' : ''
                    }`}
                    role="switch"
                    aria-checked={whatsappTipsEnabled}
                    aria-label="WhatsApp setup tips"
                    onClick={() =>
                      setWhatsappTipsEnabled((previous) => !previous)
                    }
                  >
                    <span />
                    <strong>{whatsappTipsEnabled ? 'On' : 'Off'}</strong>
                  </button>
                </div>

                {submitError && (
                  <p className="signup-form-error" role="alert">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  className="signup-submit"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? 'Creating account...' : 'Continue'}
                  {!isSubmitting && <ArrowRight size={17} />}
                </button>
              </form>

              <p className="signup-secure-note">
                <BadgeCheck size={15} />
                Your password is encrypted and securely handled.
              </p>
            </>
          )}
        </div>

        <p className="signup-copyright">
          © 2026 Bellbee. All rights reserved.
        </p>
      </section>

      <section className="signup-right">
        <div className="signup-blob signup-blob-one" />
        <div className="signup-blob signup-blob-two" />
        <div className="signup-blob signup-blob-three" />

        <div className="signup-visual-heading">
          <span className="signup-visual-eyebrow">
            <span />
            SIMPLE SETUP. SMARTER CONVERSATIONS.
          </span>

          <h2>
            Connect WhatsApp in minutes,
            <br />
            on the official <em>Cloud API.</em>
          </h2>

          <p>
            Sign in with Meta, verify your number, and Bellbee starts
            answering your customers.
          </p>
        </div>

        <div className="signup-flow">
          <div className="signup-flow-line" />

          <div className="signup-flow-card">
            <span className="signup-flow-icon signup-meta-icon">
              <MessageCircle size={22} />
            </span>

            <span className="signup-flow-copy">
              <small>STEP 01</small>
              <strong>Sign in with Meta</strong>
              <span>Connect your business account</span>
            </span>

            <span className="signup-flow-check">
              <Check size={15} />
            </span>
          </div>

          <div className="signup-flow-card signup-flow-card-middle">
            <span className="signup-flow-icon signup-verify-icon">
              <BadgeCheck size={22} />
            </span>

            <span className="signup-flow-copy">
              <small>STEP 02</small>
              <strong>Verify your number</strong>
              <span>Securely connect your WhatsApp number</span>
            </span>

            <span className="signup-flow-check">
              <Check size={15} />
            </span>
          </div>

          <div className="signup-flow-card">
            <span className="signup-flow-icon signup-bellbee-icon">
              <Sparkles size={22} />
            </span>

            <span className="signup-flow-copy">
              <small>STEP 03</small>
              <strong>Let Bellbee get to work</strong>
              <span>Start answering your customers</span>
            </span>

            <span className="signup-flow-check">
              <Check size={15} />
            </span>
          </div>
        </div>

        <div className="signup-benefits">
          <div className="signup-benefit-card">
            <span className="signup-benefit-icon">
              <Sparkles size={19} />
            </span>

            <span>
              <strong>Free</strong>
              <small>To start</small>
            </span>
          </div>

          <div className="signup-benefit-divider" />

          <div className="signup-benefit-card">
            <span className="signup-benefit-icon signup-card-icon">
              <CreditCard size={19} />
            </span>

            <span>
              <strong>No card</strong>
              <small>Needed to sign up</small>
            </span>
          </div>
        </div>

        <div className="signup-right-footer">
          <div className="signup-product-by">
            <span className="signup-cyber-mark">
              <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path
                  d="M4 20V8L14 3L24 8V20L14 25L4 20Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M4 8L14 14L24 8M14 14V25"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </span>

            <span>
              <small>PRODUCT BY</small>
              <strong>Cybersol360 Ltd.</strong>
            </span>
          </div>

          <div className="signup-api-note">
            <span />
            Built on the official WhatsApp Cloud API
          </div>
        </div>
      </section>
    </main>
  );
}