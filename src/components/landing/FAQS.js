
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import './FAQS.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const questions = [
  {
    question: 'How long does it take to set up Bellbee Ai?',
    answer:
      'About 10 minutes. You complete your profile, set up your AI Brain with your services, prices and FAQs, confirm your working hours, and test the replies yourself. Then you connect your WhatsApp Business number through the official Meta Cloud API, which takes about 2 minutes, and go live. No coding is needed, and Instagram and Messenger connect the same way.',
  },
  {
    question: 'Is there a free trial?',
  },
  {
    question: 'How much does Bellbee Ai cost?',
  },
  {
    question: 'Can my WhatsApp number get banned for using Bellbee Ai?',
  },
  {
    question: 'Is Bellbee Ai an official Meta partner?',
  },
  {
    question: 'Which channels does Bellbee Ai support?',
  },
  {
    question: 'When does a human take over from the Ai?',
  },
  {
    question: 'How fast does Bellbee Ai reply to customers?',
  },
  {
    question: 'What is the AI Brain?',
  },
  {
    question: 'Can Bellbee Ai book appointments and take orders in the chat?',
  },
  {
    question: 'Which languages does Bellbee Ai understand?',
  },
  {
    question: 'Do I need coding knowledge to use Bellbee Ai?',
  },
  {
    question: "Can we customize Bellbee Ai's tone of voice to match our brand?",
  },
];

// Displays the FAQ section with an expandable accordion.
export default function FAQs() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);

  useGSAP(
    () => {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.faq-reveal'),
        {
          y: 35,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  // Opens a question or closes the currently active question.
  const toggleQuestion = (index) => {
    setActiveIndex((previous) =>
      previous === index ? null : index
    );
  };

  return (
    <section
      ref={sectionRef}
      id="faqs"
      className="faqs-section"
    >
      <div className="faqs-container">

        {/* FAQ Heading */}
        <div className="faqs-heading faq-reveal">

          <span className="faqs-eyebrow">
            <span />
            FREQUENTLY ASKED QUESTIONS
          </span>

          <h2>
            Everything you need to know about{' '}
            <span>deploying Bellbee Ai.</span>
          </h2>

          <p>
            Have a question not answered here? Reach out
            and our team will get back to you.
          </p>

          <Link to="/contact" className="faqs-contact-link">
            Contact our team
            <ArrowUpRight size={17} />
          </Link>

        </div>

        {/* FAQ Accordion */}
        <div className="faqs-list">
          {questions.map((item, index) => {
            const isOpen = activeIndex === index;

            return (
              <article
                key={item.question}
                className={`faq-item faq-reveal ${
                  isOpen ? 'open' : ''
                }`}
              >

                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => toggleQuestion(index)}
                >
                  <span className="faq-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="faq-question-text">
                    {item.question}
                  </span>

                  <span className="faq-toggle">
                    <Plus size={19} />
                  </span>
                </button>

                {/* Expandable Answer */}
                <div
                  id={`faq-answer-${index}`}
                  className={`faq-answer-wrapper ${
                    isOpen ? 'expanded' : ''
                  }`}
                  aria-hidden={!isOpen}
                >
                  <div className="faq-answer-inner">
                    {item.answer ? (
                      <p>{item.answer}</p>
                    ) : (
                      <p className="faq-pending">
                        Answer to be added.
                      </p>
                    )}
                  </div>
                </div>

              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
