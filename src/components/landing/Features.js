
import './Features.css';

const features = [
  {
    title: 'Answer',
    description: 'Any hour, 95 languages',
    color: '#ff7a59',
  },
  {
    title: 'Sell',
    description: 'Catalog and orders in chat',
    color: '#cdbdff',
  },
  {
    title: 'Book',
    description: 'Calendar and reminders',
    color: '#f4c95d',
  },
  {
    title: 'Capture',
    description: 'Every enquiry is a lead',
    color: '#bfe0c8',
  },
  {
    title: 'Follow up',
    description: 'Campaigns and updates',
    color: '#ffb3a0',
  },
];

export default function Features() {
  return (
    <section id="features" className="features-section">

      {/* Section Heading */}
      <h2 className="features-title">
        Five jobs, one quiet teammate.
      </h2>

      {/* Horizontally Scrollable Feature Cards */}
      <div className="features-rail">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="feature-card"
            style={{ backgroundColor: feature.color }}
          >
            <h3>{feature.title}</h3>
            <small>{feature.description}</small>
          </article>
        ))}
      </div>

    </section>
  );
}
