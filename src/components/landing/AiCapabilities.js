
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './AiCapabilities.css';

gsap.registerPlugin(useGSAP);

const capabilities = [
  {
    number: '01',
    label: 'SALES AGENT',
    title: 'AI Sales Agent',
    description: 'Spots and closes the upsell.',
    color: '#ff7a59',
  },
  {
    number: '02',
    label: 'SUPPORT',
    title: 'AI Customer Support',
    description: 'Answers from your real policies.',
    color: '#cdbdff',
  },
  {
    number: '03',
    label: 'HUMAN HANDOFF',
    title: 'Human Handoff',
    description:
      "Your team steps in when a customer asks or the AI can't resolve it.",
    color: '#f4c95d',
  },
  {
    number: '04',
    label: 'MARKETING',
    title: 'WhatsApp Marketing',
    description: 'Self-learning broadcast campaigns.',
    tag: 'Self-Learning',
    color: '#bfe0c8',
  },
];

// Renders Bellbee AI capabilities in a compact card layout.
export default function AiCapabilities() {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const elements = sectionRef.current.querySelectorAll('.aic-reveal');

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

      gsap.to('.aic-blob', {
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
      id="ai-capabilities"
      className="ai-capabilities-section"
    >
      <div className="aic-container">

        {/* Background Decoration */}
        <div className="aic-blob" aria-hidden="true" />

        {/* Section Heading */}
        <div className="aic-heading aic-reveal">
          <span className="aic-eyebrow">
            <span /> AI CAPABILITIES
          </span>

          <h2>
            One AI, <span>every role</span> your team needs.
          </h2>

          <p>
            From answering questions to closing the sale,
            Bellbee Ai gets sharper with every conversation it handles.
          </p>
        </div>

        {/* Capability Cards */}
        <div className="aic-grid">
          {capabilities.map((item) => (
            <article
              key={item.number}
              className="aic-card aic-reveal"
              style={{ '--card-color': item.color }}
            >
              <div className="aic-card-top">
                <span className="aic-number">{item.number}</span>
                <span className="aic-star">✦</span>
              </div>

              <span className="aic-label">
                {item.label}
              </span>

              <h3>{item.title}</h3>

              <p>{item.description}</p>

              {item.tag && (
                <span className="aic-tag">
                  ✦ {item.tag}
                </span>
              )}
            </article>
          ))}
        </div>

        {/* Bottom Statement */}
        <div className="aic-bottom aic-reveal">
          <span className="aic-bottom-star">✦</span>
          <p>
            Gets more accurate with{' '}
            <span>every conversation.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
