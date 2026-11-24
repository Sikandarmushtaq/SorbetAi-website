
import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
  Megaphone,
  MessageCircle,
  Package,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Truck,
  Warehouse,
} from "lucide-react";
import "./OnlineShopsPage.css";

gsap.registerPlugin(useGSAP);

// Sample data only. No backend calls or real orders.
const demoProducts = [
  {
    id: "shirt",
    name: "Blue linen shirt",
    category: "Clothing",
    price: 38,
    stock: 12,
    color: "blue",
  },
  {
    id: "tote",
    name: "Everyday tote",
    category: "Accessories",
    price: 24,
    stock: 8,
    color: "yellow",
  },
  {
    id: "mug",
    name: "Ceramic mug",
    category: "Home",
    price: 16,
    stock: 0,
    color: "lavender",
  },
];

const scenarios = [
  { id: "stock", name: "Stock question", Icon: Warehouse },
  { id: "order", name: "Place an order", Icon: ShoppingBag },
  { id: "tracking", name: "Order update", Icon: Truck },
  { id: "handoff", name: "Human help", Icon: Headphones },
];

const benefits = [
  {
    Icon: Warehouse,
    title: "Is it in stock? How much is it?",
    text: "Your AI answers using the product names, prices and stock that you added.",
  },
  {
    Icon: Clock3,
    title: "Messages after closing time",
    text: "A shopper can get an answer in the evening instead of waiting for the next morning.",
  },
  {
    Icon: ShoppingBag,
    title: "Orders buried in a long chat",
    text: "Turn a conversation into an order with the customer's name, address and city.",
  },
  {
    Icon: PackageCheck,
    title: "Where is my order?",
    text: "Your AI can look up orders by phone number and share saved status and tracking details.",
  },
  {
    Icon: Megaphone,
    title: "A sale to tell everyone about",
    text: "Choose the customers you want to reach with a WhatsApp campaign.",
  },
];

const steps = [
  {
    number: "01",
    Icon: Store,
    title: "Add your products",
    text: "Add names, prices, stock and categories. Import a spreadsheet when you have many.",
  },
  {
    number: "02",
    Icon: MessageCircle,
    title: "Connect your channels",
    text: "Connect WhatsApp, Instagram or Messenger to your Bellbee account.",
  },
  {
    number: "03",
    Icon: Bot,
    title: "Let your AI answer and take orders",
    text: "It uses your catalog and follows the rules you provide.",
  },
  {
    number: "04",
    Icon: Truck,
    title: "Confirm and ship",
    text: "You confirm each order. Customers can receive updates as its status changes.",
  },
];

const dayStories = [
  {
    Icon: Warehouse,
    time: "10:15 AM",
    title: "The same stock question, again and again",
    message: "Do you have this in blue?",
    reply: "Your AI checks the catalog and replies with availability and price.",
    link: "/orders-in-chat",
  },
  {
    Icon: Clock3,
    time: "9:00 PM",
    title: "An order at 9pm",
    message: "I'll take two of the blue ones.",
    reply: "Your AI collects the delivery details and creates an order for your confirmation.",
    link: "/orders-in-chat",
  },
  {
    Icon: Package,
    time: "NEXT DAY",
    title: "Where is my parcel?",
    message: "Can you check my order?",
    reply: "Your AI shares the saved order status and tracking details, if available.",
    link: "/orders-in-chat",
  },
  {
    Icon: RotateCcw,
    time: "AFTER ORDERING",
    title: "Changed their mind",
    message: "Can I cancel my order?",
    reply: "Orders can be cancelled in chat until processing begins. After that, your team handles it.",
    link: "/orders-in-chat",
  },
  {
    Icon: Megaphone,
    time: "SALE DAY",
    title: "A sale to announce",
    message: "Our weekend offer is here!",
    reply: "Choose your WhatsApp audience, send your message and review send results.",
    link: "/whatsapp-campaigns",
  },
];

