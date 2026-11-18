
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowUpRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';

import './Contact.css';
import CTA from '../../components/landing/CTA';
import Footer from '../../components/Footer';

gsap.registerPlugin(useGSAP);

export default function Contact() {
  const pageRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);

  useGSAP(
    () => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      });

      timeline
        .from('.contact-eyebrow', {
          y: 18,
          opacity: 0,
          duration: 0.6,
        })
        .from(
          '.contact-heading',
          {
            y: 35,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.35'
        )
        .from(
          '.contact-hero-description',
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          '-=0.5'
        )
        .from(
          '.contact-visual-card',
          {
            scale: 0.9,
            opacity: 0,
            rotation: 5,
            duration: 0.8,
          },
          '-=0.6'
        )
        .from(
          '.contact-details-content > *',
          {
            y: 25,
            opacity: 0,
            duration: 0.6,
            stagger: 0.12,
          },
          '-=0.3'
        )
        .from(
          '.contact-form-card',
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
          },
          '-=0.5'
        );

      gsap.to('.contact-visual-blob', {
        y: -12,
        rotation: 8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    },
    { scope: pageRef }
  );

  // Opens the visitor's email app with their contact details.
  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    const subject = encodeURIComponent(
      `Contact enquiry from ${name}`
    );

    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:info@bellbee.ai?subject=${subject}&body=${body}`;

    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <main ref={pageRef} className="contact-page">
      {/* Contact Hero */}
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
              Have a question about Bellbee Ai, or want to know if
              it's right for your business? Fill in the form below
              and our team typically replies within a few hours.
            </p>

            {/* <a href="#contact-form" className="contact-hero-button">
              Let's talk
              <ArrowUpRight size={17} />
            </a> */}
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
                <p>Bellbee Ai</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details and Form */}
      <section className="contact-main" id="contact-form">
        <div className="contact-layout">
          <div className="contact-details-content">
            <p className="contact-section-eyebrow">LET'S TALK</p>

            <h2 className="contact-section-heading">
              Good things start with a{' '}
              <em>conversation.</em>
            </h2>

            <p className="contact-details-description">
              Whether you're curious about features, pricing, or
              just want to know if Bellbee Ai fits your business,
              we're here to help. Tell us a little about what you're
              looking for and we'll get back to you.
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
                  <small>OUR ADDRESS</small>
                  <strong>
                    Office LG 08, Queen Plaza, Durand Road,
                    Lahore, Pakistan
                  </strong>
                </span>

                <ArrowUpRight className="contact-info-arrow" size={18} />
              </a>

              <a
                className="contact-info-card"
                href="tel:+923094468949"
              >
                <span className="contact-info-icon">
                  <Phone size={20} />
                </span>

                <span className="contact-info-text">
                  <small>CALL US</small>
                  <strong>+92 309 4468949</strong>
                </span>

                <ArrowUpRight className="contact-info-arrow" size={18} />
              </a>

              <a
                className="contact-info-card"
                href="mailto:info@bellbee.ai"
              >
                <span className="contact-info-icon">
                  <Mail size={20} />
                </span>

                <span className="contact-info-text">
                  <small>EMAIL US</small>
                  <strong>info@bellbee.ai</strong>
                </span>

                <ArrowUpRight className="contact-info-arrow" size={18} />
              </a>
            </div>

            <div className="contact-response-note">
              <span className="contact-response-dot" />
              <p>
                Available Monday to Friday. We aim to respond
                within 24 hours.
              </p>
            </div>
          </div>

          <div className="contact-form-card">
            <div className="contact-form-heading">
              <span className="contact-form-icon">
                <MessageCircle size={20} />
              </span>

              <div>
                <p>HAVE SOMETHING IN MIND?</p>
                <h2>Send us a message.</h2>
              </div>
            </div>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >
              <label className="contact-field">
                <span>Your Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="contact-field">
                <span>Your Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="contact-field">
                <span>Message</span>
                <textarea
                  name="message"
                  rows="5"
                  placeholder="Tell us how we can help..."
                  required
                />
              </label>

              <button type="submit" className="contact-submit-button">
                Send Message
                <ArrowUpRight size={18} />
              </button>

              {submitted && (
                <p className="contact-form-success" role="status">
                  Your email app should open with your message ready
                  to send. You can also email us at info@bellbee.ai.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
      <CTA/>
      <Footer/>
    </main>
  );
}
