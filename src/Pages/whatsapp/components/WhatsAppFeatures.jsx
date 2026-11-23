
import {
  CalendarDays,
  Headset,
  Megaphone,
  MessageCircleMore,
  ShoppingBag,
} from 'lucide-react';

const features = [
  {
    icon: MessageCircleMore,
    color: 'lavender',
    title: 'Answers questions',
    description:
      "Answers using your business information, in your customer's language.",
  },
  {
    icon: ShoppingBag,
    color: 'coral',
    title: 'Takes orders',
    description:
      'Helps customers choose products and place orders directly in chat.',
  },
  {
    icon: CalendarDays,
    color: 'yellow',
    title: 'Books appointments',
    description:
      'Checks availability to book, move or cancel appointments.',
  },
  {
    icon: Megaphone,
    color: 'green',
    title: 'WhatsApp campaigns',
    description:
      'Reach opted-in customers with approved WhatsApp message templates.',
  },
  {
    icon: Headset,
    color: 'lavender',
    title: 'Human handoff',
    description:
      'Your team can take over when a customer needs personal attention.',
  },
];

export default function WhatsAppFeatures() {
  return (
    <section className="wa-section wa-features-section">
      <div className="wa-container">
        <div className="wa-section-heading wa-reveal">
          <span className="wa-kicker">
            WHAT IT DOES ON WHATSAPP
          </span>

          <h2>
            More than <em>just replies.</em>
          </h2>

          <p>
            From the first question to the next order
            or appointment, your AI helps the
            conversation move forward.
          </p>
        </div>

        <div className="wa-features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                className="wa-feature-card wa-reveal"
                key={feature.title}
              >
                <span
                  className={`wa-feature-icon wa-icon-${feature.color}`}
                >
                  <Icon size={22} />
                </span>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
