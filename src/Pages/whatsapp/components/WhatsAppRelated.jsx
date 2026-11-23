
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Headset,
  Megaphone,
  MessagesSquare,
} from 'lucide-react';

const relatedPages = [
  {
    title: 'One inbox',
    description:
      'Every channel in one place, with your team ready to step in.',
    to: '/omnichannel-messaging',
    icon: MessagesSquare,
    color: 'lavender',
  },
  {
    title: 'AI customer support',
    description:
      'Answers questions from your business information.',
    to: '/ai-customer-support',
    icon: Headset,
    color: 'yellow',
  },
  {
    title: 'WhatsApp campaigns',
    description:
      'Reach selected customers with approved messages.',
    to: '/whatsapp-campaigns',
    icon: Megaphone,
    color: 'coral',
  },
];

export default function WhatsAppRelated() {
  return (
    <section className="wa-section wa-related-section">
      <div className="wa-container">
        <div className="wa-section-heading wa-reveal">
          <span className="wa-kicker">
            KEEP EXPLORING
          </span>

          <h2>
            Explore what <em>comes next.</em>
          </h2>
        </div>

        <div className="wa-related-grid">
          {relatedPages.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.to}
                key={item.to}
                className="wa-related-card wa-reveal"
              >
                <span
                  className={`wa-feature-icon wa-icon-${item.color}`}
                >
                  <Icon size={23} />
                </span>

                <ArrowUpRight
                  className="wa-related-arrow"
                  size={20}
                />

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
