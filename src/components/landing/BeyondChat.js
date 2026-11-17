
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Truck,
  MessageSquare,
  Mic,
  Languages,
  PackageCheck,
} from 'lucide-react';

import './BeyondChat.css';

gsap.registerPlugin(useGSAP);

const integrations = [
  {
    title: 'Courier Sync',
    description: 'Courier integration for real-time order tracking.',
    icon: Truck,
    color: '#ff7a59',
  },
  {
    title: 'Web Widget',
    description: 'An official website chat widget.',
    icon: MessageSquare,
    color: '#cdbdff',
  },
  {
    title: 'Voice Notes',
    description: 'Understands voice messages, not just text.',
    icon: Mic,
    color: '#f4c95d',
  },
  {
    title: 'Multi-Language',
    description: "Replies in your customer's language.",
    icon: Languages,
    color: '#bfe0c8',
    badge: 'NEW',
  },
];

// Displays the ways Bellbee AI connects with business workflows.
export default function BeyondChat() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const elements = sectionRef.current.querySelectorAll('.beyond-reveal');

      gsap.fromTo(
        elements,
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'back.out(1.4)',
        }
      );

      gsap.to('.beyond-blob', {
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
      id="beyond-chat"
      className="beyond-section"
    >
      <div className="beyond-blob" aria-hidden="true" />

      <div className="beyond-container">

        {/* Section Heading */}
        <div className="beyond-heading beyond-reveal">
          <span className="beyond-eyebrow">
            <span /> BEYOND THE CHAT
          </span>

          <h2>
            Connected to how your business{' '}
            <span>actually runs.</span>
          </h2>

          <p>
            From order tracking to voice messages, Bellbee Ai
            fits into how your customers already like to talk to you.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="beyond-grid">
          {integrations.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="beyond-card beyond-reveal"
                style={{ '--beyond-card': item.color }}
              >
                <div className="beyond-card-top">
                  <div className="beyond-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>

                  {item.badge && (
                    <span className="beyond-badge">
                      {item.badge}
                    </span>
                  )}

                  {!item.badge && (
                    <span className="beyond-card-star">✦</span>
                  )}
                </div>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </article>
            );
          })}
        </div>

        {/* Order Confirmation Strip */}
        <div className="beyond-order beyond-reveal">
          <div className="beyond-order-icon">
            <PackageCheck size={21} strokeWidth={1.8} />
          </div>

          <p>
            Automatic order confirmation messages
          </p>

          <span className="beyond-order-star">✦</span>
        </div>

      </div>
    </section>
  );
}
