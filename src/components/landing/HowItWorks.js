
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  UserRound,
  Brain,
  Clock3,
  MessageCircle,
  Smartphone,
} from 'lucide-react';

import './HowItWorks.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const steps = [
  {
    id: 'profile',
    number: '01',
    title: 'Complete Your Profile',
    description:
      'Add your business name, industry and a short description. Your AI uses these details to introduce your business to customers.',
    icon: UserRound,
    previewTitle: 'Profile',
    previewSubtitle: 'Set up your business details',
    points: [
      {
        title: 'Business name & industry',
        description: 'The basics, filled in once.',
      },
      {
        title: 'Short description',
        description: 'What you do, in a sentence or two.',
      },
      {
        title: 'Used in every greeting',
        description: 'Customers know who they are talking to.',
      },
      {
        title: 'No-code setup',
        description: 'Fill in a few fields, no technical work.',
      },
    ],
  },
  {
    id: 'brain',
    number: '02',
    title: 'Set Up Your AI Brain',
    description:
      'Give Bellbee Ai the information it needs to understand your business, from services and pricing to policies and frequently asked questions.',
    icon: Brain,
    previewTitle: 'AI Brain',
    previewSubtitle: 'Tell the AI about your business',
    points: [
      {
        title: 'Trained on your business',
        description: 'Services, pricing, and policies.',
      },
      {
        title: 'Your tone of voice',
        description: 'Friendly or Professional, your choice.',
      },
      {
        title: 'Custom instructions',
        description: 'Rules the AI always follows.',
      },
      {
        title: 'Keeps improving',
        description: 'Gets sharper with every conversation.',
      },
    ],
  },
  {
    id: 'hours',
    number: '03',
    title: 'Confirm Your Working Hours',
    description:
      'Set your opening days and times from your dashboard so customers always receive accurate information about your availability.',
    icon: Clock3,
    previewTitle: 'Working Hours',
    previewSubtitle: 'Set your business availability',
    points: [
      {
        title: 'Opening days & times',
        description: 'Set them once from your dashboard.',
      },
      {
        title: 'Accurate answers',
        description: 'Customers always get the right timings.',
      },
      {
        title: 'Easy to update',
        description: 'Change them any time, like for holidays.',
      },
      {
        title: 'Replies around the clock',
        description: 'The AI still answers when you are closed.',
      },
    ],
  },
  {
    id: 'test',
    number: '04',
    title: 'Test Your AI Assistant',
    description:
      'Try real customer questions in your dashboard before publishing. Fine-tune the knowledge, tone and instructions until you are happy with the replies.',
    icon: MessageCircle,
    previewTitle: 'Test AI',
    previewSubtitle: 'Try a conversation before going live',
    points: [
      {
        title: 'Test before you go live',
        description: 'Try the AI yourself before publishing.',
      },
      {
        title: 'Real questions',
        description: 'Ask what your customers usually ask.',
      },
      {
        title: 'Fine-tune in minutes',
        description: 'Adjust knowledge, tone, or instructions.',
      },
      {
        title: 'Go live with confidence',
        description: 'Know exactly how it will reply.',
      },
    ],
  },
  {
    id: 'whatsapp',
    number: '05',
    title: 'Connect Your WhatsApp',
    description:
      'Link your WhatsApp Business number from your dashboard in about 2 minutes. Your AI is ready to reply to customers.',
    icon: Smartphone,
    previewTitle: 'Channels',
    previewSubtitle: 'Connect your messaging channel',
    points: [
      {
        title: 'Official API, not a workaround',
        description:
          'Uses the official WhatsApp Business Platform (Cloud API).',
      },
      {
        title: 'Signed in with Facebook',
        description:
          'Links your WhatsApp Business account directly.',
      },
      {
        title: 'About 2 minutes',
        description: 'No manual API keys needed.',
      },
      {
        title: 'Replies around the clock',
        description: '24 hours a day, every day.',
      },
    ],
  },
];

