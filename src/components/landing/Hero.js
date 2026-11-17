
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './Hero.css';

gsap.registerPlugin(useGSAP);

// Runs the original Sorbet hero entrance and continuous animations.
export default function Hero() {
  const heroRef = useRef(null);

  useGSAP(
    () => {
      const hero = heroRef.current;

      const animatedElements = hero.querySelectorAll('.hero-reveal');
      const floatingLabels = hero.querySelectorAll('.hero-channel');
      const blobs = hero.querySelectorAll('.hero-blob');
      const chatMessages = hero.querySelectorAll('.hero-chat-card p');

      // Main entrance animation
      gsap.fromTo(
        animatedElements,
        {
          y: 40,
          opacity: 0,
          rotate: 1.5,
        },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          stagger: 0.09,
          duration: 0.9,
          ease: 'back.out(1.4)',
        }
      );

      // Floating WhatsApp, Instagram and Messenger labels
      gsap.to(floatingLabels, {
        y: 'random(-16, 16)',
        x: 'random(-10, 10)',
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.4,
      });

      // Continuously rotating organic background blobs
      gsap.to(blobs, {
        rotate: 360,
        duration: 40,
        repeat: -1,
        ease: 'none',
      });

      // Sequential chat message animations
      gsap.from(chatMessages, {
        scale: 0.6,
        opacity: 0,
        stagger: 0.8,
        delay: 0.8,
        transformOrigin: 'left bottom',
        ease: 'back.out(2)',
      });
    },
    { scope: heroRef }
  );

  return (
    <section ref={heroRef} id="home" className="hero-section">

      {/* Organic background blobs */}
      <div
        className="hero-blob hero-blob-lavender"
        aria-hidden="true"
      />

      <div
        className="hero-blob hero-blob-yellow"
        aria-hidden="true"
      />

      {/* Hero content */}
      <div className="hero-main">

        <h1 className="hero-title hero-reveal">
          Chats that <span>sell</span> themselves.
        </h1>

        <p className="hero-lead hero-reveal">
          An AI teammate for WhatsApp, Instagram and Messenger.
          It answers, books, takes orders and hands off to you
          the second a human is needed.
        </p>

        {/* Hero buttons */}
        <div className="hero-actions hero-reveal">
          <a href="#signup" className="hero-button hero-button-primary">
            Start free
          </a>

          <a href="#dash" className="hero-button hero-button-outline">
           Contact sales
          </a>
        </div>

      </div>

      {/* Floating channel labels */}
      <div className="hero-channel hero-channel-whatsapp">
        WhatsApp
        <i />
      </div>

      <div className="hero-channel hero-channel-instagram">
        Instagram
        <i />
      </div>

      <div className="hero-channel hero-channel-messenger">
        Messenger
        <i />
      </div>

      {/* AI conversation preview */}
      <div className="hero-chat-card hero-reveal">

        <p>Can I book Saturday at 4?</p>

        <p className="hero-chat-ai">
          Done — Sat 4:00 pm, with a reminder on Friday.
        </p>

        <p>Thanks!</p>

      </div>

    </section>
  );
}