const firstThings = [
  {
    Icon: Tag,
    title: "Your products",
    text: "Name, price, stock, category and a link for each product.",
  },
  {
    Icon: HelpCircle,
    title: "Delivery and returns, in your words",
    text: "Add FAQs so your AI can answer questions in your business's voice.",
  },
  {
    Icon: FileText,
    title: "Your policies",
    text: "Upload a PDF, such as your returns policy, for your AI to search.",
  },
  {
    Icon: CreditCard,
    title: "How customers pay",
    text: "Offer cash on delivery or share payment details. You verify payments yourself.",
  },
];

const faqs = [
  {
    q: "Can my AI tell a shopper whether something is in stock?",
    a: "Yes. Bellbee Ai uses the product names, prices and stock that you add to your catalog. Keep those details current so the answers stay accurate.",
  },
  {
    q: "Can shoppers buy without a person in the chat?",
    a: "Yes. Your AI can collect the details for a single-product order in WhatsApp, Instagram or Messenger and create the order. It waits for your confirmation unless you enable instant confirmation.",
  },
  {
    q: "What if someone wants to buy three different things?",
    a: "An order created by the AI contains one product, with a chosen quantity. For a basket containing different products, your team adds the order in the Bellbee app.",
  },
  {
    q: "How do my customers pay?",
    a: "You can offer cash on delivery or have your AI share the payment details you provided. Bellbee does not verify that a payment has arrived; your team confirms payments manually.",
  },
  {
    q: "Can I send an offer to my customers on WhatsApp?",
    a: "Yes. WhatsApp campaigns let you select your audience and send an offer, subject to WhatsApp messaging and template rules.",
  },
  {
    q: "What happens when a shopper asks something my AI cannot answer?",
    a: "A person can take over the conversation. The AI also hands the chat to your team when a shopper asks to speak with a person or the question cannot be resolved.",
  },
  {
    q: "How long until my shop chat is working?",
    a: "You can start once you have added your products and business answers, connected a supported channel, and configured your AI. The time needed depends on your catalog and channel setup.",
  },
];

