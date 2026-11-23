
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import WhatsAppHero from './components/WhatsAppHero';
import WhatsAppBenefits from './components/WhatsAppBenefits';
import WhatsAppHowItWorks from './components/WhatsAppHowItWorks';
import WhatsAppFeatures from './components/WhatsAppFeatures';
import WhatsAppMetaIntegration from './components/WhatsAppMetaIntegration';
import WhatsAppRequirements from './components/WhatsAppRequirements';
import WhatsAppFAQ from './components/WhatsAppFAQ';
import WhatsAppRelated from './components/WhatsAppRelated';
import WhatsAppCTA from './components/WhatsAppCTA';

import './WhatsAppAIAgentPage.css';
import Footer from '../../components/Footer';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function WhatsAppAIAgentPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (reducedMotion) return;

      // Hero entrance
      gsap.fromTo(
        '.wa-hero-reveal',
        {
          y: 38,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'back.out(1.35)',
        }
      );

      // Entrance on scroll
      gsap.utils.toArray('.wa-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          {
            y: 28,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
              once: true,
            },
          }
        );
      });

      // Original Bellbee-style organic blob rotation
      gsap.to('.wa-blob', {
        rotation: 360,
        duration: 45,
        repeat: -1,
        ease: 'none',
      });

      // Floating labels
      gsap.to('.wa-floating-tag', {
        y: -11,
        duration: 2.7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.3,
      });
    },
    { scope: pageRef }
  );

  return (
    <main ref={pageRef} className="wa-page">
      <WhatsAppHero />
      <WhatsAppBenefits />
      <WhatsAppHowItWorks />
      <WhatsAppFeatures />
      <WhatsAppMetaIntegration />
      <WhatsAppRequirements />
      <WhatsAppFAQ />
      <WhatsAppRelated />
      <WhatsAppCTA />
      <Footer/>
    </main>
  );
}
