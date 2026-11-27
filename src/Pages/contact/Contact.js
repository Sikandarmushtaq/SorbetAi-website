
import {
  useRef,
  useState,
} from "react";

import axios from "axios";

import gsap from "gsap";

import {
  useGSAP,
} from "@gsap/react";

import {
  ArrowUpRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import "./Contact.css";
import { API_ORIGIN } from "../../services/apiConfig";
import { countries, normalizePhone, isPhoneValid } from "../verifyemail/signin/CountrySelect";

import CTA from "../../components/landing/CTA";

import Footer from "../../components/Footer";

gsap.registerPlugin(useGSAP);

const API_BASE = API_ORIGIN;
const publicContactHttp = axios.create({ timeout: 20000, withCredentials: false });
const CONTACT_EMAIL = (process.env.REACT_APP_BELLBEE_CONTACT_EMAIL || "").trim();
const CONTACT_PHONE = (process.env.REACT_APP_BELLBEE_CONTACT_PHONE || "").trim();
const CONTACT_ADDRESS = (process.env.REACT_APP_BELLBEE_CONTACT_ADDRESS || "").trim();
const CONTACT_MAP_URL = (process.env.REACT_APP_BELLBEE_CONTACT_MAP_URL || "").trim();
const EMPTY_VALUES = { name: "", email: "", country: "", phone: "", message: "" };
const FORM_FIELDS = ["name", "email", "phone", "message"];

function fieldErrors(errors) {
  const result = {};
  const entries = Array.isArray(errors)
    ? errors.map((entry) => [entry?.field ?? entry?.loc?.at(-1), entry?.message ?? entry?.msg])
    : Object.entries(errors || {});
  for (const [field, value] of entries) {
    if (FORM_FIELDS.includes(field) && value) {
      result[field] = Array.isArray(value) ? value.join(" ") : String(value);
    }
  }
  return result;
}

const CONTACT_PATH = (
  process.env.REACT_APP_API_CONTACT_SUBMIT_PATH ||
  ""
).trim();

export default function Contact() {
  const pageRef = useRef(null);

  const [values, setValues] = useState(EMPTY_VALUES);
  const requestInFlight = useRef(false);
  const cooldowns = useRef([]);
  const country = countries.find((item) => item.code === values.country);

  const [errors, setErrors] =
    useState({});

  const [notice, setNotice] =
    useState(null);

  const [sending, setSending] =
    useState(false);

  useGSAP(
    () => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .from(".contact-eyebrow", {
          y: 18,
          opacity: 0,
          duration: .6,
        })
        .from(
          ".contact-heading",
          {
            y: 35,
            opacity: 0,
            duration: .8,
          },
          "-=.35"
        )
        .from(
          ".contact-hero-description",
          {
            y: 20,
            opacity: 0,
            duration: .7,
          },
          "-=.5"
        )
        .from(
          ".contact-visual-card",
          {
            scale: .9,
            opacity: 0,
            rotation: 5,
            duration: .8,
          },
          "-=.6"
        )
        .from(
          ".contact-details-content > *",
          {
            y: 25,
            opacity: 0,
            duration: .6,
            stagger: .12,
          },
          "-=.3"
        )
        .from(
          ".contact-form-card",
          {
            y: 30,
            opacity: 0,
            duration: .7,
          },
          "-=.5"
        );

      gsap.to(".contact-visual-blob", {
        y: -12,
        rotation: 8,
        duration: 3,

        repeat: -1,
        yoyo: true,

        ease: "sine.inOut",
      });
    },
    {
      scope: pageRef,
    }
  );

  function changeField(event) {
    const {
      name,
      value,
    } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
      ...(name === "country" ? { phone: "" } : {}),
    }));

    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (requestInFlight.current) return;

    const rawPhone = values.phone.trim();
    const national = country ? normalizePhone(rawPhone, country.dialCode) : "";
    const phone = country ? `${country.dialCode}${national}` : "";
    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone,
      message: values.message.trim() || null,
    };
    const nextErrors = {};
    if (payload.name.length < 3 || payload.name.length > 80 || /\p{N}/u.test(payload.name)) {
      nextErrors.name = "Enter a name of 3–80 characters without numbers.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!country) nextErrors.country = "Select your country.";
    if (!country || !/^[\d\s().-]+$/.test(rawPhone) || !isPhoneValid(national, country.dialCode) || !/^\+[1-9]\d{6,14}$/.test(phone)) {
      nextErrors.phone = "Enter a valid local phone number without the country code.";
    }
    if ((payload.message || "").length > 2000) {
      nextErrors.message = "Message must be 2,000 characters or fewer.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setNotice({ type: "error", text: "Please correct the highlighted fields." });
      return;
    }
    if (!/^\/(?!\/)/.test(CONTACT_PATH) || /[\\?#\s]/.test(CONTACT_PATH)) {
      setNotice({ type: "error", text: "Contact form is not configured." });
      return;
    }
    const now = Date.now();
    cooldowns.current = cooldowns.current.filter((entry) => entry.until > now);
    const blocked = cooldowns.current.find((entry) => entry.email === payload.email || entry.phone === payload.phone);
    if (blocked) {
      setNotice({ type: "error", text: `Please wait ${Math.ceil((blocked.until - now) / 60000)} minutes before submitting again.` });
      return;
    }
    requestInFlight.current = true;
    setSending(true);
    setErrors({});
    setNotice(null);
    try {
      const response = await publicContactHttp.post(`${API_BASE}${CONTACT_PATH}`, payload, {
        headers: { "Content-Type": "application/json", Authorization: null },

      });
      if (response.status !== 201 || response.data?.success !== true || response.data?.code !== "CONTACT_201") {
        setNotice({ type: "error", text: "The server did not confirm submission." });
        return;
      }
      setValues(EMPTY_VALUES);
      setNotice({ type: "success", text: response.data.message || "Message submitted successfully." });
    } catch (failure) {
      const details = failure?.response?.data;
      if (failure?.response?.status === 429 && details?.code === "CONTACT_429_COOLDOWN") {
        const retry = Number(failure.response.headers?.["retry-after"]);
        const seconds = Number.isFinite(retry) && retry > 0 ? retry : Number(details.data?.wait_time_seconds);
        if (Number.isFinite(seconds) && seconds > 0) {
          cooldowns.current.push({ email: payload.email, phone: payload.phone, until: Date.now() + seconds * 1000 });
        }
        const wait = details.data?.wait_time || (Number.isFinite(seconds) && seconds > 0 ? `${Math.ceil(seconds / 60)} minutes` : "");
        setNotice({ type: "error", text: `${details.message || "A recent submission already exists."}${wait ? ` Please wait ${wait} before submitting again.` : ""}` });
      } else {
        setErrors(fieldErrors(details?.errors ?? details?.detail));
        setNotice({ type: "error", text: typeof details?.message === "string" ? details.message : "Could not submit your message. Please try again." });
      }
    } finally {
      requestInFlight.current = false;
      setSending(false);
    }
  }

  return (
    <main
      ref={pageRef}
      className="contact-page"
    >
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <div className="contact-hero-content">
            <p className="contact-eyebrow">
              <span className="contact-eyebrow-dot" />

              WE'D LOVE TO HEAR FROM YOU
            </p>

            <h1 className="contact-heading">
              Contact Bellbee <em>Ai.</em>
            </h1>

            <p className="contact-hero-description">
              Have a question about Bellbee Ai,
              or want to know if it's right for
              your business? Fill in the form
              below and our team aims to
              respond within 24 hours.
            </p>
          </div>

          <div className="contact-hero-art">
            <div className="contact-visual-blob contact-visual-blob-one" />

            <div className="contact-visual-blob contact-visual-blob-two" />

            <div className="contact-visual-card">
              <div className="contact-visual-top">
                <span className="contact-visual-icon">
                  <MessageCircle size={22} />
                </span>

                <span className="contact-visual-status">
                  HERE TO HELP
                </span>
              </div>

              <p className="contact-visual-small">
                Every great conversation
              </p>

              <h2>
                Starts with
                <br />

                <em>hello.</em>
              </h2>

              <div className="contact-visual-bottom">
                <span />
                <span />
                <span />

                <p>
                  Bellbee Ai
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="contact-main"
        id="contact-form"
      >
        <div className="contact-layout">
          <div className="contact-details-content">
            <p className="contact-section-eyebrow">
              LET'S TALK
            </p>

            <h2 className="contact-section-heading">
              Good things start with a{" "}
              <em>
                conversation.
              </em>
            </h2>

            <p className="contact-details-description">
              Whether you're curious about
              features, pricing, or just want
              to know if Bellbee Ai fits your
              business, we're here to help.
              Tell us a little about what
              you're looking for and we'll
              get back to you.
            </p>

            <div className="contact-info-list">
              <a
                className="contact-info-card"
                href={CONTACT_MAP_URL || undefined}
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-info-icon">
                  <MapPin size={20} />
                </span>

                <span className="contact-info-text">
                  <small>
                    OUR ADDRESS
                  </small>

                  <strong>
                    {CONTACT_ADDRESS}
                  </strong>
                </span>

                <ArrowUpRight
                  className="contact-info-arrow"
                  size={18}
                />
              </a>

              <a
                className="contact-info-card"
                href={CONTACT_PHONE ? `tel:${CONTACT_PHONE}` : undefined}
              >
                <span className="contact-info-icon">
                  <Phone size={20} />
                </span>

                <span className="contact-info-text">
                  <small>
                    CALL US
                  </small>

                  <strong>
                    {CONTACT_PHONE}
                  </strong>
                </span>

                <ArrowUpRight
                  className="contact-info-arrow"
                  size={18}
                />
              </a>

              <a
                className="contact-info-card"
                href={CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : undefined}
              >
                <span className="contact-info-icon">
                  <Mail size={20} />
                </span>

                <span className="contact-info-text">
                  <small>
                    EMAIL US
                  </small>

                  <strong>
                    {CONTACT_EMAIL}
                  </strong>
                </span>

                <ArrowUpRight
                  className="contact-info-arrow"
                  size={18}
                />
              </a>
            </div>

            <div className="contact-response-note">
              <span className="contact-response-dot" />

              <p>
                Available Monday to Friday.
                We aim to respond within
                24 hours.
              </p>
            </div>
          </div>

          <div className="contact-form-card">
            <div className="contact-form-heading">
              <span className="contact-form-icon">
                <MessageCircle size={20} />
              </span>

              <div>
                <p>
                  HAVE SOMETHING IN MIND?
                </p>

                <h2>
                  Send us a message.
                </h2>
              </div>
            </div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <label className="contact-field">
                <span>
                  Your Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={values.name}
                  onChange={changeField}
                  placeholder="Enter your name"
                  autoComplete="name"
                  maxLength={80}
                  aria-invalid={Boolean(
                    errors.name
                  )}
                  required
                />

                {errors.name && (
                  <small className="contact-field-error">
                    {errors.name}
                  </small>
                )}
              </label>

              <label className="contact-field">
                <span>
                  Your Email
                </span>

                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={changeField}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  aria-invalid={Boolean(
                    errors.email
                  )}
                  required
                />

                {errors.email && (
                  <small className="contact-field-error">
                    {errors.email}
                  </small>
                )}
              </label>

              <div className="contact-field">
                <label htmlFor="contact-country">Country / calling code</label>
                <select id="contact-country" name="country" value={values.country} onChange={changeField} aria-invalid={Boolean(errors.country)} required>
                  <option value="">Select country</option>
                  {countries.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.dialCode})</option>)}
                </select>
                {errors.country && <small className="contact-field-error">{errors.country}</small>}
              </div>
              <label className="contact-field">
                <span>Your Phone</span>
                <div className="contact-phone-input">
                  <span>{country?.dialCode || "—"}</span>
                  <input type="tel" name="phone" value={values.phone} onChange={changeField} placeholder="Local phone number" autoComplete="tel-national" aria-invalid={Boolean(errors.phone)} required />
                </div>
                {errors.phone && <small className="contact-field-error">{errors.phone}</small>}
              </label>
              <label className="contact-field">
                <span>Message (optional)</span>
                <textarea name="message" rows="5" value={values.message} onChange={changeField} placeholder="Tell us how we can help..." maxLength={2000} aria-invalid={Boolean(errors.message)} />
                <small className="contact-character-count">{values.message.length}/2000</small>
                {errors.message && <small className="contact-field-error">{errors.message}</small>}
              </label>

              <button
                type="submit"
                className="contact-submit-button"
                disabled={sending}
              >
                {sending
                  ? "Sending…"
                  : "Send Message"}

                <ArrowUpRight size={18} />
              </button>

              {notice && (
                <p
                  className={
                    notice.type === "success"
                      ? "contact-form-success"
                      : "contact-form-error"
                  }
                  role={
                    notice.type === "error"
                      ? "alert"
                      : "status"
                  }
                >
                  {notice.text}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