// Renders the visual dashboard preview for each setup step.
function StepPreview({ step }) {
  if (step.id === 'profile') {
    return (
      <div className="hiw-profile-preview">
        <div className="hiw-preview-heading">
          <div>
            <span>PROFILE SETUP</span>
            <h4>Profile</h4>
          </div>
          <span className="hiw-preview-mark">
            <UserRound size={18} />
          </span>
        </div>

        <div className="hiw-form-fields">
          <label>
            Business name
            <div>Your Brand</div>
          </label>

          <label>
            Industry
            <div>Salons & Beauty <ChevronDown size={15} /></div>
          </label>

          <label>
            Short description
            <div className="hiw-textarea-preview">
              Hair, nails and skincare in the city centre
            </div>
          </label>
        </div>

        <button type="button" className="hiw-preview-save">
          Save profile <Check size={16} />
        </button>
      </div>
    );
  }

  if (step.id === 'brain') {
    return (
      <div className="hiw-brain-preview">
        <div className="hiw-preview-heading">
          <div>
            <span>YOUR BUSINESS KNOWLEDGE</span>
            <h4>AI Brain</h4>
          </div>
          <span className="hiw-preview-mark">
            <Brain size={19} />
          </span>
        </div>

        <p className="hiw-preview-intro">
          Tell the AI about your business
        </p>

        <div className="hiw-brain-options">
          <span>Services & pricing</span>
          <span>Policies</span>
          <span>Frequently asked questions</span>
        </div>

        <button type="button" className="hiw-preview-save">
          Save & Train AI <Check size={16} />
        </button>
      </div>
    );
  }

  if (step.id === 'hours') {
    return (
      <div className="hiw-hours-preview">
        <div className="hiw-preview-heading">
          <div>
            <span>BUSINESS AVAILABILITY</span>
            <h4>Working Hours</h4>
          </div>
          <span className="hiw-preview-mark">
            <Clock3 size={19} />
          </span>
        </div>

        <div className="hiw-hours-list">
          <div>
            <strong>Mon – Fri</strong>
            <span>9:00 AM – 7:00 PM</span>
          </div>
          <div>
            <strong>Saturday</strong>
            <span>10:00 AM – 4:00 PM</span>
          </div>
          <div>
            <strong>Sunday</strong>
            <span className="hiw-closed">Closed</span>
          </div>
        </div>

        <button type="button" className="hiw-preview-save">
          Confirm hours <Check size={16} />
        </button>
      </div>
    );
  }

  if (step.id === 'test') {
    return (
      <div className="hiw-test-preview">
        <div className="hiw-preview-heading">
          <div>
            <span>ASSISTANT PREVIEW</span>
            <h4>Test AI</h4>
          </div>
          <span className="hiw-preview-mark">
            <MessageCircle size={19} />
          </span>
        </div>

        <div className="hiw-test-chat">
          <div className="hiw-test-customer">
            Are you open on Saturday?
          </div>

          <div className="hiw-test-ai">
            <span>Bellbee Ai</span>
            Yes! We're open Saturday from 10 AM to 4 PM.
            Would you like to book a slot?
          </div>
        </div>

        <div className="hiw-test-note">
          <span className="hiw-test-dot" />
          Test chat, not sent to customers
        </div>
      </div>
    );
  }

  return (
    <div className="hiw-whatsapp-preview">
      <div className="hiw-preview-heading">
        <div>
          <span>MESSAGING CHANNELS</span>
          <h4>Channels</h4>
        </div>
        <span className="hiw-preview-mark">
          <Smartphone size={19} />
        </span>
      </div>

      <div className="hiw-channel-card">
        <div className="hiw-channel-icon">W</div>

        <div className="hiw-channel-info">
          <strong>WhatsApp Business</strong>
          <span>+1 (555) 019-2938</span>
        </div>

        <span className="hiw-connected">
          <i /> Connected
        </span>
      </div>

      <div className="hiw-live-message">
        <span><Check size={15} /></span>
        <p>
          Your AI is live and ready to reply to customers.
        </p>
      </div>
    </div>
  );
}

// Controls the sticky step navigation and expandable step details.
export default function HowItWorks() {
  const sectionRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState([]);

  // Scrolls the right column to the selected step.
  const scrollToStep = (id, index) => {
    setActiveStep(index);

    document.getElementById(`hiw-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Toggles the additional information for an individual step.
  const toggleReadMore = (id) => {
    setExpandedSteps((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  useGSAP(
    () => {
      gsap.fromTo(
        '.hiw-left-reveal',
        {
          y: 35,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'back.out(1.4)',
        }
      );

      gsap.utils.toArray('.hiw-step-card').forEach((card) => {
        gsap.fromTo(
          card,
          {
            y: 45,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="how-it-works-section"
    >
      <div className="hiw-layout">

        {/* Sticky Left Side */}
        <aside className="hiw-sidebar">

          <div className="hiw-sidebar-inner">

            <div className="hiw-left-reveal hiw-eyebrow">
              <span /> HOW IT WORKS
            </div>

            <h2 className="hiw-left-reveal">
              Up and running in{' '}
              <span>five steps.</span>
            </h2>

            <p className="hiw-left-reveal hiw-intro">
              Set up your business, train your AI and connect
              WhatsApp. Everything you need to start
              handling customer conversations.
            </p>

            {/* Step Navigation */}
            <div className="hiw-step-navigation hiw-left-reveal">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  className={`hiw-nav-item ${
                    activeStep === index ? 'active' : ''
                  }`}
                  onClick={() => scrollToStep(step.id, index)}
                >
                  <span className="hiw-nav-number">
                    {step.number}
                  </span>

                  <span className="hiw-nav-title">
                    {step.title}
                  </span>

                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>

            <div className="hiw-sidebar-note hiw-left-reveal">
              <span>✦</span>
              No technical setup required
            </div>

          </div>
        </aside>

        {/* Scrollable Right Side */}
        <div className="hiw-steps-list">

          {steps.map((step, index) => {
            const isExpanded = expandedSteps.includes(step.id);

            return (
              <article
                key={step.id}
                id={`hiw-${step.id}`}
                className="hiw-step-card"
                data-step={step.id}
              >

                {/* Step Header */}
                <div className="hiw-card-header">
                  <span className="hiw-card-number">
                    STEP {step.number}
                  </span>

                  <span className="hiw-card-icon">
                    <step.icon size={19} strokeWidth={1.8} />
                  </span>
                </div>

                <h3>{step.title}</h3>

                <p className="hiw-card-description">
                  {step.description}
                </p>

                {/* Dashboard Preview */}
                <div className={`hiw-preview hiw-preview-${step.id}`}>
                  <StepPreview step={step} />
                </div>

                {/* Read More */}
                <div className="hiw-card-bottom">
                  <span>
                    {step.number} / 05
                  </span>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleReadMore(step.id)}
                    className="hiw-read-more"
                  >
                    {isExpanded ? 'Show less' : 'Read more'}

                    <ChevronDown
                      size={17}
                      className={isExpanded ? 'rotated' : ''}
                    />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="hiw-expanded-details">
                    {step.points.map((point) => (
                      <div
                        key={point.title}
                        className="hiw-detail-item"
                      >
                        <span className="hiw-detail-check">
                          <Check size={14} />
                        </span>

                        <div>
                          <strong>{point.title}</strong>
                          <p>{point.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </article>
            );
          })}

        </div>
      </div>
    </section>
  );
}
