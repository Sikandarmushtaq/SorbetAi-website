
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Headphones,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import "./PricingPage.css";

gsap.registerPlugin(useGSAP);

const highlights = [
  {
    Icon: MessageCircle,
    title: "Every conversation in one inbox",
    text: "Bring WhatsApp, Instagram, Facebook and website chat together.",
  },
  {
    Icon: Sparkles,
    title: "Your business, your AI Brain",
    text: "Answer customers using the information your business provides.",
  },
  {
    Icon: PackageCheck,
    title: "Orders inside the conversation",
    text: "Manage product catalog enquiries and chat orders.",
  },
  {
    Icon: CalendarDays,
    title: "Appointments made easier",
    text: "Use a built-in booking calendar alongside your AI assistant.",
  },
  {
    Icon: Headphones,
    title: "A human when it matters",
    text: "Hand conversations over to your team in the same inbox.",
  },
];

// The original pricing copy does not give a fixed custom-plan price
// or exact usage caps. Neither is invented on this page.
const comparison = [
  { group: "channels", title: "One inbox for WhatsApp, Instagram, Facebook and website chat" },
  { group: "channels", title: "Free official WhatsApp API key" },
  { group: "ai", title: "AI Brain, trained on your business's own info" },
  { group: "commerce", title: "Orders and product catalog, right in the chat" },
  { group: "commerce", title: "Built-in appointment calendar" },
  { group: "channels", title: "WhatsApp marketing campaigns" },
  { group: "ai", title: "Handoff to a human, inside the Bellbee inbox" },
  { group: "ai", title: "Analytics for chats, AI replies, orders and bookings" },
  { group: "custom", title: "Usage limits sized to your volume", pro: false },
  { group: "custom", title: "Help connecting your website or online store", pro: false },
];

const filters = [
  { id: "all", label: "All features" },
  { id: "channels", label: "Channels" },
  { id: "ai", label: "AI & insights" },
  { id: "commerce", label: "Orders & bookings" },
  { id: "custom", label: "Custom setup" },
];

function PricingCard() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <article className="bp-plan-card" aria-label="Bellbee Pro pricing">
      <div className="bp-plan-topline">
        <span className="bp-plan-emblem"><Sparkles size={21} /></span>
        <span className="bp-plan-tag">ONE COMPLETE PLAN</span>
      </div>
      <h2>Bellbee Pro</h2>
      <p className="bp-plan-description">
        Everything you need to automate WhatsApp, Instagram and Messenger.
      </p>

      <div className="bp-price-line">
        <span className="bp-currency">£</span>
        <strong>49.99</strong>
        <span className="bp-price-period">/ month</span>
      </div>
      <p className="bp-fee-label">+ card fee</p>
      <p className="bp-price-explanation">
        Billed monthly. The card fee is added at checkout, where you see
        the total before you pay.
      </p>

      <div className="bp-offer">
        <span className="bp-offer-icon"><Zap size={19} /></span>
        <div>
          <strong>Early bird: 49% off for your first 24 months.</strong>
          <span>First come, first served.</span>
        </div>
      </div>

      <ul className="bp-plan-checks">
        {[
          "One inbox for every channel",
          "AI Brain trained on your business info",
          "Orders and product catalog",
          "Built-in appointment calendar",
          "Human handoff in the Bellbee inbox",
        ].map((item) => (
          <li key={item}><CheckCircle2 size={18} />{item}</li>
        ))}
      </ul>

      <Link to="/signup" className="bp-button bp-button-coral bp-plan-action">
        Start with free credit <ArrowRight size={18} />
      </Link>
      <div className="bp-plan-secure">
        <ShieldCheck size={15} />
        <span>No card to start · Stripe payments · Cancel anytime</span>
      </div>
      <button
        className="bp-details-toggle"
        type="button"
        aria-expanded={detailsOpen}
        aria-controls="bp-payment-details"
        onClick={() => setDetailsOpen((value) => !value)}
      >
        How billing works <ChevronDown size={17} />
      </button>
      {detailsOpen && (
        <div className="bp-details" id="bp-payment-details">
          <p>Begin with free credit and no credit card. When you're ready,
            Bellbee Pro is billed monthly. A card fee is added at checkout,
            and you'll see the total before paying securely with Stripe.</p>
          <p>The early-bird offer is advertised as 49% off for the first
            24 months, subject to availability. The checkout shows the
            applicable total before payment.</p>
        </div>
      )}
    </article>
  );
}

function ComparisonTable() {
  const [activeFilter, setActiveFilter] = useState("all");
  const visible = comparison.filter(
    (row) => activeFilter === "all" || row.group === activeFilter
  );

  return (
    <>
      <div className="bp-filters" role="group" aria-label="Filter comparison features">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "active" : ""}
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="bp-comparison-scroll">
        <table className="bp-comparison-table">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">Bellbee Pro</th>
              <th scope="col">Custom</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.title}>
                <th scope="row">{row.title}</th>
                <td>
                  {row.pro === false ? (
                    <span className="bp-dash" aria-label="Not in the standard plan">—</span>
                  ) : (
                    <span className="bp-included" aria-label="Included">
                      <Check size={18} strokeWidth={3} />
                    </span>
                  )}
                </td>
                <td><span className="bp-discuss">Ask us</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bp-table-note">
        Custom requirements are discussed individually; no fixed custom
        price or specific usage limits are listed here.
      </p>
    </>
  );
}