const related = [
  {
    Icon: ShoppingBag,
    title: "Orders in chat",
    text: "Take single-product orders from your catalog inside a conversation.",
    to: "/orders-in-chat",
  },
  {
    Icon: Megaphone,
    title: "WhatsApp campaigns",
    text: "Send one WhatsApp message to the customers you choose.",
    to: "/whatsapp-campaigns",
  },
  {
    Icon: Store,
    title: "Restaurants and cafes",
    text: "Answer guest questions and take bookings in chat.",
    to: "/ai-chat-for-restaurants",
  },
];

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  centered = false,
}) {
  return (
    <div className={`os-section-heading ${centered ? "os-center" : ""}`}>
      <span className="os-eyebrow">{eyebrow}</span>
      <h2>
        {title} {accent && <em>{accent}</em>}
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function Message({ from = "ai", children }) {
  return (
    <div className={`os-message os-message-${from}`}>
      {from === "ai" && (
        <span className="os-message-avatar" aria-hidden="true">
          <Bot size={14} />
        </span>
      )}
      <div className="os-message-bubble">{children}</div>
    </div>
  );
}

// ==============================================
// INTERACTIVE RETAIL CHAT DEMO
// ==============================================
function RetailChatDemo() {
  const [scene, setScene] = useState("stock");
  const [productId, setProductId] = useState("shirt");
  const [quantity, setQuantity] = useState(2);
  const [customer, setCustomer] = useState({
    name: "",
    address: "",
    city: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const product = useMemo(
    () =>
      demoProducts.find((item) => item.id === productId) ||
      demoProducts[0],
    [productId]
  );

  const total = product.price * quantity;

  const canSubmit =
    product.stock >= quantity &&
    quantity > 0 &&
    customer.name.trim() &&
    customer.address.trim() &&
    customer.city.trim();

  function switchScene(id) {
    setScene(id);
    setSubmitted(false);
  }

  function changeProduct(id) {
    setProductId(id);
    setQuantity(1);
    setSubmitted(false);
  }

  function placeSampleOrder(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <div
      className="os-demo-shell"
      aria-label="Interactive retail chat demonstration"
    >
      <div className="os-demo-topbar">
        <div className="os-demo-store-icon">
          <Store size={22} />
        </div>
        <div className="os-demo-title">
          <strong>Your shop's inbox</strong>
          <span>
            <span className="os-online-dot" /> Bellbee Ai assistant
          </span>
        </div>
        <span className="os-demo-chip">INTERACTIVE DEMO</span>
      </div>

      <div
        className="os-demo-tabs"
        role="group"
        aria-label="Choose a sample conversation"
      >
        {scenarios.map(({ id, name, Icon }) => (
          <button
            key={id}
            type="button"
            className={scene === id ? "active" : ""}
            aria-pressed={scene === id}
            onClick={() => switchScene(id)}
          >
            <Icon size={15} />
            <span>{name}</span>
          </button>
        ))}
      </div>

      <div className="os-demo-conversation" aria-live="polite">
        <div className="os-demo-day">
          Today · Example conversation
        </div>

        {scene === "stock" && (
          <>
            <Message from="customer">
              Hi! Is this available, and how much is it?
            </Message>
            <Message>
              <p>
                Happy to check! Choose a product from your
                example catalog:
              </p>
              <div className="os-product-choices">
                {demoProducts.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      productId === item.id ? "selected" : ""
                    }
                    onClick={() => changeProduct(item.id)}
                  >
                    <span
                      className={`os-product-dot os-product-${item.color}`}
                    />
                    {item.name}
                  </button>
                ))}
              </div>
            </Message>
            <Message>
              <strong>{product.name}</strong> is{" "}
              <strong>${product.price}</strong>.
              {product.stock > 0 ? (
                <>
                  {" "}We have{" "}
                  <strong>{product.stock} in stock</strong>{" "}
                  in this sample catalog.{" "}
                  <Check
                    size={13}
                    className="os-inline-icon"
                  />
                </>
              ) : (
                <>
                  {" "}It is{" "}
                  <strong>currently out of stock</strong>{" "}
                  in this sample catalog.
                </>
              )}
            </Message>
          </>
        )}

        {scene === "order" && (
          <>
            <Message from="customer">
              I'd like to order a blue linen shirt.
            </Message>
            <Message>
              Of course! I can help with a single-product
              order. Fill out the sample order below.
            </Message>
            <form
              className="os-demo-form"
              onSubmit={placeSampleOrder}
            >
              <div className="os-form-heading">
                <ShoppingBag size={17} />
                <strong>Sample order</strong>
                <span>DEMO</span>
              </div>

              <label htmlFor="os-order-product">
                Product
              </label>
              <select
                id="os-order-product"
                value={productId}
                onChange={(event) =>
                  changeProduct(event.target.value)
                }
                disabled={submitted}
              >
                {demoProducts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · ${item.price}
                  </option>
                ))}
              </select>

              <div className="os-quantity-row">
                <span>Quantity</span>
                <div className="os-quantity-picker">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || submitted}
                    onClick={() => {
                      setQuantity((n) => Math.max(1, n - 1));
                      setSubmitted(false);
                    }}
                  >
                    −
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={
                      quantity >= Math.max(product.stock, 1) ||
                      submitted
                    }
                    onClick={() => {
                      setQuantity((n) =>
                        Math.min(
                          Math.max(product.stock, 1),
                          n + 1
                        )
                      );
                      setSubmitted(false);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="os-order-total">
                <span>Example total</span>
                <strong>${total}</strong>
              </div>

              {product.stock === 0 && (
                <p className="os-form-warning">
                  This product is out of stock. Choose another
                  product.
                </p>
              )}

              {!submitted ? (
                <>
                  <div className="os-input-grid">
                    <label>
                      Full name
                      <input
                        type="text"
                        maxLength={80}
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer((v) => ({
                            ...v,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Your name"
                        required
                      />
                    </label>
                    <label>
                      City
                      <input
                        type="text"
                        maxLength={80}
                        value={customer.city}
                        onChange={(e) =>
                          setCustomer((v) => ({
                            ...v,
                            city: e.target.value,
                          }))
                        }
                        placeholder="City"
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Delivery address
                    <input
                      type="text"
                      maxLength={180}
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer((v) => ({
                          ...v,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Street address"
                      required
                    />
                  </label>
                  <button
                    className="os-submit-order"
                    type="submit"
                    disabled={!canSubmit}
                  >
                    Place sample order
                    <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <div className="os-order-success" role="status">
                  <CheckCircle2 size={23} />
                  <strong>
                    Sample order BB-DEMO-1042 created
                  </strong>
                  <p>
                    Awaiting shop confirmation. No real order
                    was placed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                  >
                    Edit example order
                  </button>
                </div>
              )}
            </form>
          </>
        )}

        {scene === "tracking" && (
          <>
            <Message from="customer">
              Where's my parcel? I'm messaging from the
              number on my order.
            </Message>
            <Message>
              Let me check the order linked to your phone
              number.
            </Message>
            <div className="os-status-card">
              <div className="os-status-card-top">
                <PackageCheck size={20} />
                <span>Sample order BB-DEMO-0931</span>
              </div>
              <strong>In transit</strong>
              <div className="os-status-steps">
                <span className="done" />
                <span className="done" />
                <span />
              </div>
              <div className="os-status-labels">
                <span>Confirmed</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </div>
              <p>
                <Truck size={15} />
                Tracking: DEMO-TRACK-204
              </p>
            </div>
            <Message>
              Your package is on the way! The tracking shown
              here was added by the shop in this example.
            </Message>
          </>
        )}

        {scene === "handoff" && (
          <>
            <Message from="customer">
              Can I speak with someone from your team?
            </Message>
            <Message>
              Absolutely! I'll hand this conversation to a
              person on the shop's team.
            </Message>
            <div className="os-handoff-card">
              <span>
                <Headphones size={19} />
              </span>
              <div>
                <strong>Human handoff requested</strong>
                <p>Your team can take over the chat.</p>
              </div>
              <CheckCircle2 size={20} />
            </div>
            <Message>
              I've passed this on. A team member can continue
              the conversation here.
            </Message>
          </>
        )}
      </div>

      <div className="os-demo-footer">
        <ShieldCheck size={16} />
        Interactive frontend demo only — no real messages,
        orders or payments.
      </div>
    </div>
  );
}

// ==============================================
// FAQ ACCORDION
// ==============================================
function FAQAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="os-faq-list">
      {faqs.map(({ q, a }, index) => (
        <article
          className={`os-faq-item ${
            open === index ? "open" : ""
          }`}
          key={q}
        >
          <h3>
            <button
              type="button"
              aria-expanded={open === index}
              aria-controls={`os-faq-answer-${index}`}
              onClick={() =>
                setOpen(open === index ? -1 : index)
              }
            >
              {q}
              <ChevronDown size={20} />
            </button>
          </h3>
          <div
            id={`os-faq-answer-${index}`}
            hidden={open !== index}
          >
            <p>{a}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

// ==============================================
// MAIN PAGE + GSAP
// ==============================================
export default function OnlineShopsPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      if (
        typeof window === "undefined" ||
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      gsap.from(".os-hero-copy > *", {
        opacity: 0,
        y: 20,
        duration: 0.75,
        ease: "power2.out",
        stagger: 0.1,
      });

      gsap.from(".os-demo-shell", {
        opacity: 0,
        y: 32,
        scale: 0.97,
        duration: 0.95,
        delay: 0.18,
        ease: "power3.out",
      });

      gsap.to(".os-orb", {
        rotation: 360,
        duration: 65,
        repeat: -1,
        ease: "none",
        stagger: 0.3,
      });

      gsap.to(".os-float", {
        y: -8,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.6,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="os-page" ref={pageRef}>
      {/* HERO */}
      <section className="os-hero">
        <span
          className="os-orb os-orb-lavender"
          aria-hidden="true"
        />
        <span
          className="os-orb os-orb-yellow"
          aria-hidden="true"
        />

        <div className="os-container os-hero-grid">
          <div className="os-hero-copy">
            <span className="os-hero-kicker">
              <Sparkles size={16} />
              ONLINE SHOPS & RETAIL
            </span>

            <h1>
              Answer shoppers and take orders in chat,{" "}
              <em>even after closing time.</em>
            </h1>

            <p>
              If you sell products and customers message you on
              WhatsApp, Instagram or Messenger, Bellbee Ai
              answers questions using your own product list and
              takes orders in chat. Your team sees orders in one
              place, and a person can take over whenever needed.
            </p>

            <div className="os-hero-actions">
              <Link
                className="os-btn os-btn-primary"
                to="/signup"
              >
                Start with free credit
                <ArrowRight size={18} />
              </Link>
              <a
                className="os-btn os-btn-outline"
                href="#os-how"
              >
                See how it works
              </a>
            </div>

            <div className="os-hero-trust">
              <span>
                <CheckCircle2 size={16} />
                Answers at any hour
              </span>
              <span>
                <CheckCircle2 size={16} />
                Human handoff
              </span>
              <span>
                <CheckCircle2 size={16} />
                Orders in one place
              </span>
            </div>
          </div>

          <div className="os-hero-visual">
            <div className="os-float os-float-top">
              <Clock3 size={17} />
              Your shop, always ready
            </div>
            <RetailChatDemo />
            <div className="os-float os-float-bottom">
              <CheckCheck size={17} />
              Built around your catalog
            </div>
          </div>
        </div>

        <div className="os-container">
          <p className="os-hero-note">
            Orders and bookings, taken inside the chat.{" "}
            <span>See the interactive retail example above.</span>
          </p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="os-section" id="os-benefits">
        <div className="os-container">
          <SectionHeading
            eyebrow="WHAT IT HELPS WITH"
            title="Everyday shop messages."
            accent="Already handled."
            description="Give shoppers the answers they need, keep orders organized and let your team step in when it matters."
          />

          <div className="os-benefits-grid">
            {benefits.map(({ Icon, title, text }, index) => (
              <article
                className={`os-feature-card os-feature-${
                  index + 1
                }`}
                key={title}
              >
                <div
                  className={`os-card-icon os-icon-${
                    [
                      "lavender",
                      "yellow",
                      "coral",
                      "green",
                      "lavender",
                    ][index]
                  }`}
                >
                  <Icon size={23} />
                </div>
                <span className="os-card-count">
                  0{index + 1}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="os-section os-section-white"
        id="os-how"
      >
        <div className="os-container">
          <SectionHeading
            eyebrow="HOW IT WORKS"
            title="From product list"
            accent="to a helpful shop assistant."
            description="Four steps to get Bellbee answering shoppers from your own business information."
          />

          <div className="os-steps-grid">
            {steps.map(
              ({ number, Icon, title, text }, index) => (
                <article className="os-step-card" key={number}>
                  <span className="os-step-number">
                    {number}
                  </span>
                  <div
                    className={`os-card-icon os-icon-${
                      [
                        "yellow",
                        "lavender",
                        "coral",
                        "green",
                      ][index]
                    }`}
                  >
                    <Icon size={25} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* A DAY IN THE CHAT */}
      <section className="os-section" id="os-day">
        <div className="os-container">
          <SectionHeading
            eyebrow="A DAY IN THE CHAT"
            title="From first question"
            accent="to the final update."
            description="Examples of the messages a business like yours gets and what happens next. These are illustrative, not real customer conversations."
          />

          <div className="os-stories-grid">
            {dayStories.map(
              (
                {
                  Icon,
                  time,
                  title,
                  message,
                  reply,
                  link,
                },
                index
              ) => (
                <article
                  className={`os-story-card ${
                    index === 0
                      ? "os-story-featured"
                      : ""
                  }`}
                  key={title}
                >
                  <div className="os-story-top">
                    <span className="os-story-time">
                      <Clock3 size={13} />
                      {time}
                    </span>
                    <span className="os-story-icon">
                      <Icon size={20} />
                    </span>
                  </div>
                  <h3>{title}</h3>
                  <div className="os-story-message">
                    <MessageCircle size={16} />
                    <span>“{message}”</span>
                  </div>
                  <p>{reply}</p>
                  <Link to={link}>
                    How it works
                    <ArrowUpRight size={16} />
                  </Link>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* WHAT TO ADD FIRST */}
      <section
        className="os-section os-section-white"
        id="os-setup"
      >
        <div className="os-container">
          <SectionHeading
            eyebrow="WHAT TO ADD FIRST"
            title="Give your AI the right info."
            accent="It handles the questions."
            description="Your AI only knows what you give it. These four things cover most shopper questions."
          />

          <div className="os-setup-grid">
            {firstThings.map(
              ({ Icon, title, text }, index) => (
                <article
                  className="os-setup-card"
                  key={title}
                >
                  <div
                    className={`os-card-icon os-icon-${
                      [
                        "lavender",
                        "coral",
                        "yellow",
                        "green",
                      ][index]
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS AND LIMITATIONS */}
      <section className="os-section" id="os-limits">
        <div className="os-container">
          <SectionHeading
            eyebrow="GOOD TO KNOW"
            title="What's included."
            accent="And what's not."
            description="A clear picture of what your team provides and how Bellbee uses it."
          />

          <div className="os-limits-grid">
            <article className="os-limits-card os-limits-yes">
              <div className="os-limits-heading">
                <span>
                  <CheckCircle2 size={22} />
                </span>
                <h3>What you need</h3>
              </div>
              <ul>
                <li>
                  <Check size={17} />
                  Products with prices and stock added in
                  Bellbee.
                </li>
                <li>
                  <Check size={17} />
                  A connected WhatsApp, Instagram or Messenger
                  channel.
                </li>
                <li>
                  <Check size={17} />
                  Your delivery, returns and payment answers
                  added as FAQs or documents.
                </li>
              </ul>
            </article>

            <article className="os-limits-card os-limits-no">
              <div className="os-limits-heading">
                <span>
                  <ShieldCheck size={22} />
                </span>
                <h3>What it does not do</h3>
              </div>
              <ul>
                <li>
                  <span className="os-limit-dot" />
                  It does not track parcels independently;
                  your team adds tracking details.
                </li>
                <li>
                  <span className="os-limit-dot" />
                  It does not verify incoming payments; you
                  confirm them.
                </li>
                <li>
                  <span className="os-limit-dot" />
                  AI-created orders contain one product.
                  Your team creates multi-product baskets
                  in the app.
                </li>
                <li>
                  <span className="os-limit-dot" />
                  It does not take orders in website chat or
                  social media comments.
                </li>
              </ul>
            </article>
          </div>

          <div className="os-handoff-note">
            <Headphones size={23} />
            <p>
              <strong>A real person is always an option.</strong>{" "}
              Your team can take over any chat when the
              shopper asks or the AI cannot resolve the
              question.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="os-section os-section-white"
        id="os-faq"
      >
        <div className="os-container os-faq-grid">
          <div>
            <SectionHeading
              eyebrow="QUESTIONS"
              title="A few things you"
              accent="might be wondering."
              description="The practical details about products, orders, payments and human help."
            />
            <div className="os-faq-decoration">
              <Sparkles size={32} />
              <span>Answers that work for your shop.</span>
            </div>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* RELATED PAGES */}
      <section className="os-section" id="os-related">
        <div className="os-container">
          <SectionHeading
            eyebrow="RELATED"
            title="Keep exploring"
            accent="Bellbee Ai."
          />

          <div className="os-related-grid">
            {related.map(({ Icon, title, text, to }) => (
              <Link
                className="os-related-card"
                to={to}
                key={title}
              >
                <span className="os-related-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="os-related-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="os-cta-section">
        <div className="os-container">
          <div className="os-cta-box">
            <div
              className="os-cta-decoration os-cta-decoration-one"
              aria-hidden="true"
            />
            <div
              className="os-cta-decoration os-cta-decoration-two"
              aria-hidden="true"
            />

            <div className="os-cta-content">
              <span className="os-cta-kicker">
                <Sparkles size={16} />
                YOUR SHOP, OPEN FOR CONVERSATIONS
              </span>
              <h2>
                Make every message{" "}
                <em>an opportunity.</em>
              </h2>
              <p>
                Answer questions, collect orders and stay
                close to your shoppers with Bellbee Ai.
              </p>
              <Link
                className="os-btn os-btn-primary"
                to="/signup"
              >
                Start with free credit
                <ArrowRight size={18} />
              </Link>
              <small>No credit card required to start.</small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
