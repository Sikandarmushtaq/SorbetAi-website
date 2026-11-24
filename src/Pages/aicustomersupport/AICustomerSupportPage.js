import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, ArrowUpRight, BellRing, Bot, BookOpen, BriefcaseBusiness,
  Check, CheckCircle2, ChevronDown, Clock3, FileText, Globe2,
  Headphones, Languages, MessageCircle, MessageSquare, MessagesSquare,
  Package, PhoneCall, Search, ShieldCheck, Sparkles, UserRound, Users,
  Zap, ClipboardList, Image as ImageIcon, BarChart3,
} from "lucide-react";
import "./AICustomerSupportPage.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const benefits = [
  { icon: MessagesSquare, tone: "lavender", title: "The same questions, again and again", description: "Your AI answers common questions directly from your own business information." },
  { icon: Clock3, tone: "yellow", title: "Questions outside office hours", description: "Give customers helpful answers 24 hours a day, even when your team is away." },
  { icon: UserRound, tone: "coral", title: "A customer wants a person", description: "Your AI can hand the conversation to your team when human support is needed." },
];

const steps = [
  { number: "01", icon: BookOpen, title: "Add your business information", description: "Add your services, products, hours, frequently asked questions and documents." },
  { number: "02", icon: Bot, title: "Your AI answers", description: "On the channels you connect, the AI responds using the information you provide." },
  { number: "03", icon: Users, title: "Your team steps in", description: "When the customer needs a person, the conversation can be handed to your team." },
];

const knowledge = [
  { icon: Package, tone: "lavender", title: "Services and products", description: "What you sell and offer, explained in your own words." },
  { icon: Clock3, tone: "yellow", title: "Hours and staff", description: "When you're open, plus each team member's hours and days off." },
  { icon: MessageCircle, tone: "coral", title: "FAQs and answers", description: "The questions customers ask most and the answers you want to give." },
  { icon: FileText, tone: "green", title: "Documents", description: "Upload supporting documents so your AI can find useful answers from them." },
  { icon: Globe2, tone: "lavender", title: "Your website", description: "Review information found on your website before it's saved to your knowledge." },
];

const leadFeatures = [
  { icon: ClipboardList, title: "You define the requests", description: "Set up to 20 enquiry types, each with up to 15 details to collect." },
  { icon: MessagesSquare, title: "Your AI collects the details", description: "It asks for what's missing over multiple messages and uses the number from the chat." },
  { icon: ImageIcon, title: "Photos count too", description: "A customer's photo can be collected as one of the enquiry details." },
  { icon: BellRing, title: "You're told when it's complete", description: "Get a New lead alert once the required details are collected." },
];

const controlItems = [
  { icon: Search, title: "See what it knows", description: "Review everything in one place, and edit or remove individual items." },
  { icon: MessageSquare, title: "Answer once", description: "Find unanswered questions and save your answer as a new FAQ." },
  { icon: UserRound, title: "Hand over to your team", description: "Take over any conversation from the Bellbee inbox when a person is needed." },
  { icon: BarChart3, title: "Understand your results", description: "See chat activity, AI replies and outcomes inside the app." },
];

const faqs = [
  { question: "What can the AI answer?", answer: "It can answer questions about the services, products, business hours, staff, FAQs, documents and other business details you have provided." },
  { question: "How do I teach it about my business?", answer: "Add your information in AI Brain, including services, hours, FAQs and documents. The AI Assistant can also help you set up and maintain that information." },
  { question: "Can it use my documents?", answer: "Bellbee's customer-support experience is designed to use the business documents you add. You should review your information and keep it updated." },
  { question: "What if the AI cannot answer?", answer: "The AI can hand the chat to your team when it cannot resolve the customer's question or the customer requests a person." },
  { question: "Does it reply in my customer's language?", answer: "Yes. Bellbee AI is designed to answer in the customer's language, using your own business information." },
  { question: "Does it work at night?", answer: "Yes. The AI can reply at any hour on a channel where it is connected and switched on." },
  { question: "Can I see what the AI knows?", answer: "Yes. The What AI Knows screen brings your saved information together so you can review, edit or delete it." },
];

