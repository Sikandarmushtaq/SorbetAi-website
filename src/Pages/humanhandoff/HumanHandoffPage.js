
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, ArrowUpRight, Bell, BellRing, Bot, CalendarDays,
  Check, CheckCircle2, ChevronDown, Clock3, FileText, Globe2,
  Handshake, Headphones, Mail, MessageCircle, MessageSquare,
  PauseCircle, RefreshCcw, Send, ShieldCheck, Smartphone,
  Sparkles, UserRound, Users, Zap,
} from "lucide-react";
import "./HumanHandoffPage.css";

gsap.registerPlugin(useGSAP);

const benefits = [
  [UserRound, "A customer asks for a person", "The AI recognizes when someone wants human help and passes that conversation to you."],
  [MessageCircle, "A complaint needs attention", "The AI acknowledges the concern, collects useful details, and hands it to your team."],
  [ShieldCheck, "Things you want to handle", "Choose situations that your team handles, such as a customer asking for a discount."],
  [PauseCircle, "Replies you send yourself", "If you reply from WhatsApp Business, Messenger or Instagram, the AI steps back in that chat."],
];

const steps = [
  ["01", MessageCircle, "The AI hands over", "A customer asks for a person, or the AI cannot resolve their question."],
  ["02", BellRing, "You get an alert", "An app and phone alert tell you who is waiting and why."],
  ["03", UserRound, "You take over", "Tap You at the top of the conversation and send your reply."],
  ["04", Bot, "Hand back to AI", "Tap AI when you're done. The AI starts fresh in that chat."],
];

const features = [
  [Bell, "An alert with the reason", "See who is waiting and why, then tap the alert to open their chat."],
  [RefreshCcw, "One switch in every chat", "The AI / You switch clearly shows who's replying."],
  [Zap, "Hand back in one tap", "Tap AI to resume automated replies when you're done."],
  [Users, "No interruption for others", "The handover affects one chat; the AI keeps helping everyone else."],
];

const reminders = [
  [Clock3, "15 minutes", "A reminder to reply", "If the customer is still waiting, you get another alert."],
  [Mail, "At most hourly", "Waiting-list email", "A single email summarizes customers who are waiting."],
  [MessageSquare, "After 2 hours", "A polite customer update", "The customer gets one short apology when nobody has replied."],
  [CalendarDays, "Last 24 hours", "Recent chats only", "Only chats active in the last 24 hours are considered."],
];

const autoPause = [
  [Smartphone, "You reply from another app", "When you reply using WhatsApp Business, Messenger or Instagram, the AI pauses for that conversation."],
  [Bot, "Two bots talking", "If a conversation looks automated, the AI pauses and lets you know."],
  [BellRing, "An AI reply failed", "If the AI cannot reply, you receive a customer-needs-your-reply alert."],
];

const faqs = [
  ["When does my AI hand a chat to me?", "When a customer requests a person, the AI cannot help, or one of your handover rules is triggered."],
  ["How do I know a chat needs me?", "Bellbee shows an alert with the customer and reason. Phone alerts are available through the Bellbee app."],
  ["Can I take over any chat?", "Yes. Open any conversation and switch from AI to You, even without an automatic handover."],
  ["How do I hand a chat back to my AI?", "Tap AI at the top of the chat. It starts fresh and resumes replying in that conversation."],
  ["What does the customer see?", "The customer stays in the same conversation and receives replies through the same channel."],
  ["What if I reply from WhatsApp Business on my phone?", "Bellbee pauses the AI in that chat until you switch AI on again."],
  ["Can my AI promise a refund?", "No. For complaints it can acknowledge the issue and gather details, but it cannot promise refunds or compensation."],
];

const related = [
  [Headphones, "AI customer support", "Answers using your business information.", "/ai-customer-support"],
  [Globe2, "Channels", "Every conversation together in one place.", "/omnichannel-messaging"],
  [Smartphone, "Android app", "Conversations and alerts on your phone.", "/android-app"],
];

