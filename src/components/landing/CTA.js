
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';

import './CTA.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const benefits = [
  'Free Ai Tokens Monthly',
  '10-Minute Setup',
  'No Code Required',
];

// Displays the main website call-to-action section.
export default function CTA() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const elements = sectionRef.current.querySelectorAll('.cta-reveal');

      gsap.fromTo(
        elements,
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
            once: true,
          },
        }
      );

      gsap.to('.cta-blob-coral', {
        rotate: 360,
        duration: 42,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.cta-blob-lavender', {
        y: -15,
        x: 10,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="cta-section"
    >
      <div className="cta-panel">

        {/* Organic Background Shapes */}
        <div className="cta-blob-coral" />
        <div className="cta-blob-lavender" />

        <div className="cta-decoration">
          <Sparkles size={25} />
        </div>

        {/* CTA Content */}
        <div className="cta-content">

          <span className="cta-eyebrow cta-reveal">
            <span />
            READY TO UPGRADE YOUR MESSAGING?
          </span>

          <h2 className="cta-reveal">
            Stop losing customers to{' '}
            <span>slow replies.</span>
          </h2>

          <p className="cta-description cta-reveal">
            Start using Bellbee Ai free with monthly Ai tokens,
            no credit card needed, and answer your WhatsApp,
            Instagram, and Messenger customers around the clock.
          </p>

          {/* Benefits */}
          <div className="cta-benefits cta-reveal">
            {benefits.map((benefit) => (
              <div className="cta-benefit" key={benefit}>
                <span>
                  <Check size={14} strokeWidth={2.5} />
                </span>
                {benefit}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="cta-actions cta-reveal">

            <a
              href="https://app.bellbee.ai/register"
              className="cta-button cta-primary"
            >
              Start Using Free
              <ArrowUpRight size={18} />
            </a>

            <a
              href="https://bellbee.ai/contact#contact-form"
              className="cta-button cta-secondary"
            >
              Contact us
              <ArrowUpRight size={18} />
            </a>

          </div>

          {/* Footer Note */}
          <div className="cta-footer cta-reveal">
            <span className="cta-footer-dot" />
            <span>Official WhatsApp Business Platform</span>
            <span className="cta-footer-separator">•</span>
            <span>Live in about 10 minute</span>
          </div>

        </div>
      </div>
    </section>
  );
}
