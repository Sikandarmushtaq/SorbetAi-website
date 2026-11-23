
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question:
      'Can my WhatsApp number get banned for using this AI?',
    answer:
      "The integration uses Meta's official Cloud API, but all messages and campaigns must still follow Meta's policies. No service can guarantee that an account will never be restricted.",
  },
  {
    question: 'Do I need a new phone number?',
    answer:
      'Not always. You can connect a new number, and eligible businesses may connect an existing WhatsApp Business app number through a supported Meta setup.',
  },
  {
    question: 'Can I keep using the WhatsApp Business app?',
    answer:
      "Eligible accounts can use Meta's supported coexistence setup. Availability and requirements depend on your business, number and Meta account configuration.",
  },
  {
    question: "Does the AI reply in my customer's language?",
    answer:
      'Yes, the assistant can be configured to understand and respond in supported languages. You can also set preferred languages and tone inside the AI Brain.',
  },
  {
    question: 'Can my team take over a chat?',
    answer:
      'Yes. Your team can open conversations in the inbox, pause the AI and reply manually whenever a human is needed.',
  },
  {
    question: 'Can I try it for free?',
    answer:
      'You can start with the available free credit. Any usage limits, channel requirements and plan conditions are shown during setup.',
  },
];

export default function WhatsAppFAQ() {
  return (
    <section className="wa-section wa-faq-section">
      <div className="wa-container wa-faq-layout">
        <div className="wa-faq-intro wa-reveal">
          <span className="wa-kicker">
            FREQUENTLY ASKED QUESTIONS
          </span>

          <h2>
            Got <em>questions?</em>
          </h2>

          <p>
            Everything you need to know before
            connecting your WhatsApp Business number.
          </p>
        </div>

        <div className="wa-faq-list">
          {faqs.map((faq) => (
            <details
              className="wa-faq-item wa-reveal"
              key={faq.question}
            >
              <summary>
                <span>{faq.question}</span>
                <ChevronDown
                  size={20}
                  aria-hidden="true"
                />
              </summary>

              <div className="wa-faq-answer">
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
