import './FreePlanModal.css';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from './DashboardUI';
import { useFreePlan } from './FreePlanContext';

const benefits = [
  'Free. No card needed.',
  'It never expires.',
  '3M AI tokens in month 1, 2M in month 2, then 1M every month.',
  'Pause your AI any time, and reply to any chat yourself.',
];

export default function FreePlanModal() {
  const { isOpen, isStarting, error, closeFreePlan, startFreePlan } = useFreePlan();
  if (!isOpen) return null;

  return (
    <Modal
      title="Start your free plan"
      description="Your AI needs it to reply. It takes one click."
      onClose={closeFreePlan}
      footer={(
        <>
          <button type="button" className="dp-secondary-button" onClick={closeFreePlan} disabled={isStarting}>Not now</button>
          <button type="button" className="dp-primary-button" onClick={startFreePlan} disabled={isStarting}>
            {isStarting ? 'Starting…' : 'Start free plan'}
          </button>
        </>
      )}
    >
      <div className="dp-free-plan-benefits">
        {benefits.map((benefit) => (
          <div className="dp-free-plan-benefit" key={benefit}>
            <CheckCircle2 size={18} />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
      {error && <p className="dp-form-note dp-api-error" role="alert">{error}</p>}
    </Modal>
  );
}
