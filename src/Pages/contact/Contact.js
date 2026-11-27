
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

import CTA from "../../components/landing/CTA";

import Footer from "../../components/Footer";

gsap.registerPlugin(useGSAP);

const API_BASE = (
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000"
)
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

const CONTACT_PATH = (
  process.env.REACT_APP_API_CONTACT_SUBMIT_PATH ||
  ""
).trim();

export default function Contact() {
  const pageRef = useRef(null);

  const [values, setValues] =
    useState({
      name: "",
      email: "",
      message: "",
    });

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
    }));

    setNotice(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (sending) {
      return;
    }

    const payload = {
      name:
        values.name.trim(),

      email:
        values.email.trim(),

      message:
        values.message.trim(),
    };

    const nextErrors = {};

    if (payload.name.length < 2) {
      nextErrors.name =
        "Please enter your name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        payload.email
      )
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    if (
      payload.message.length < 10
    ) {
      nextErrors.message =
        "Please enter at least 10 characters.";
    }

    if (
      payload.message.length > 5000
    ) {
      nextErrors.message =
        "Message must be 5000 characters or fewer.";
    }

    if (
      Object.keys(nextErrors).length
    ) {
      setErrors(nextErrors);

      setNotice({
        type: "error",
        text:
          "Please correct the highlighted fields.",
      });

      return;
    }

    if (
      !CONTACT_PATH ||
      !CONTACT_PATH.startsWith("/") ||
      CONTACT_PATH.startsWith("//")
    ) {
      setNotice({
        type: "error",

        text:
          "Contact form is not connected yet. Please email info@bellbee.ai directly.",
      });

      return;
    }

    setSending(true);
    setNotice(null);

    try {
      await axios.post(
        `${API_BASE}${CONTACT_PATH}`,

        payload,

        {
          headers: {
            "Content-Type":
              "application/json",
          },

          timeout: 20000,
        }
      );

      setValues({
        name: "",
        email: "",
        message: "",
      });

      setErrors({});

      setNotice({
        type: "success",

        text:
          "Your message has been received. Our team will get back to you.",
      });
    } catch (failure) {
      const details =
        failure?.response?.data;

      setNotice({
        type: "error",

        text:
          typeof details?.message ===
          "string"
            ? details.message
            : "Could not submit your message. Please try again or email info@bellbee.ai.",
      });

      const backendErrors =
        details?.errors;

      if (
        backendErrors &&
        typeof backendErrors === "object"
      ) {
        setErrors((current) => ({
          ...current,

          ...Object.fromEntries(
            Object.entries(
              backendErrors
            )
              .filter(([name]) =>
                [
                  "name",
                  "email",
                  "message",
                ].includes(name)
              )
              .map(
                ([name, value]) => [
                  name,
                  Array.isArray(value)
                    ? value.join(" ")
                    : String(value),
                ]
              )
          ),
        }));
      }
    } finally {
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
              below and our team typically
              replies within a few hours.
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
                href="https://www.google.com/maps/search/?api=1&query=Office+LG+08%2C+Queen+Plaza%2C+Durand+Road%2C+Lahore%2C+Pakistan"
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
                    Office LG 08,
                    Queen Plaza,
                    Durand Road,
                    Lahore, Pakistan
                  </strong>
                </span>

                <ArrowUpRight
                  className="contact-info-arrow"
                  size={18}
                />
              </a>

              <a
                className="contact-info-card"
                href="tel:+923094468949"
              >
                <span className="contact-info-icon">
                  <Phone size={20} />
                </span>

                <span className="contact-info-text">
                  <small>
                    CALL US
                  </small>

                  <strong>
                    +92 309 4468949
                  </strong>
                </span>

                <ArrowUpRight
                  className="contact-info-arrow"
                  size={18}
                />
              </a>

              <a
                className="contact-info-card"
                href="mailto:info@bellbee.ai"
              >
                <span className="contact-info-icon">
                  <Mail size={20} />
                </span>

                <span className="contact-info-text">
                  <small>
                    EMAIL US
                  </small>

                  <strong>
                    info@bellbee.ai
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
                  maxLength={120}
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

              <label className="contact-field">
                <span>
                  Message
                </span>

                <textarea
                  name="message"
                  rows="5"
                  value={values.message}
                  onChange={changeField}
                  placeholder="Tell us how we can help..."
                  maxLength={5000}
                  aria-invalid={Boolean(
                    errors.message
                  )}
                  required
                />

                {errors.message && (
                  <small className="contact-field-error">
                    {errors.message}
                  </small>
                )}
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
