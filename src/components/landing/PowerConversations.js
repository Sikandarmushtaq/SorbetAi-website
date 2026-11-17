
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './PowerConversations.css';

gsap.registerPlugin(useGSAP);

const featureTabs = [
  'Ai Replies',
  'Human Handoff',
  'Appointment Booking',
  'Order Management',
  'AI Brain',
  'Conversation Analytics',
  'Customer Profiles',
];

const aiRepliesDescription =
  'Bellbee Ai answers customer messages instantly, day or night, across WhatsApp, Instagram, and Messenger, so nobody is left waiting on a reply.';

// Animates the selected feature content whenever its tab changes.
function FeatureContentAnimation({ activeFeature, panelRef }) {
  useGSAP(
    () => {
      const elements = panelRef.current?.querySelectorAll('.pc-enter');

      if (!elements?.length) return;

      gsap.fromTo(
        elements,
        {
          y: 35,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.8,
          ease: 'back.out(1.4)',
        }
      );
    },
    {
      dependencies: [activeFeature],
      scope: panelRef,
      revertOnUpdate: true,
    }
  );

  return null;
}

// Renders the interactive customer conversation feature showcase.
export default function PowerConversations() {
  const [activeFeature, setActiveFeature] = useState('Ai Replies');

  const sectionRef = useRef(null);
  const panelRef = useRef(null);

  // Animates the decorative blobs and floating channel labels.
  useGSAP(
    () => {
      gsap.to('.pc-orb-lavender', {
        rotate: 360,
        duration: 38,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.pc-orb-yellow', {
        rotate: -360,
        duration: 45,
        repeat: -1,
        ease: 'none',
      });

      gsap.to('.pc-floating-chip', {
        y: 'random(-14, 14)',
        x: 'random(-8, 8)',
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        stagger: 0.4,
        ease: 'sine.inOut',
      });
    },
    { scope: sectionRef }
  );

  const isAiReplies = activeFeature === 'Ai Replies';

  return (
    <section
      ref={sectionRef}
      id="power-conversations"
      className="power-conversations-section"
    >
      <div className="pc-container">

        {/* Section Heading */}
        <div className="pc-heading">
          <h2>
            Power every{' '}
            <span>customer conversation.</span>
          </h2>
        </div>

        {/* Feature Navigation */}
        <div
          className="pc-tabs"
          role="tablist"
          aria-label="Customer conversation features"
        >
          {featureTabs.map((feature, index) => (
            <button
              key={feature}
              type="button"
              role="tab"
              id={`pc-tab-${index}`}
              aria-selected={activeFeature === feature}
              aria-controls="pc-feature-panel"
              className={`pc-tab ${
                activeFeature === feature ? 'active' : ''
              }`}
              onClick={() => setActiveFeature(feature)}
            >
              {feature}
            </button>
          ))}
        </div>

        {/* Selected Feature Showcase */}
        <div
          ref={panelRef}
          id="pc-feature-panel"
          className="pc-showcase"
          role="tabpanel"
          aria-labelledby={`pc-tab-${featureTabs.indexOf(activeFeature)}`}
        >
          <FeatureContentAnimation
            activeFeature={activeFeature}
            panelRef={panelRef}
          />

          {/* Left Content */}
          <div className="pc-content pc-enter">

            <span className="pc-brand">Bellbee Ai</span>

            <h3>{activeFeature}</h3>

            {isAiReplies ? (
              <>
                <p className="pc-description">
                  {aiRepliesDescription}
                </p>

                <div className="pc-scenario">
                  <div className="pc-scenario-time">
                    <span className="pc-live-dot" />
                    2:14 AM · SHOP CLOSED
                  </div>

                  <p>
                    At 2:14 AM, with the shop closed, Bellbee Ai
                    replies to messages from WhatsApp, Instagram
                    and Messenger.
                  </p>
                </div>
              </>
            ) : (
              <p className="pc-description">
                The approved content for this feature will be
                added here.
              </p>
            )}
          </div>

          {/* Right Visual */}
          <div className="pc-visual pc-enter">

            {/* Background Organic Blobs */}
            <div className="pc-orb pc-orb-lavender" />
            <div className="pc-orb pc-orb-yellow" />

            {/* Floating Platform Labels */}
            <div className="pc-floating-chip pc-chip-whatsapp">
              WhatsApp <i />
            </div>

            <div className="pc-floating-chip pc-chip-instagram">
              Instagram <i />
            </div>

            <div className="pc-floating-chip pc-chip-messenger">
              Messenger <i />
            </div>

            {/* Chat Interface */}
            <div className="pc-chat-window">

              <div className="pc-chat-header">
                <div className="pc-avatar">B✦</div>

                <div className="pc-chat-identity">
                  <strong>Bellbee Ai</strong>
                  <span>
                    <i /> AI teammate
                  </span>
                </div>

                <span className="pc-chat-status">
                  Online
                </span>
              </div>

              <div className="pc-chat-body">

                <div className="pc-chat-date">
                  TODAY · 2:14 AM
                </div>

                <div className="pc-chat-message incoming">
                  <span>Customer</span>
                  <p>Incoming customer message</p>
                </div>

                <div className="pc-chat-message outgoing">
                  <span>Bellbee Ai</span>
                  <p>Instant reply sent</p>
                  <small>Just now · AI reply</small>
                </div>

                <div className="pc-chat-footer">
                  <span className="pc-live-dot" />
                  Bellbee Ai is responding
                </div>

              </div>

            </div>

            {/* Channel Availability */}
            <div className="pc-channel-footer">
              <span>WhatsApp</span>
              <span>Instagram</span>
              <span>Messenger</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