function Heading({ label, title, description, center = false }) {
  return (
    <div className={`hh-heading ${center ? "hh-heading--center" : ""}`}>
      <span className="hh-eyebrow">{label}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function IconCard({ Icon, title, description, className = "" }) {
  return (
    <article className={`hh-card ${className}`}>
      <span className="hh-card-icon"><Icon size={23} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function ChatPreview() {
  const [mode, setMode] = useState("you");
  const [draft, setDraft] = useState("");
  const [replies, setReplies] = useState([]);
  const human = mode === "you";

  function toggle(next) {
    setMode(next);
    setDraft("");
    if (next === "ai") setReplies([]);
  }

  function send(event) {
    event.preventDefault();
    if (!human || !draft.trim()) return;
    setReplies((items) => [...items, draft.trim()]);
    setDraft("");
  }

  return (
    <div className="hh-preview">
      <div className="hh-preview-top">
        <strong><Sparkles size={16} /> Bellbee Inbox</strong>
        <span className="hh-preview-demo"><i /> Interactive demo</span>
      </div>
      <div className="hh-preview-window">
        <div className="hh-preview-header">
          <div className="hh-contact">
            <span className="hh-avatar">SC</span>
            <div><strong>Sarah Carter</strong><small>WhatsApp conversation</small></div>
          </div>
          <div className="hh-switch" role="group" aria-label="Who replies">
            <button type="button" aria-pressed={mode === "ai"} className={mode === "ai" ? "active" : ""} onClick={() => toggle("ai")}><Bot size={14} /> AI</button>
            <button type="button" aria-pressed={human} className={human ? "active" : ""} onClick={() => toggle("you")}><UserRound size={14} /> You</button>
          </div>
        </div>
        <div className="hh-messages" aria-live="polite">
          <span className="hh-today">Today</span>
          <div className="hh-bubble hh-bubble--customer">Hi! I need to speak with someone about my booking.<small>10:42</small></div>
          <div className="hh-bubble hh-bubble--ai">Of course! I'll pass this to our team so someone can help you.<small>10:42</small></div>
          <div className="hh-event"><BellRing size={18} /><div><strong>Human handoff requested</strong><small>Customer asked to speak with a person.</small></div></div>
          {human ? (
            <div className="hh-bubble hh-bubble--owner">Hi Sarah! I'm here to help. Could you share your booking reference?<small>10:43</small></div>
          ) : (
            <div className="hh-bubble hh-bubble--ai">Your AI is ready to continue helping with this conversation.<small>Now</small></div>
          )}
          {replies.map((text, index) => <div className="hh-bubble hh-bubble--owner" key={`${index}-${text}`}>{text}<small>Now</small></div>)}
        </div>
        <div className={`hh-preview-status ${human ? "human" : "ai"}`}>
          {human ? <UserRound size={15} /> : <Bot size={15} />}
          {human ? "You're replying in this chat" : "AI is replying in this chat"}
        </div>
        <form className="hh-compose" onSubmit={send}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!human} aria-label="Type a sample reply" placeholder={human ? "Write a reply..." : "Switch to You to reply"} />
          <button type="submit" disabled={!human || !draft.trim()} aria-label="Send sample reply"><Send size={18} /></button>
        </form>
      </div>
      <p className="hh-preview-note"><CheckCircle2 size={15} /> Switch between AI and You. Demo only, no real messages sent.</p>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="hh-faq-list">
      {faqs.map(([question, answer], index) => (
        <div className={`hh-faq-item ${open === index ? "open" : ""}`} key={question}>
          <button type="button" aria-expanded={open === index} aria-controls={`hh-answer-${index}`} onClick={() => setOpen(open === index ? -1 : index)}>
            {question}<ChevronDown size={20} />
          </button>
          <div id={`hh-answer-${index}`} hidden={open !== index}><p>{answer}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function HumanHandoffPage() {
  const pageRef = useRef(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(".hh-blob", { rotation: 360, duration: 48, repeat: -1, ease: "none" });
    gsap.to(".hh-blob", { x: 18, y: -15, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.9 });
    gsap.to(".hh-float", { y: -9, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.35 });
  }, { scope: pageRef });

  return (
    <main className="hh-page" ref={pageRef}>
      {/* HERO */}
      <section className="hh-hero">
        <span className="hh-blob hh-blob--lavender" aria-hidden="true" />
        <span className="hh-blob hh-blob--yellow" aria-hidden="true" />
        <div className="hh-container hh-hero-grid">
          <div className="hh-hero-copy">
            <span className="hh-hero-tag"><Handshake size={16} /> HUMAN HANDOFF</span>
            <h1>Your AI hands over <em>when a person is needed.</em></h1>
            <p>Bellbee AI answers your customers and knows when to call in a human. Get an alert, take over in one tap, and let the AI continue when you're done.</p>
            <div className="hh-hero-buttons">
              <Link to="/signup" className="hh-btn hh-btn-coral">Start with free credit <ArrowRight size={17} /></Link>
              <a className="hh-btn hh-btn-outline" href="#hh-how-it-works">See how it works</a>
            </div>
            <div className="hh-trust"><span><CheckCircle2 size={16} /> No credit card required</span><span><CheckCircle2 size={16} /> Only one chat hands over</span></div>
          </div>
          <div className="hh-hero-visual">
            <div className="hh-float hh-float-top"><BellRing size={16} /> Customer needs your reply</div>
            <ChatPreview />
            <div className="hh-float hh-float-bottom"><Check size={16} /> You're in control</div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="hh-section hh-benefits">
        <div className="hh-container">
          <Heading label="WHAT IT HELPS WITH" title="The right conversations reach the right person." description="Let AI handle everyday questions while your team deals with conversations that need a human touch." />
          <div className="hh-grid hh-grid-4">
            {benefits.map(([Icon, title, description]) => <IconCard key={title} Icon={Icon} title={title} description={description} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="hh-section hh-soft" id="hh-how-it-works">
        <div className="hh-container">
          <Heading label="HOW IT WORKS" title="From AI to you. And back again." description="A simple four-step process that keeps the customer in the same chat." />
          <div className="hh-grid hh-grid-4">
            {steps.map(([number, Icon, title, description]) => (
              <article className="hh-card hh-step" key={number}>
                <span className="hh-step-number">{number}</span>
                <span className="hh-card-icon"><Icon size={23} /></span>
                <h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
          <p className="hh-centered-note"><Sparkles size={17} /> Other conversations keep running while you take over one chat.</p>
        </div>
      </section>

      {/* WHAT YOU SEE */}
      <section className="hh-section">
        <div className="hh-container hh-two-column">
          <div>
            <Heading label="WHAT YOU SEE" title="Everything you need inside the chat." description="Know why someone needs you, take over quickly, and hand back when you're finished." />
            <div className="hh-list">
              {features.map(([Icon, title, description]) => (
                <article className="hh-list-row" key={title}><span className="hh-card-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{description}</p></div></article>
              ))}
            </div>
          </div>
          <div className="hh-screenshot">
            <img src="https://bellbee.ai/assets/handoff-Biu2yaJq.webp" alt="Bellbee inbox showing the AI and You handoff switch" loading="lazy" />
            <p><CheckCircle2 size={16} /> Real conversations, one shared inbox</p>
          </div>
        </div>
      </section>

      {/* RULES */}
      <section className="hh-section hh-soft">
        <div className="hh-container hh-two-column">
          <div>
            <Heading label="YOU SET THE RULES" title="Decide when your AI hands over." description="Keep control of the conversations that matter most to your business." />
            <div className="hh-list">
              <article className="hh-list-row"><span className="hh-card-icon"><CalendarDays size={19} /></span><div><h3>Orders and bookings</h3><p>Decide whether AI handles them or sends them to your team.</p></div></article>
              <article className="hh-list-row"><span className="hh-card-icon"><FileText size={19} /></span><div><h3>Up to 10 custom situations</h3><p>For example, customers asking for special discounts.</p></div></article>
              <article className="hh-list-row"><span className="hh-card-icon"><MessageCircle size={19} /></span><div><h3>Your AI still answers first</h3><p>It acknowledges the request and passes the conversation to a person.</p></div></article>
            </div>
          </div>
          <div className="hh-rules-panel">
            <header><span className="hh-card-icon"><ShieldCheck size={20} /></span><div><strong>Handover settings</strong><small>Example configuration</small></div><span className="hh-active">Active</span></header>
            <div className="hh-rules-body">
              <div><span><strong>Customer asks for a person</strong><small>Always hand over</small></span><i className="hh-toggle" /></div>
              <div><span><strong>Customer complaint</strong><small>Collect details and hand over</small></span><i className="hh-toggle" /></div>
              <div><span><strong>Orders and bookings</strong><small>Let AI handle</small></span><span className="hh-ai-pill"><Bot size={13} /> AI</span></div>
              <div className="hh-rule-example"><small>CUSTOM HANDOVER RULE</small><p><Check size={16} /> Customer asks for a special discount</p></div>
            </div>
            <footer><CheckCircle2 size={16} /> Example only — manage real settings inside Bellbee</footer>
          </div>
        </div>
      </section>

      {/* REMINDERS */}
      <section className="hh-section">
        <div className="hh-container">
          <Heading label="SMART REMINDERS" title="If a customer is waiting, you'll know." description="Get useful reminders so important conversations aren't forgotten." />
          <div className="hh-grid hh-grid-4">
            {reminders.map(([Icon, time, title, description]) => <article className="hh-card hh-reminder" key={title}><div className="hh-reminder-head"><span className="hh-card-icon"><Icon size={22} /></span><small>{time}</small></div><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </div>
      </section>

      {/* AUTOMATIC PAUSE */}
      <section className="hh-section hh-soft">
        <div className="hh-container">
          <Heading label="AUTOMATIC PAUSE" title="Your AI knows when to step back." />
          <div className="hh-grid hh-grid-3">
            {autoPause.map(([Icon, title, description]) => <IconCard key={title} Icon={Icon} title={title} description={description} />)}
          </div>
        </div>
      </section>

      {/* WHAT YOU NEED / LIMITATIONS */}
      <section className="hh-section">
        <div className="hh-container">
          <Heading label="GOOD TO KNOW" title="Simple requirements. Clear limits." />
          <div className="hh-grid hh-grid-2 hh-info-grid">
            <article className="hh-info-card"><h3><CheckCircle2 size={21} /> What you need</h3><ul><li>A connected channel with AI switched on.</li><li>Bellbee on the web or Android to receive alerts.</li><li>Settings → Automation → Hand over to you for custom rules.</li></ul></article>
            <article className="hh-info-card hh-info-card--yellow"><h3><ShieldCheck size={21} /> What it does not do</h3><ul><li>It does not switch the AI back on automatically.</li><li>It does not email you separately for every handover.</li><li>Alerts go to the account owner, not a selected team member.</li><li>Instagram and Messenger obey Meta's reply windows; the seven-day window requires Human Agent approval.</li></ul></article>
          </div>
          <p className="hh-centered-note">You can step into any chat from the Bellbee inbox at any time.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="hh-section hh-soft">
        <div className="hh-container hh-faq-container">
          <Heading label="FREQUENTLY ASKED QUESTIONS" title="Questions about human handoff?" center />
          <FAQ />
        </div>
      </section>

      {/* RELATED */}
      <section className="hh-section">
        <div className="hh-container">
          <Heading label="EXPLORE MORE" title="More ways Bellbee helps your business." />
          <div className="hh-grid hh-grid-3">
            {related.map(([Icon, title, description, to]) => (
              <Link className="hh-card hh-related-card" to={to} key={title}><span className="hh-card-icon"><Icon size={23} /></span><ArrowUpRight className="hh-related-arrow" size={20} /><h3>{title}</h3><p>{description}</p></Link>
            ))}
          </div>
        </div>
      </section>

      {/* COMPACT CTA — matching the AI Brain page */}
      <section className="hh-cta-section">
        <div className="hh-container">
          <div className="hh-cta-card">
            <span className="hh-blob hh-cta-blob-one" aria-hidden="true" />
            <span className="hh-blob hh-cta-blob-two" aria-hidden="true" />
            <div className="hh-cta-inner">
              <span className="hh-cta-kicker"><Sparkles size={15} /> AI + HUMAN. BETTER TOGETHER.</span>
              <h2>Let AI handle the everyday.<br /><em>You handle what matters.</em></h2>
              <p>Keep conversations moving, and step in only when you're needed.</p>
              <div className="hh-cta-actions"><Link to="/signup" className="hh-btn hh-btn-coral">Start with free credit <ArrowRight size={17} /></Link></div>
              <small>No credit card required to start.</small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