const related = [
  { icon: Sparkles, title: "AI Assistant", description: "Set up your AI through a conversation, with approval for changes.", to: "/ai-assistant" },
  { icon: Globe2, title: "Channels", description: "Keep your connected customer channels in one inbox.", to: "/omnichannel-messaging" },
  { icon: Package, title: "Orders in chat", description: "Take orders from your product catalog inside a conversation.", to: "/orders-in-chat" },
];

const sampleReplies = [
  { label: "Opening hours", question: "What time do you open?", answer: "We're open Monday to Friday, from 9 AM to 6 PM. Would you like help with anything else?", tag: "Answered from business hours", human: false },
  { label: "Your services", question: "What services do you offer?", answer: "We offer Express Cleaning, Deep Cleaning and Interior Care. I can explain any of these services.", tag: "Answered from services", human: false },
  { label: "Talk to a person", question: "Can I speak with someone?", answer: "Of course. I'll hand this conversation to our team so a person can help you.", tag: "Human handoff requested", human: true },
];

function SectionHeading({ eyebrow, title, accent, description, center = false }) {
  return (
    <div className={`acs-heading acs-reveal ${center ? "acs-heading--center" : ""}`}>
      <span className="acs-kicker">{eyebrow}</span>
      <h2>{title} {accent && <em>{accent}</em>}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureCard({ item }) {
  const Icon = item.icon;
  return (
    <article className="acs-card acs-reveal">
      <span className={`acs-card-icon acs-tone-${item.tone || "lavender"}`}><Icon size={23} /></span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </article>
  );
}

function SupportDemo() {
  const [selected, setSelected] = useState(0);
  const item = sampleReplies[selected];
  return (
    <div className="acs-demo" aria-label="Interactive AI customer support example">
      <header className="acs-demo-top">
        <div className="acs-demo-brand"><span><Bot size={19} /></span><div><strong>Bellbee AI</strong><small>Customer support preview</small></div></div>
        <span className="acs-demo-live"><i /> DEMO</span>
      </header>
      <div className="acs-demo-body">
        <div className="acs-demo-day">Today</div>
        <div className="acs-demo-message acs-demo-message--customer"><span>Customer</span>{item.question}</div>
        <div className="acs-demo-message acs-demo-message--ai"><span><Sparkles size={13} /> Bellbee AI</span>{item.answer}</div>
        <div className={`acs-demo-result ${item.human ? "acs-demo-result--handoff" : ""}`}>
          {item.human ? <BellRing size={17} /> : <CheckCircle2 size={17} />}
          <strong>{item.tag}</strong>
        </div>
      </div>
      <div className="acs-demo-choose">
        <span>Try a sample customer question</span>
        <div>{sampleReplies.map((sample, index) => (
          <button key={sample.label} type="button" className={selected === index ? "active" : ""} aria-pressed={selected === index} onClick={() => setSelected(index)}>{sample.label}</button>
        ))}</div>
      </div>
      <footer className="acs-demo-foot"><ShieldCheck size={15} /> Sample messages only — no live AI connection</footer>
    </div>
  );
}

function LeadBoard() {
  const stages = ["New", "In progress", "Contacted", "Won", "Lost"];
  const [stage, setStage] = useState("New");
  return (
    <div className="acs-lead-board acs-reveal">
      <header><div><span className="acs-lead-board-icon"><PhoneCall size={21} /></span><div><strong>Customer enquiries</strong><small>Example follow-up board</small></div></div><span className="acs-example-label">DEMO</span></header>
      <div className="acs-lead-columns" role="group" aria-label="Change example lead stage">
        {stages.map((name) => <button type="button" key={name} className={stage === name ? "active" : ""} aria-pressed={stage === name} onClick={() => setStage(name)}>{name}</button>)}
      </div>
      <div className="acs-lead-ticket">
        <div className="acs-lead-ticket-head"><span><BriefcaseBusiness size={16} /> Callback request</span><span className={`acs-lead-status ${stage === "Won" ? "won" : stage === "Lost" ? "lost" : ""}`}>{stage}</span></div>
        <h3>Sarah Carter</h3>
        <p>Interested in a quote for weekly cleaning.</p>
        <div className="acs-lead-detail"><CheckCircle2 size={15} /><span>Phone number collected</span></div>
        <div className="acs-lead-detail"><CheckCircle2 size={15} /><span>Service and preferred time collected</span></div>
        <div className="acs-lead-detail"><CheckCircle2 size={15} /><span>Request ready for follow-up</span></div>
        <div className="acs-lead-note"><strong>Private note</strong><p>Contact customer about availability.</p></div>
      </div>
      <footer>Choose a stage above to preview how follow-ups are organized.</footer>
    </div>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div className="acs-faq-list">
      {faqs.map(({ question, answer }, index) => (
        <div className={`acs-faq-item ${openIndex === index ? "active" : ""}`} key={question}>
          <button type="button" aria-expanded={openIndex === index} aria-controls={`acs-faq-${index}`} onClick={() => setOpenIndex(openIndex === index ? -1 : index)}>
            {question}<ChevronDown size={20} />
          </button>
          <div id={`acs-faq-${index}`} hidden={openIndex !== index}><p>{answer}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function AICustomerSupportPage() {
  const pageRef = useRef(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(".acs-blob", { rotation: 360, duration: 54, repeat: -1, ease: "none", stagger: 4 });
    gsap.to(".acs-blob", { x: 16, y: -12, duration: 6.5, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 1 });
    gsap.to(".acs-float", { y: -9, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.45 });
    gsap.utils.toArray(".acs-reveal").forEach((element) => {
      gsap.from(element, { opacity: 0, y: 28, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: element, start: "top 92%", once: true } });
    });
  }, { scope: pageRef });

  return (
    <main className="acs-page" ref={pageRef}>
      {/* HERO */}
      <section className="acs-hero">
        <span className="acs-blob acs-blob--lavender" aria-hidden="true" />
        <span className="acs-blob acs-blob--yellow" aria-hidden="true" />
        <div className="acs-container acs-hero-grid">
          <div className="acs-hero-copy">
            <span className="acs-hero-label"><Headphones size={17} /> AI CUSTOMER SUPPORT</span>
            <h1>Helpful answers. <em>Every time your customers ask.</em></h1>
            <p>Bellbee AI answers customer questions from your own business information, at any hour and in your customer's language. When a person is needed, your team can take over.</p>
            <div className="acs-hero-actions">
              <Link className="acs-btn acs-btn-coral" to="/signup">Start with free credit <ArrowRight size={17} /></Link>
              <a className="acs-btn acs-btn-outline" href="#acs-how-it-works">See how it works</a>
            </div>
            <div className="acs-trust"><span><CheckCircle2 size={16} /> Available day and night</span><span><Languages size={16} /> Customer's language</span><span><Users size={16} /> Human backup</span></div>
          </div>
          <div className="acs-hero-visual">
            <span className="acs-float acs-float-top"><Zap size={16} /> Answers from your business info</span>
            <SupportDemo />
            <span className="acs-float acs-float-bottom"><Check size={16} /> Your team stays in control</span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="acs-section">
        <div className="acs-container">
          <SectionHeading eyebrow="WHAT IT HELPS WITH" title="Support your customers." accent="Even when you're busy." description="Common questions get useful answers while your team focuses on what needs a human." />
          <div className="acs-grid acs-grid-3">{benefits.map((item) => <FeatureCard key={item.title} item={item} />)}</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="acs-how-it-works" className="acs-section acs-section--light">
        <div className="acs-container">
          <SectionHeading eyebrow="HOW IT WORKS" title="Three simple steps." accent="One helpful AI." description="Add information, connect your channels, and let your team step in when needed." />
          <div className="acs-grid acs-grid-3">
            {steps.map((step) => { const Icon = step.icon; return (
              <article className="acs-card acs-step acs-reveal" key={step.number}><span className="acs-step-number">{step.number}</span><span className="acs-card-icon"><Icon size={23} /></span><h3>{step.title}</h3><p>{step.description}</p></article>
            ); })}
          </div>
        </div>
      </section>

      {/* WHAT AI KNOWS */}
      <section className="acs-section">
        <div className="acs-container acs-two-col acs-knowledge-layout">
          <div>
            <SectionHeading eyebrow="WHAT YOUR AI KNOWS" title="Your business information." accent="Not a template." description="Everything comes from what you add and manage inside Bellbee." />
            <div className="acs-knowledge-list">
              {knowledge.map(({ icon: Icon, tone, title, description }) => <article className="acs-knowledge-row acs-reveal" key={title}><span className={`acs-card-icon acs-tone-${tone}`}><Icon size={20} /></span><div><h3>{title}</h3><p>{description}</p></div></article>)}
            </div>
          </div>
          <div className="acs-knowledge-visual acs-reveal">
            <img src="https://bellbee.ai/assets/what-ai-knows-CDtXIhoZ.webp" alt="Bellbee What AI Knows dashboard showing FAQs, services, products, documents, website and team" loading="lazy" />
            <div className="acs-knowledge-caption"><CheckCircle2 size={16} /> What AI Knows — review and edit in one place</div>
          </div>
        </div>
      </section>

      {/* LEADS / ENQUIRIES */}
      <section className="acs-section acs-section--light">
        <div className="acs-container acs-two-col acs-leads-layout">
          <div>
            <SectionHeading eyebrow="ENQUIRIES THAT NEED FOLLOW-UP" title="Turn questions into." accent="Useful leads." description="For quotes, callbacks and other enquiries that aren't orders or bookings, your AI can collect details for your team." />
            <div className="acs-mini-list">
              {leadFeatures.map(({ icon: Icon, title, description }) => <article className="acs-mini-row acs-reveal" key={title}><span className="acs-mini-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{description}</p></div></article>)}
            </div>
          </div>
          <LeadBoard />
        </div>
      </section>

      {/* CONTROL */}
      <section className="acs-section">
        <div className="acs-container">
          <SectionHeading eyebrow="STAY IN CONTROL" title="Your business knowledge." accent="Your decisions." description="See what your AI knows, handle unanswered questions, and let a person take over whenever necessary." />
          <div className="acs-grid acs-grid-4">{controlItems.map((item, index) => <FeatureCard key={item.title} item={{ ...item, tone: ["lavender", "yellow", "coral", "green"][index] }} />)}</div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="acs-section acs-section--light">
        <div className="acs-container">
          <SectionHeading eyebrow="BEFORE YOU START" title="Simple requirements." accent="Clear limits." />
          <div className="acs-grid acs-grid-2 acs-info-grid">
            <article className="acs-info-card acs-reveal"><h3><CheckCircle2 size={22} /> What you need</h3><ul><li>A Bellbee account on the web or Android.</li><li>At least one connected channel: WhatsApp, Instagram, Messenger or website chat.</li><li>Your own business information, added by you or with the AI Assistant.</li></ul></article>
            <article className="acs-info-card acs-info-card--yellow acs-reveal"><h3><ShieldCheck size={22} /> What it does not do</h3><ul><li>It does not know details you haven't provided.</li><li>Your information needs to stay accurate and up to date.</li><li>It does not replace your team. A person can take over any chat.</li></ul></article>
          </div>
          <p className="acs-centered-note"><Users size={18} /> Human handoff is available when a customer asks or AI cannot resolve a question.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="acs-section">
        <div className="acs-container acs-faq-container">
          <SectionHeading eyebrow="FREQUENTLY ASKED QUESTIONS" title="Questions about." accent="AI customer support?" center />
          <FAQAccordion />
        </div>
      </section>

      {/* RELATED */}
      <section className="acs-section acs-section--light">
        <div className="acs-container">
          <SectionHeading eyebrow="EXPLORE MORE" title="More ways Bellbee." accent="Helps your business." />
          <div className="acs-grid acs-grid-3">
            {related.map(({ icon: Icon, title, description, to }) => <Link key={to} to={to} className="acs-card acs-related acs-reveal"><span className="acs-card-icon"><Icon size={23} /></span><ArrowUpRight className="acs-related-arrow" size={21} /><h3>{title}</h3><p>{description}</p></Link>)}
          </div>
        </div>
      </section>

      {/* COMPACT CTA */}
      <section className="acs-cta-section">
        <div className="acs-container">
          <div className="acs-cta-card">
            <span className="acs-blob acs-cta-blob-one" aria-hidden="true" />
            <span className="acs-blob acs-cta-blob-two" aria-hidden="true" />
            <div className="acs-cta-inner">
              <span className="acs-cta-kicker"><Sparkles size={16} /> ALWAYS HELPFUL. ALWAYS YOUR BUSINESS.</span>
              <h2>Better answers for every customer.<br /><em>More time for your team.</em></h2>
              <p>Give customers answers from your own information and step in when they need a person.</p>
              <Link to="/signup" className="acs-btn acs-btn-coral">Start with free credit <ArrowRight size={17} /></Link>
              <small>No credit card required to start.</small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
