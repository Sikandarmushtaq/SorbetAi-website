
import {
  BrainCircuit,
  Link2,
  Rocket,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect your number',
    description:
      'Sign in with Facebook through Meta and select your WhatsApp Business number.',
  },
  {
    number: '02',
    icon: BrainCircuit,
    title: 'Teach your AI',
    description:
      'Add your services, products, opening hours and FAQs to your AI Brain.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Go live',
    description:
      'Your AI starts answering eligible messages, while your team follows chats in the inbox.',
  },
];

export default function WhatsAppHowItWorks() {
  return (
    <section
      className="wa-section wa-how-section"
      id="wa-how-it-works"
    >
      <div className="wa-container">
        <div className="wa-section-heading wa-reveal">
          <span className="wa-kicker">HOW IT WORKS</span>

          <h2>
            Three steps.
            <br />
            <em>One helpful AI teammate.</em>
          </h2>
        </div>

        <div className="wa-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="wa-step-card wa-reveal"
              >
                <span className="wa-step-number">
                  {step.number}
                </span>

                <div className="wa-step-icon">
                  <Icon size={24} />
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
