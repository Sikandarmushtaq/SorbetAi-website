
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, ArrowUpRight, Sparkles } from 'lucide-react';

import './Pricing.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const includedFeatures = [
  'One inbox for WhatsApp, Instagram, Facebook and website chat',
  'Free official WhatsApp API key',
  "AI Brain, trained on your business's own info",
  'Orders and product catalog, right in the chat',
  'Built-in appointment calendar',
  'WhatsApp marketing campaigns',
  'Handoff to a human, inside the Bellbee inbox',
  'Analytics for chats, AI replies, orders and bookings',
];

const customFeatures = [
  'AI token limits sized to your volume',
  'Help connecting your website or online store',
];

// Displays the two Bellbee AI pricing plans.
export default function Pricing() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.pricing-reveal'),
        {
          y: 35,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
            once: true,
          },
        }
      );

      gsap.to('.pricing-blob', {
        rotate: 360,
        duration: 45,
        repeat: -1,
        ease: 'none',
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="pricing-section"
    >
      <div className="pricing-container">

        {/* Decorative Background */}
        <div className="pricing-blob" />

        {/* Section Heading */}
        <div className="pricing-heading pricing-reveal">
          <span className="pricing-eyebrow">
            <span />
            TRANSPARENT PRICING
          </span>

          <h2>
            One plan with everything,{' '}
            <span>or one built for you.</span>
          </h2>

          <p>
            Start using Bellbee Ai free, with free AI tokens
            every month. No credit card required to start.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">

          {/* All In One Plan */}
          <article className="pricing-card pricing-main-card pricing-reveal">

            <div className="pricing-card-header">
              <span className="pricing-plan-label">
                EVERYTHING INCLUDED
              </span>

              <span className="pricing-popular">
                <Sparkles size={13} />
                ALL IN ONE
              </span>
            </div>

            <h3>All in One</h3>

            <p className="pricing-card-description">
              Everything you need to automate WhatsApp,
              Instagram and Messenger.
            </p>

            {/* Price */}
            <div className="pricing-price">
              <strong>£49</strong>

              <div>
                <span>/ month</span>
                <small>+ card fee</small>
              </div>
            </div>

            <p className="pricing-billing">
              Billed monthly. The card fee is added at checkout,
              where you see the total before you pay.
            </p>

            {/* Early Bird Offer */}
            <div className="pricing-early-bird">
              <Sparkles size={17} />
              <span>
                Early bird: <strong>49% off</strong> for your
                first 24 months
              </span>
            </div>

            {/* Included Features */}
            <div className="pricing-included">
              <h4>What's included:</h4>

              <ul>
                {includedFeatures.map((feature) => (
                  <li key={feature}>
                    <span>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="https://app.bellbee.ai/register"
              className="pricing-button pricing-button-primary"
            >
              Start Using Free
              <ArrowUpRight size={18} />
            </a>

            <p className="pricing-footer-note">
              No credit card needed <i /> Cancel anytime
            </p>

          </article>

          {/* Custom Plan */}
          <article className="pricing-card pricing-custom-card pricing-reveal">

            <div className="pricing-card-header">
              <span className="pricing-plan-label">
                MADE FOR YOUR BUSINESS
              </span>

              <span className="pricing-custom-mark">
                ✦
              </span>
            </div>

            <h3>Custom</h3>

            <p className="pricing-card-description">
              For multi-location businesses, high volumes
              and custom integrations.
            </p>

            <div className="pricing-custom-price">
              <strong>Let's talk</strong>
              <span>Pricing built around your setup</span>
            </div>

            <div className="pricing-custom-divider" />

            <div className="pricing-included">
              <h4>Everything in All in One, plus:</h4>

              <ul>
                {customFeatures.map((feature) => (
                  <li key={feature}>
                    <span>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Custom CTA */}
            <a
              href="https://bellbee.ai/contact#contact-form"
              className="pricing-button pricing-button-outline"
            >
              Contact us
              <ArrowUpRight size={18} />
            </a>

            <p className="pricing-custom-note">
              Tell us what you need and we'll put it together.
            </p>

          </article>

        </div>
      </div>
    </section>
  );
}