export default function PricingPage() {
  const pageRef = useRef(null);

  useGSAP(() => {
    if (typeof window === "undefined" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(".bp-hero-copy > *", {
      opacity: 0, y: 22, duration: 0.75, stagger: 0.1, ease: "power2.out",
    });
    gsap.from(".bp-plan-card", {
      opacity: 0, y: 32, scale: 0.97, duration: 0.9,
      delay: 0.15, ease: "power3.out",
    });
    gsap.to(".bp-orb", {
      rotation: 360, duration: 65, repeat: -1, ease: "none",
    });
    gsap.to(".bp-floating", {
      y: -7, duration: 3, repeat: -1,
      yoyo: true, ease: "sine.inOut", stagger: 0.5,
    });
  }, { scope: pageRef });

  return (
    <main className="bp-page" ref={pageRef}>
      <section className="bp-hero">
        <span className="bp-orb bp-orb-lavender" aria-hidden="true" />
        <span className="bp-orb bp-orb-yellow" aria-hidden="true" />
        <div className="bp-container bp-hero-grid">
          <div className="bp-hero-copy">
            <span className="bp-eyebrow bp-hero-pill"><Sparkles size={16} />SIMPLE, TRANSPARENT PRICING</span>
            <h1>One plan with <em>everything,</em> and free credit to start.</h1>
            <p>Start with free credit, no credit card needed. When you're ready,
              one monthly plan covers every channel and feature.</p>
            <div className="bp-hero-actions">
              <Link to="/signup" className="bp-button bp-button-coral">
                Start with free credit <ArrowRight size={17} />
              </Link>
              <a href="#bp-compare" className="bp-button bp-button-outline">
                Compare features
              </a>
            </div>
            <div className="bp-hero-trust">
              <span><CheckCircle2 size={16} />No card to start</span>
              <span><CheckCircle2 size={16} />One monthly plan</span>
              <span><CheckCircle2 size={16} />Cancel anytime</span>
            </div>
          </div>
          <div className="bp-hero-card-area">
            <span className="bp-floating bp-floating-top"><Zap size={16} />Early-bird offer</span>
            <PricingCard />
            <span className="bp-floating bp-floating-bottom"><LockKeyhole size={15} />Secure Stripe checkout</span>
          </div>
        </div>
      </section>

      <section className="bp-section bp-section-light" id="bp-included">
        <div className="bp-container">
          <div className="bp-heading">
            <span className="bp-eyebrow">ONE PLAN, ALL THE ESSENTIALS</span>
            <h2>Everything together. <em>No tool-hopping.</em></h2>
            <p>From the first customer message to an order, a booking or a team handoff.</p>
          </div>
          <div className="bp-benefits-grid">
            {highlights.map(({ Icon, title, text }, index) => (
              <article className="bp-benefit-card" key={title}>
                <span className={`bp-feature-icon bp-icon-${["lavender", "yellow", "coral", "green", "lavender"][index]}`}>
                  <Icon size={23} />
                </span>
                <span className="bp-feature-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bp-section" id="bp-compare">
        <div className="bp-container">
          <div className="bp-heading">
            <span className="bp-eyebrow">EVERYTHING INCLUDED</span>
            <h2>See what's in <em>Bellbee Pro.</em></h2>
            <p>All of the everyday tools in one plan, with a conversation about custom needs when your setup requires more.</p>
          </div>
          <ComparisonTable />
        </div>
      </section>

      <section className="bp-custom-section">
        <div className="bp-container">
          <div className="bp-custom-panel">
            <div className="bp-custom-icon"><Users size={25} /></div>
            <div className="bp-custom-copy">
              <span className="bp-eyebrow">NEED A CUSTOM SETUP?</span>
              <h2>Something built around your business?</h2>
              <p>Need usage limits suited to your volume or help connecting your website or online store? Tell us what you need and we'll put it together.</p>
            </div>
            <Link className="bp-button bp-button-outline bp-custom-link" to="/contact#contact-form">
              Contact us <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bp-section bp-section-light bp-confidence-section">
        <div className="bp-container">
          <div className="bp-confidence-grid">
            <div className="bp-confidence-item"><span><CreditCard size={22} /></span><div><h3>No card to start</h3><p>Explore Bellbee using free credit before adding a payment method.</p></div></div>
            <div className="bp-confidence-item"><span><LockKeyhole size={22} /></span><div><h3>Secure payment</h3><p>Card payment is handled by Stripe, with the full total shown at checkout.</p></div></div>
            <div className="bp-confidence-item"><span><CalendarDays size={22} /></span><div><h3>Monthly billing</h3><p>Bellbee Pro is billed monthly, and you can cancel anytime.</p></div></div>
          </div>
        </div>
      </section>

      <section className="bp-cta-section">
        <div className="bp-container">
          <div className="bp-cta">
            <div>
              <span className="bp-cta-eyebrow"><Sparkles size={15} />START WITH FREE CREDIT</span>
              <h2>Stop losing customers <em>to slow replies.</em></h2>
              <p>Answer WhatsApp, Instagram and Messenger customers around the clock. No credit card required.</p>
            </div>
            <Link to="/signup" className="bp-button bp-button-coral bp-cta-action">
              Start with free credit <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
