
import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight, Sparkles } from 'lucide-react';

import './Footer.css';

const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'How It Works', to: '/#how-it-works' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'Blog', to: '/blogs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'FAQs', to: '/#faqs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
];

// Displays the global website footer and navigation links.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">

        {/* Main Footer */}
        <div className="footer-main">

          {/* Brand and Address */}
          <div className="footer-brand">

            <Link to="/" className="footer-logo">
              Bellbee <span>Ai</span>
              <Sparkles size={19} />
            </Link>

            <p className="footer-brand-description">
              Conversations that work for your business.
              Smarter replies, better customer experiences.
            </p>

            <div className="footer-address">
              <span>
                <MapPin size={18} />
              </span>

              <p>
                Office LG 08, Queen Plaza,
                Durand Road, Lahore, Pakistan
              </p>
            </div>

          </div>

          {/* Footer Link Columns */}
          {footerGroups.map((group) => (
            <div className="footer-column" key={group.title}>

              <h3>{group.title}</h3>

              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>
                      {link.label}
                      <ArrowUpRight size={13} />
                    </Link>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

        {/* Bottom Footer */}
        <div className="footer-bottom">

          <p>
            © 2026 Powered By Cybersol360 Ltd.
            All Rights Reserved
          </p>

          <Link to="/#home" className="footer-back-top">
            Back to top
            <ArrowUpRight size={15} />
          </Link>

        </div>

      </div>
    </footer>
  );
}
