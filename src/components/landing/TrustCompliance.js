
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './TrustCompliance.css';

gsap.registerPlugin(useGSAP);

const trustPoints = [
  {
    number: '01',
    title: 'Official Cloud API',
    description:
      'Uses the official WhatsApp Business Platform (Cloud API).',
  },
  {
    number: '02',
    title: 'Free API Key',
    description:
      'Free official WhatsApp API key.',
  },
  {
    number: '03',
    title: 'Simple Connection',
    description:
      'Connect your number by signing in with Facebook.',
  },
];

// Animates the trust section and its decorative elements.
export default function TrustCompliance() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        '.tc-reveal',
        {
          y: 40,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.9,
          ease: 'back.out(1.4)',
        }
      );

      gsap.to('.tc-blob-coral', {
        rotate: 360,
        duration: 40,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.tc-blob-lavender', {
        y: -16,
        x: 10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.tc-floating-label', {
        y: -12,
        duration: 2.5,
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
      id="trust-compliance"
      className="trust-section"
    >
      <div className="trust-container">

        {/* Section Heading */}
        <div className="trust-heading tc-reveal">
          <span className="trust-eyebrow">
            <span className="trust-eyebrow-dot" />
            Trust & Compliance
          </span>

          <h2>
            Built on the official{' '}
            <span>WhatsApp Business API.</span>
          </h2>

          <p>
            Bellbee Ai connects through Meta's own platform,
            the way Meta intends businesses to use WhatsApp.
          </p>
        </div>

        {/* Main Trust Visual */}
        <div className="trust-main">

          {/* Left Trust Information */}
          <div className="trust-information">

            <div className="trust-information-label tc-reveal">
              Why official matters
            </div>

            <div className="trust-points">
              {trustPoints.map((point) => (
                <div
                  key={point.number}
                  className="trust-point tc-reveal"
                >
                  <span className="trust-number">
                    {point.number}
                  </span>

                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </div>

                  <span className="trust-arrow">↗</span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Visual Panel */}
          <div className="trust-visual tc-reveal">

            <div className="tc-blob-coral" />
            <div className="tc-blob-lavender" />

            {/* Floating Labels */}
            <div className="tc-floating-label tc-floating-top">
              Official Platform <span>✦</span>
            </div>

            <div className="tc-floating-label tc-floating-bottom">
              Free API Key <span>✦</span>
            </div>

            {/* API Card */}
            <div className="trust-api-card">

              <div className="trust-api-header">
                <span className="trust-meta">Meta</span>

                <span className="trust-official">
                  <span /> OFFICIAL
                </span>
              </div>

              <div className="trust-api-content">
                <div className="trust-whatsapp-mark">
                  W
                </div>

                <h3>WhatsApp</h3>
                <p>Business Platform</p>
              </div>

              <div className="trust-api-footer">
                <span>Official Cloud API</span>
                <span>✦</span>
              </div>

            </div>

            <div className="trust-facebook-chip">
              <span className="trust-facebook-icon">f</span>

              <div>
                <strong>Connect with Facebook</strong>
                <small>Sign in to connect your number</small>
              </div>

              <span className="trust-facebook-arrow">↗</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
