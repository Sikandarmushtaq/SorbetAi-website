
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';

import {
  ArrowUpRight,
  CheckCheck,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

import './BusinessCapabilities.css';

gsap.registerPlugin(useGSAP);

const capabilities = [
  {
    id: 'answer',
    label: 'Answer questions',
    heading: 'Answer questions',
    description: 'Answer every customer question, at any hour.',
    messages: [
      {
        sender: 'Customer',
        text: 'Hi, are you open on Sunday?',
        type: 'incoming',
      },
      {
        sender: 'Bellbee Ai',
        text: 'We are closed on Sundays, but open Monday to Saturday from 9am. Can I help with anything else?',
        type: 'outgoing',
      },
    ],
    linkLabel: 'See how it works: Answer questions',
    benefits: [
      'Answers from your own business info',
      "Replies in your customer's language",
      'Hands off to your team when needed',
    ],
    timestamp: 'CUSTOMER CONVERSATION',
  },
  {
    id: 'orders',
    label: 'Take orders',
    heading: 'Take orders right inside the chat',
    description: 'Take orders directly through customer conversations.',
    messages: [
      {
        sender: 'Customer',
        text: 'I would like to order two of these, please.',
        type: 'incoming',
      },
      {
        sender: 'Bellbee Ai',
        text: 'Done. Your order is placed, and you will get a message as soon as it is on its way.',
        type: 'outgoing',
      },
    ],
    linkLabel: 'See how it works: Take orders',
    benefits: [
      'Product catalog in the chat',
      'Order confirmation messages',
      'Courier tracking',
    ],
    timestamp: 'ORDER CONVERSATION',
  },
  {
    id: 'appointments',
    label: 'Book appointments',
    heading: 'Book appointments without the back and forth',
    description: 'Make appointment conversations simple and convenient.',
    messages: [
      {
        sender: 'Customer',
        text: 'Can I book something for Friday afternoon?',
        type: 'incoming',
      },
      {
        sender: 'Bellbee Ai',
        text: 'Friday at 3pm is free. Shall I book it for you?',
        type: 'outgoing',
      },
    ],
    linkLabel: 'See how it works: Book appointments',
    benefits: [
      'Built-in appointment calendar',
      'Reminder messages',
      'Easy rescheduling',
    ],
    timestamp: 'BOOKING CONVERSATION',
  },
  {
    id: 'leads',
    label: 'Capture leads',
    heading: 'Capture every enquiry as a lead',
    description: 'Turn customer enquiries into opportunities for your team.',
    messages: [
      {
        sender: 'Customer',
        text: 'Could someone send me a quote?',
        type: 'incoming',
      },
      {
        sender: 'Bellbee Ai',
        text: 'Of course. I have passed your request to the team, and they will get back to you here.',
        type: 'outgoing',
      },
    ],
    linkLabel: 'See how it works: Capture leads',
    benefits: [
      'Requests saved as leads',
      'Customer profiles built automatically',
      'Your team picks up from the inbox',
    ],
    timestamp: 'CUSTOMER ENQUIRY',
  },
  {
    id: 'follow-up',
    label: 'Follow up',
    heading: 'Follow up so no customer is forgotten',
    description: 'Keep conversations going with timely customer reminders.',
    messages: [
      {
        sender: 'Bellbee Ai',
        text: 'Reminder: your appointment is tomorrow at 3pm. Reply here if you need to change it.',
        type: 'outgoing',
      },
      {
        sender: 'Customer',
        text: 'Thanks, see you then!',
        type: 'incoming',
      },
    ],
    linkLabel: 'See how it works: Follow up',
    benefits: [
      'WhatsApp marketing campaigns',
      'Booking reminders',
      'Order updates',
    ],
    timestamp: 'FOLLOW-UP CONVERSATION',
  },
];

// Handles the visual entrance whenever a capability is selected.
function CapabilityAnimation({ activeId, panelRef }) {
  useGSAP(
    () => {
      const content = panelRef.current?.querySelector('.bc-content');
      const visual = panelRef.current?.querySelector('.bc-visual');

      if (!content || !visual) return;

      gsap.fromTo(
        [content, visual],
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );

      gsap.fromTo(
        '.bc-message',
        {
          scale: 0.85,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.35,
          delay: 0.25,
          duration: 0.65,
          transformOrigin: 'left bottom',
          ease: 'back.out(1.7)',
        }
      );
    },
    {
      dependencies: [activeId],
      scope: panelRef,
      revertOnUpdate: true,
    }
  );

  return null;
}

// Renders the interactive Bellbee AI business capabilities section.
export default function BusinessCapabilities() {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);

  const [activeId, setActiveId] = useState('answer');

  const activeCapability = capabilities.find(
    (item) => item.id === activeId
  );

  // Animates the organic background shapes and floating labels.
  useGSAP(
    () => {
      gsap.to('.bc-blob-coral', {
        rotate: 360,
        duration: 42,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.bc-blob-lavender', {
        y: -16,
        x: 10,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.bc-floating-label', {
        y: -12,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        stagger: 0.4,
        ease: 'sine.inOut',
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="business-capabilities"
      className="business-capabilities-section"
    >
      <div className="bc-container">

        {/* Section Heading */}
        <div className="bc-heading">
          <span className="bc-eyebrow">
            <span />
            WHAT BELLBEE AI CAN DO
          </span>

          <h2>
            What can Bellbee Ai do for{' '}
            <span>your business?</span>
          </h2>
        </div>

        {/* Interactive Capability Tabs */}
        <div
          className="bc-capability-list"
          role="tablist"
          aria-label="Bellbee AI capabilities"
        >
          {capabilities.map((capability) => (
            <button
              key={capability.id}
              type="button"
              role="tab"
              aria-selected={activeId === capability.id}
              aria-controls="business-capability-panel"
              className={`bc-capability-pill ${
                activeId === capability.id ? 'active' : ''
              }`}
              onClick={() => setActiveId(capability.id)}
            >
              {activeId === capability.id && (
                <Sparkles size={14} />
              )}

              {capability.label}
            </button>
          ))}
        </div>

        {/* Dynamic Capability Content */}
        <div
          ref={panelRef}
          id="business-capability-panel"
          className="bc-showcase"
          role="tabpanel"
          key={activeId}
        >
          <CapabilityAnimation
            activeId={activeId}
            panelRef={panelRef}
          />

          {/* Left Content */}
          <div className="bc-content">

            <span className="bc-brand">
              <span className="bc-brand-dot" />
              Bellbee Ai
            </span>

            <h3>{activeCapability.heading}</h3>

            <p className="bc-description">
              {activeCapability.description}
            </p>

            {/* Dynamic Benefits */}
            <div className="bc-benefits">
              {activeCapability.benefits.map((benefit) => (
                <div key={benefit}>
                  <span>
                    <CheckCheck size={16} />
                  </span>

                  <p>{benefit}</p>
                </div>
              ))}
            </div>

            {/* Navigate to Home How It Works */}
            <Link
              to="/#how-it-works"
              className="bc-link"
            >
              {activeCapability.linkLabel}
              <ArrowUpRight size={18} />
            </Link>

          </div>

          {/* Right Chat Visual */}
          <div className="bc-visual">

            {/* Organic Blobs */}
            <div className="bc-blob-coral" />
            <div className="bc-blob-lavender" />

            {/* Floating Labels */}
            <div className="bc-floating-label bc-floating-one">
              <MessageCircle size={15} />
              Customer conversations
            </div>

            <div className="bc-floating-label bc-floating-two">
              <Sparkles size={15} />
              Bellbee Ai
            </div>

            {/* Chat Window */}
            <div className="bc-chat-window">

              <div className="bc-chat-header">
                <div className="bc-chat-avatar">B✦</div>

                <div className="bc-chat-identity">
                  <strong>Bellbee Ai</strong>

                  <span>
                    <i />
                    AI teammate
                  </span>
                </div>

                <span className="bc-chat-online">
                  Online
                </span>
              </div>

              <div className="bc-chat-body">

                <div className="bc-chat-timestamp">
                  {activeCapability.timestamp}
                </div>

                {/* Dynamic Customer and AI Messages */}
                {activeCapability.messages.map((message, index) => (
                  <div
                    key={`${activeId}-${index}`}
                    className={`bc-message ${
                      message.type === 'incoming'
                        ? 'bc-customer-message'
                        : 'bc-ai-message'
                    }`}
                  >
                    <span>{message.sender}</span>

                    <p>{message.text}</p>

                    {message.type === 'outgoing' && (
                      <small>
                        <CheckCheck size={13} />
                        Delivered
                      </small>
                    )}
                  </div>
                ))}

              </div>

              <div className="bc-chat-footer">
                <span className="bc-footer-dot" />
                {activeCapability.label}
              </div>

            </div>

            {/* Visual Footer */}
            <div className="bc-visual-caption">
              <Sparkles size={15} />
              Every conversation matters.
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
