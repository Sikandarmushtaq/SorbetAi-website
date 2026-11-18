import {
  PageHeader,
  Panel,
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

import {
  ArrowUpRight,
  Globe,
  Package,
  Truck,
  Users,
} from 'lucide-react';

const addons = [
  {
    title: 'Store Integration',
    price: '£5 / month',
    description:
      'Connect WooCommerce or a custom store so orders and product data flow into Bellbee.',
    icon: Package,
  },
  {
    title: 'Courier Integrations',
    price: '£6 / month',
    description:
      'Connect supported courier services for shipment booking and delivery updates.',
    icon: Truck,
  },
  {
    title: 'Website Chat Widget',
    price: 'Free',
    description:
      'Embed a Bellbee-powered chat widget directly on your business website.',
    icon: Globe,
  },
  {
    title: 'Facebook & Instagram',
    price: 'Free',
    description:
      'Answer Facebook Messenger and Instagram messages with your AI assistant.',
    icon: Users,
  },
];

// Displays available add-ons and their frontend actions.
export default function AddonsPage() {
  const { showNotice, Notice } = useNotice();

  return (
    <>
      <PageHeader
        eyebrow="BILLING / ADD-ONS"
        title="Available add-ons"
        description="Extend Bellbee with additional integrations and customer channels."
      />

      {Notice}

      <div className="dp-addon-grid dp-addon-grid-four">
        {addons.map(({ title, price, description, icon: Icon }) => (
          <Panel className="dp-addon-card" key={title}>
            <span className="dp-addon-icon">
              <Icon size={21} />
            </span>

            <h3>{title}</h3>
            <strong>{price}</strong>
            <p>{description}</p>

            <button
              type="button"
              className="dp-secondary-button"
              onClick={() =>
                showNotice(
                  `${title} subscription will be available after billing integration.`
                )
              }
            >
              View details
              <ArrowUpRight size={14} />
            </button>
          </Panel>
        ))}
      </div>

      <section className="dp-support-cta">
        <div>
          <h3>Need a custom integration?</h3>
          <p>
            Talk to our team about connecting another system to your business.
          </p>
        </div>

        <button
          type="button"
          className="dp-primary-button"
          onClick={() =>
            showNotice(
              'Contact the sales team at sales@bellbee.ai to discuss a custom integration.'
            )
          }
        >
          Contact sales
        </button>
      </section>
    </>
  );
}