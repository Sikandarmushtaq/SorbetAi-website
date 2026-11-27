
import { Link } from 'react-router-dom';

import {
  MapPin,
  ArrowUpRight,
  ArrowUp,
  Sparkles,
  ShieldCheck,
  Mail,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from 'react-icons/fa';

import './Footer.css';

// All website links use local React Router routes.
const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'WhatsApp AI agent', to: '/whatsapp-ai-agent' },
      { label: 'Instagram', to: '/instagram-ai-automation' },
      { label: 'Messenger', to: '/messenger-ai-automation' },
      { label: 'Website chat', to: '/website-chat' },
      { label: 'One inbox', to: '/omnichannel-messaging' },
      { label: 'AI Assistant', to: '/ai-assistant' },
      { label: 'AI Brain', to: '/ai-brain' },
      { label: 'Human handoff', to: '/human-handoff' },
      // { label: 'Android app', to: '/android-app' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'AI customer support', to: '/ai-customer-support' },
      { label: 'Orders in chat', to: '/orders-in-chat' },
      { label: 'Appointment booking', to: '/appointment-booking' },
      { label: 'Lead capture', to: '/lead-capture' },
      { label: 'WhatsApp campaigns', to: '/whatsapp-campaigns' },
    ],
  },
  {
    title: 'Industries',
    links: [
      { label: 'Online shops and retail', to: '/ai-chat-for-online-shops' },
      { label: 'Restaurants and cafes', to: '/ai-chat-for-restaurants' },
      { label: 'Salons and beauty', to: '/ai-chat-for-salons' },
      { label: 'Car wash and auto services', to: '/ai-chat-for-auto-services' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', to: '/blogs' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'FAQs', to: '/faqs' },
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

// Set exact official social profile URLs in your .env file.
const socialLinks = [
  {
    label: 'Facebook',
    url: process.env.REACT_APP_BELLBEE_FACEBOOK_URL || '',
    Icon: FaFacebookF,
  },
  {
    label: 'Instagram',
    url: process.env.REACT_APP_BELLBEE_INSTAGRAM_URL || '',
    Icon: FaInstagram,
  },
  {
    label: 'LinkedIn',
    url: process.env.REACT_APP_BELLBEE_LINKEDIN_URL || '',
    Icon: FaLinkedinIn,
  },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">

        <div className="footer-main">

          {/* BRAND */}
          <div className="footer-brand">
            <Link
              to="/"
              className="footer-logo"
              aria-label="Bellbee Ai Home"
            >
              <img
                src="https://bellbee.ai/assets/darkbellbee.png"
                alt="Bellbee Ai"
                loading="lazy"
              />
            </Link>

            <p className="footer-brand-description">
              Conversations that work for your business.
              Smarter replies, better customer experiences.
            </p>

            <div className="footer-meta-badge">
              <ShieldCheck size={15} />
              <span>Verified Meta Tech Partner</span>
            </div>

            {/* SOCIAL MEDIA ICONS */}
            <div className="footer-socials">
              {socialLinks.map(({ label, url, Icon }) =>
                url ? (
                  <a
                    key={label}
                    href={url}
                    className="footer-social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Bellbee Ai on ${label}`}
                    title={label}
                  >
                    <Icon size={16} />
                  </a>
                ) : (
                  <span
                    key={label}
                    className="footer-social-link footer-social-disabled"
                    title={`Add your ${label} profile URL`}
                    aria-label={`${label} profile not configured`}
                  >
                    <Icon size={16} />
                  </span>
                )
              )}
            </div>

            <div className="footer-address">
              <span className="footer-address-icon">
                <MapPin size={16} />
              </span>
              <p>
                Office LG 08, Queen Plaza,
                Durand Road, Lahore, Pakistan
              </p>
            </div>

            <a
              href="mailto:info@bellbee.ai"
              className="footer-email"
            >
              <Mail size={15} />
              info@bellbee.ai
            </a>

            <Link
              to="/signup"
              className="footer-start-button"
            >
              <Sparkles size={15} />
              Start using free
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* FOOTER COLUMNS */}
          {footerGroups.map((group) => (
            <div
              className={`footer-column footer-column-${group.title.toLowerCase()}`}
              key={group.title}
            >
              <h3>{group.title}</h3>

              <ul>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>
                      <span>{link.label}</span>
                      <ArrowUpRight
                        size={13}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 Powered By Cybersol360 Ltd.
            All Rights Reserved.
          </p>

          <div className="footer-legal-links">
            <a
              href="https://cybersol360.com/terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>

            <span className="footer-legal-divider" />

            <a
              href="https://cybersol360.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          </div>

          <button
            type="button"
            className="footer-back-top"
            onClick={scrollToTop}
          >
            Back to top
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
}
