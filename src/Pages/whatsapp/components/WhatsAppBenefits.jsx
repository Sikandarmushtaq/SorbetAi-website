
import {
  Clock3,
  ShoppingBag,
  UsersRound,
} from 'lucide-react';

const benefits = [
  {
    icon: Clock3,
    color: 'lavender',
    title: 'Questions at any hour',
    description:
      'Customers message when you are closed. Your AI answers from your own business information.',
    number: '01',
  },
  {
    icon: ShoppingBag,
    color: 'coral',
    title: 'Orders and bookings in the same chat',
    description:
      'Customers can order products or book appointments without leaving WhatsApp.',
    number: '02',
  },
  {
    icon: UsersRound,
    color: 'yellow',
    title: 'One number, a team behind it',
    description:
      'Your team sees every conversation in one inbox and can take over whenever needed.',
    number: '03',
  },
];

export default function WhatsAppBenefits() {
  return (
    <section className="wa-section wa-benefits">
      <div className="wa-container">
        <div className="wa-section-heading wa-reveal">
          <span className="wa-kicker">
            WHAT IT HELPS WITH
          </span>

          <h2>
            Your customers message.
            <br />
            <em>Your business responds.</em>
          </h2>

          <p>
            Keep conversations moving, even when
            your team is busy.
          </p>
        </div>

        <div className="wa-benefits-grid">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="wa-benefit-card wa-reveal"
              >
                <div className="wa-card-top">
                  <span
                    className={`wa-feature-icon wa-icon-${item.color}`}
                  >
                    <Icon size={23} />
                  </span>

                  <span className="wa-card-number">
                    {item.number}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
