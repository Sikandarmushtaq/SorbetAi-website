import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

// Collects customer information before starting a conversation.
export default function ChatbotForm({ onStartChat }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [isStarting, setIsStarting] = useState(false);

  // Updates an individual customer form field.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));
  };

  // Validates the form and starts the conversation.
 // Validates the customer details and starts the conversation.
const handleSubmit = (event) => {
  event.preventDefault();

  const newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = 'Please enter your name.';
  }

  if (!formData.phone.trim()) {
    newErrors.phone = 'Please enter your phone number.';
  } else if (!/^[+]?[0-9\s()-]{7,20}$/.test(formData.phone.trim())) {
    newErrors.phone = 'Please enter a valid phone number.';
  }

  if (
    formData.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
  ) {
    newErrors.email = 'Please enter a valid email address.';
  }

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) return;

  setIsStarting(true);

  onStartChat({
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim(),
  });
};

  return (
    <div className="chatbot-form-body">

      {/* Offline Notice */}
      <div className="chatbot-offline-notice">
        Our team is offline right now, but our assistant can
        reply straight away.
      </div>

      {/* Form Introduction */}
      <div className="chatbot-form-intro">
        <h3>Hi! How can we help you today?</h3>
        <p>Tell us a bit about yourself to start chatting.</p>
      </div>

      {/* Customer Form */}
      <form className="chatbot-customer-form" onSubmit={handleSubmit}>

        <label className="chatbot-field">
          <span>Name</span>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            autoComplete="name"
            required
          />

          {errors.name && (
            <small className="chatbot-field-error">
              {errors.name}
            </small>
          )}
        </label>

        <label className="chatbot-field">
          <span>Phone number</span>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number, with country code"
            autoComplete="tel"
            required
          />

          {errors.phone && (
            <small className="chatbot-field-error">
              {errors.phone}
            </small>
          )}
        </label>

        <label className="chatbot-field">
          <span>
            Email <small>(optional)</small>
          </span>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          {errors.email && (
            <small className="chatbot-field-error">
              {errors.email}
            </small>
          )}
        </label>

        {/* Verification Placeholder */}
        <div className="chatbot-verification">
          <div className="chatbot-verification-mark">
            <ShieldCheck size={21} />
          </div>

          <div>
            <strong>Verification</strong>
            <span>Verification integration goes here.</span>
          </div>

          <span className="chatbot-verification-letter">S</span>
        </div>

        <button
          type="submit"
          className="chatbot-start-button"
          disabled={isStarting}
        >
          {isStarting ? 'Starting...' : 'Start Chat'}
        </button>

      </form>
    </div>
  );
}