
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, ArrowUpRight, Banknote, BellRing, Bot, Check,
  CheckCircle2, ChevronDown, ClipboardList, Clock3, CreditCard,
  FileDown, FileSpreadsheet, MapPin, MessageCircle, Minus,
  Package, PackageCheck, Plus, Printer, RotateCcw, Search,
  ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Truck,
  UserRound, Wallet, XCircle,
} from "lucide-react";
import "./OrdersInChatPage.css";

gsap.registerPlugin(useGSAP);

const catalog = [
  { id: "tote", name: "Classic Tote Bag", price: 24, stock: 18 },
  { id: "mug", name: "Ceramic Mug", price: 16, stock: 0 },
  { id: "notebook", name: "Linen Notebook", price: 12, stock: 7 },
];

const stages = [
  "All", "Pending", "Confirmed", "Processing",
  "Shipped", "Delivered", "Cancelled",
];
const flow = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

const benefits = [
  [ShoppingCart, "Orders typed out by hand", "Customers choose a product from your catalog and order through the conversation."],
  [Search, "Where is my order?", "Customers ask in the chat and your AI looks up their orders by phone number."],
  [ShieldCheck, "Orders you want to check first", "New orders wait for your confirmation before processing begins."],
];

const steps = [
  ["01", Package, "Add your products", "Enter names, prices, stock, categories and links, or import products from a spreadsheet."],
  ["02", MessageCircle, "Customers order in chat", "The AI collects the customer's name, address and city, checks stock, then places the order."],
  ["03", Truck, "You confirm and ship", "Confirm the order and move it through processing, shipping and delivery."],
];

const orderRules = [
  [ShoppingBag, "One product at a time", "An AI-created order contains one catalog product in the quantity the customer chooses."],
  [MapPin, "Real customer details", "The AI collects name, city, address and notes. It cannot order without a real name and city."],
  [PackageCheck, "Stock is checked", "Out-of-stock or unavailable products cannot be ordered."],
  [Clock3, "No duplicate orders", "The same customer placing the same order twice within one minute creates only one order."],
  [ShieldCheck, "You decide when to confirm", "Orders wait for you unless you enable Confirm orders instantly."],
];

const updates = [
  [BellRing, "Status updates", "Customers are notified when an order is confirmed, processed, shipped, delivered or cancelled."],
  [Search, "Tracking in the chat", "Customers can ask where their order is. Your AI checks using their phone number."],
  [XCircle, "Cancel before processing", "Customers can cancel in the chat until the order reaches Processing."],
  [UserRound, "You can take control", "Disable AI cancellation to manage cancellation requests yourself."],
];

const dashboardFeatures = [
  [ClipboardList, "Tabs for every stage", "All, Pending, Confirmed, Processing, Shipped, Delivered and Cancelled."],
  [Plus, "Add orders yourself", "Create larger orders with several products or custom items manually."],
  [FileDown, "Exports and labels", "Export orders to CSV and print shipping labels."],
  [FileSpreadsheet, "Manage your products", "Add, categorize, import or export products, and manage images and stock."],
];

const paymentOptions = [
  [Banknote, "Cash on delivery", "No payment link is sent. The customer pays when their order arrives."],
  [Wallet, "Share your payment details", "Your AI shares the bank or payment details you have added. You confirm receipt yourself."],
  [CreditCard, "Customer says they paid", "You get informed, then check and confirm the payment. The AI does not verify it."],
];

const faqs = [
  ["Can the AI take orders?", "Yes. On connected WhatsApp, Instagram and Messenger chats, it can take an order for one available product from your catalog."],
  ["Does my AI confirm orders by itself?", "Not by default. New orders wait for your confirmation unless you turn on Confirm orders instantly."],
  ["Can a customer order several products?", "An AI-created order has one catalog product, with the quantity the customer wants. You can add a multi-item or custom order yourself in the app."],
  ["How do customers pay?", "You can offer cash on delivery or share your own payment details. Bellbee AI does not verify a transfer; you confirm payments yourself."],
  ["Does the customer get updates?", "Yes. They can receive updates when you change an order's status, including items and tracking details when available."],
  ["Can customers cancel in the chat?", "They can cancel before an order is being processed if AI cancellation is enabled. You can switch it off and handle cancellations yourself."],
  ["Can I import my products?", "Yes. You can add products manually or import them from a CSV spreadsheet, and export your catalog as needed."],
];

const related = [
  [Clock3, "Appointment booking", "Books, moves and cancels appointments around your hours.", "/appointment-booking"],
  [Bot, "AI Brain", "Everything your AI knows, organized in one place.", "/ai-brain"],
  [MessageCircle, "WhatsApp AI agent", "Customer answers on your WhatsApp Business number.", "/whatsapp-ai-agent"],
];

function Heading({ eyebrow, title, accent, description, centered = false }) {
  return (
    <div className={`oic-heading ${centered ? "oic-heading--center" : ""}`}>
      <span className="oic-kicker">{eyebrow}</span>
      <h2>{title} {accent && <em>{accent}</em>}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function Tile({ item }) {
  const [Icon, title, description] = item;
  return (
    <article className="oic-tile">
      <span className="oic-icon"><Icon size={23} strokeWidth={1.9} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function ChatOrderPreview({ order, onPlace, onReset }) {
  const [productId, setProductId] = useState("tote");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("Sarah Carter");
  const [city, setCity] = useState("Lahore");
  const [address, setAddress] = useState("Main Market, Gulberg");
  const [error, setError] = useState("");

  const product = catalog.find((item) => item.id === productId) || catalog[0];

  function choose(id) {
    setProductId(id);
    setQuantity(1);
    setError("");
  }

  function place(event) {
    event.preventDefault();
    if (!name.trim() || !city.trim()) {
      setError("Customer name and city are required.");
      return;
    }
    if (!product.stock || quantity > product.stock) {
      setError("This product or quantity is unavailable.");
      return;
    }
    setError("");
    onPlace({
      id: "DEMO-1042",
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      product: product.name,
      quantity,
      total: quantity * product.price,
      status: "Pending",
    });
  }

  return (
    <div className="oic-chat-card">
      <header className="oic-chat-header">
        <div className="oic-chat-identity">
          <span className="oic-chat-avatar"><Bot size={19} /></span>
          <div>
            <strong>Bellbee AI</strong>
            <small>Messenger order example</small>
          </div>
        </div>
        <span className="oic-demo-chip"><span /> DEMO</span>
      </header>

      <div className="oic-chat-messages">
        <span className="oic-chat-date">Today</span>
        <div className="oic-chat-bubble oic-chat-bubble--customer">
          Hi! I'd like to place an order.
        </div>
        <div className="oic-chat-bubble oic-chat-bubble--ai">
          Of course. Choose one available product and tell me how many you need.
        </div>

        <div className="oic-chat-catalog">
          <small>EXAMPLE PRODUCT CATALOG</small>
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(order) || item.stock === 0}
              onClick={() => choose(item.id)}
              className={productId === item.id ? "selected" : ""}
            >
              <span className="oic-product-icon"><ShoppingBag size={17} /></span>
              <span className="oic-product-name">
                <strong>{item.name}</strong>
                <small>{item.stock ? `${item.stock} in stock` : "Out of stock"}</small>
              </span>
              <span className="oic-product-price">${item.price}</span>
            </button>
          ))}
        </div>

        {order && (
          <div className="oic-chat-bubble oic-chat-bubble--ai">
            Demo order {order.id} is <strong>{order.status}</strong>.
            Your team controls the next step.
          </div>
        )}
      </div>

      {!order ? (
        <form className="oic-chat-form" onSubmit={place}>
          <div className="oic-form-top">
            <span>Quantity</span>
            <div className="oic-quantity">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <strong>{quantity}</strong>
              <button
                type="button"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((n) => Math.min(product.stock, n + 1))}
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>
            <strong>${quantity * product.price}</strong>
          </div>

          <div className="oic-form-grid">
            <label>
              Customer name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </label>
            <label>
              City
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            </label>
          </div>

          <label className="oic-address-field">
            Delivery address
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" />
          </label>

          {error && <p className="oic-form-error" role="alert">{error}</p>}

          <button className="oic-form-submit" type="submit" disabled={!product.stock}>
            Place sample order <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <div className="oic-order-success">
          <span><CheckCircle2 size={17} /> Sample order created</span>
          <button type="button" onClick={onReset}>
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      )}
      <footer className="oic-chat-foot">
        <ShieldCheck size={14} />
        Interactive example only — no real order or payment
      </footer>
    </div>
  );
}

function OrdersBoard({ order, onStatus }) {
  const [activeTab, setActiveTab] = useState("All");
  const sample = order || {
    id: "DEMO-1042",
    name: "Sarah Carter",
    product: "Classic Tote Bag",
    quantity: 1,
    total: 24,
    status: "Pending",
  };
  const visible = activeTab === "All" || activeTab === sample.status;
  const next = flow[flow.indexOf(sample.status) + 1];

  function update(status) {
    onStatus(status);
    setActiveTab("All");
  }

  return (
    <div className="oic-board">
      <header className="oic-board-header">
        <div>
          <span className="oic-icon"><ClipboardList size={21} /></span>
          <div><strong>Orders</strong><small>Example order management</small></div>
        </div>
        <span className="oic-demo-chip">DEMO</span>
      </header>

      <nav className="oic-board-tabs" aria-label="Sample order statuses">
        {stages.map((stage) => (
          <button
            type="button"
            key={stage}
            className={activeTab === stage ? "active" : ""}
            onClick={() => setActiveTab(stage)}
            aria-pressed={activeTab === stage}
          >
            {stage}
          </button>
        ))}
      </nav>

      <div className="oic-board-body">
        {visible ? (
          <article className="oic-order-row">
            <div className="oic-order-row-top">
              <span>{sample.id}</span>
              <strong className={`oic-stage oic-stage--${sample.status.toLowerCase()}`}>
                {sample.status}
              </strong>
            </div>
            <h3>{sample.name}</h3>
            <p>{sample.quantity} × {sample.product}</p>
            <div className="oic-order-row-bottom">
              <strong>${sample.total}</strong>
              <small>{sample.status === "Shipped" ? "Tracking: DEMO-TRACK-10" : "Sample order only"}</small>
            </div>
          </article>
        ) : (
          <p className="oic-board-empty">
            No sample orders in {activeTab}. Select All to return to the demo order.
          </p>
        )}

        <div className="oic-board-actions">
          {next && (
            <button type="button" className="oic-board-primary" onClick={() => update(next)}>
              Move to {next} <ArrowRight size={15} />
            </button>
          )}
          {["Pending", "Confirmed"].includes(sample.status) && (
            <button type="button" className="oic-board-secondary" onClick={() => update("Cancelled")}>
              Cancel demo order
            </button>
          )}
          {["Delivered", "Cancelled"].includes(sample.status) && (
            <button type="button" className="oic-board-secondary" onClick={() => update("Pending")}>
              <RotateCcw size={14} /> Start again
            </button>
          )}
        </div>
      </div>
      <footer>
        Change a sample order's status to preview the workflow. No data is saved.
      </footer>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="oic-faq-list">
      {faqs.map(([question, answer], i) => (
        <article key={question} className={`oic-faq-item ${open === i ? "open" : ""}`}>
          <button
            type="button"
            aria-expanded={open === i}
            aria-controls={`oic-answer-${i}`}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {question}<ChevronDown size={20} />
          </button>
          <div id={`oic-answer-${i}`} hidden={open !== i}>
            <p>{answer}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function OrdersInChatPage() {
  const rootRef = useRef(null);
  const [demoOrder, setDemoOrder] = useState(null);
  const [sampleStatus, setSampleStatus] = useState("Pending");
  const currentOrder = demoOrder
    ? { ...demoOrder, status: sampleStatus }
    : null;

  useGSAP(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    gsap.to(".oic-blob", {
      rotation: 360, duration: 52, repeat: -1,
      ease: "none", stagger: 3,
    });
    gsap.to(".oic-blob", {
      x: 17, y: -13, duration: 7, repeat: -1,
      yoyo: true, ease: "sine.inOut", stagger: 0.85,
    });
    gsap.to(".oic-float", {
      y: -9, duration: 3, repeat: -1,
      yoyo: true, ease: "sine.inOut", stagger: 0.45,
    });
  }, { scope: rootRef });

  function createSampleOrder(order) {
    setDemoOrder(order);
    setSampleStatus("Pending");
  }

  return (
    <main className="oic-page" ref={rootRef}>
      {/* HERO */}
      <section className="oic-hero">
        <span className="oic-blob oic-blob-lavender" aria-hidden="true" />
        <span className="oic-blob oic-blob-yellow" aria-hidden="true" />
        <div className="oic-container oic-hero-grid">
          <div className="oic-hero-copy">
            <span className="oic-hero-label"><ShoppingBag size={16} /> ORDERS IN CHAT</span>
            <h1>Take orders <em>inside the chat.</em></h1>
            <p>
              Bellbee AI takes orders from your product catalog while customers are chatting.
              You confirm each new order, track its progress, and keep your customer informed.
            </p>
            <div className="oic-hero-actions">
              <Link to="/signup" className="oic-btn oic-btn-coral">
                Start with free credit <ArrowRight size={17} />
              </Link>
              <a className="oic-btn oic-btn-outline" href="#oic-how">See how it works</a>
            </div>
            <div className="oic-trust">
              <span><CheckCircle2 size={16} /> Your catalog and stock</span>
              <span><CheckCircle2 size={16} /> You control confirmation</span>
            </div>
          </div>
          <div className="oic-hero-visual">
            <span className="oic-float oic-float-top">
              <ShoppingCart size={16} /> Customer orders in chat
            </span>
            <ChatOrderPreview
              order={currentOrder}
              onPlace={createSampleOrder}
              onReset={() => {
                setDemoOrder(null);
                setSampleStatus("Pending");
              }}
            />
            <span className="oic-float oic-float-bottom">
              <Check size={16} /> You approve the order
            </span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="oic-section">
        <div className="oic-container">
          <Heading
            eyebrow="WHAT IT HELPS WITH"
            title="Your customers order."
            accent="You stay in control."
            description="Less manual typing, clear order tracking, and a confirmation step you control."
          />
          <div className="oic-grid oic-grid-three">
            {benefits.map((item) => <Tile key={item[1]} item={item} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="oic-section oic-section-light" id="oic-how">
        <div className="oic-container">
          <Heading
            eyebrow="HOW IT WORKS"
            title="From product to delivery."
            accent="All in one flow."
            description="Three straightforward steps turn a customer chat into an order your team can fulfill."
          />
          <div className="oic-grid oic-grid-three">
            {steps.map(([n, Icon, title, description]) => (
              <article className="oic-tile oic-step" key={n}>
                <span className="oic-step-number">{n}</span>
                <span className="oic-icon"><Icon size={23} /></span>
                <h3>{title}</h3><p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FROM CHAT TO ORDER */}
      <section className="oic-section">
        <div className="oic-container oic-split">
          <div>
            <Heading
              eyebrow="FROM CHAT TO ORDER"
              title="An order made with."
              accent="The right details."
              description="Bellbee checks the important information before creating an AI order."
            />
            <div className="oic-feature-list">
              {orderRules.map(([Icon, title, description]) => (
                <article className="oic-feature-row" key={title}>
                  <span className="oic-icon"><Icon size={19} /></span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </article>
              ))}
            </div>
          </div>
          <div className="oic-screenshot">
            <img
              src="https://bellbee.ai/assets/order-and-booking-bGQXjz74.webp"
              alt="Bellbee Messenger conversation demonstrating a customer order and booking"
              loading="lazy"
            />
            <p><CheckCircle2 size={16} /> Orders and bookings handled inside the conversation</p>
          </div>
        </div>
      </section>

      {/* CUSTOMER UPDATES */}
      <section className="oic-section oic-section-light">
        <div className="oic-container">
          <Heading
            eyebrow="KEEP CUSTOMERS INFORMED"
            title="Your customer knows."
            accent="What's happening next."
            description="Every important stage of the order stays connected to the original conversation."
          />
          <div className="oic-grid oic-grid-four">
            {updates.map((item) => <Tile key={item[1]} item={item} />)}
          </div>
        </div>
      </section>

      {/* ORDERS SCREEN */}
      <section className="oic-section">
        <div className="oic-container oic-split">
          <div>
            <Heading
              eyebrow="YOUR ORDERS SCREEN"
              title="Keep every order."
              accent="Moving forward."
              description="Manage statuses, add larger orders manually, print labels, and maintain your product catalog."
            />
            <div className="oic-feature-list">
              {dashboardFeatures.map(([Icon, title, description]) => (
                <article className="oic-feature-row" key={title}>
                  <span className="oic-icon"><Icon size={19} /></span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </article>
              ))}
            </div>
            <div className="oic-mini-tools">
              <span><FileDown size={15} /> CSV export</span>
              <span><Printer size={15} /> Shipping labels</span>
            </div>
          </div>
          <OrdersBoard
            order={currentOrder || {
              id: "DEMO-1042",
              name: "Sarah Carter",
              product: "Classic Tote Bag",
              quantity: 1,
              total: 24,
              status: sampleStatus,
            }}
            onStatus={setSampleStatus}
          />
        </div>
      </section>

      {/* PAYMENTS */}
      <section className="oic-section oic-section-light">
        <div className="oic-container">
          <Heading
            eyebrow="GETTING PAID"
            title="Your payment method."
            accent="Your approval."
            description="Take cash on delivery or share your own payment details. Your team confirms payments."
          />
          <div className="oic-grid oic-grid-three">
            {paymentOptions.map((item) => <Tile key={item[1]} item={item} />)}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="oic-section">
        <div className="oic-container">
          <Heading eyebrow="GOOD TO KNOW" title="Simple requirements." accent="Clear limits." />
          <div className="oic-grid oic-grid-two">
            <article className="oic-info-card">
              <h3><CheckCircle2 size={21} /> What you need</h3>
              <ul>
                <li>Products with prices and stock in your Bellbee catalog.</li>
                <li>A connected WhatsApp, Instagram or Messenger channel.</li>
                <li>Payment preferences in Settings → Automation.</li>
              </ul>
            </article>
            <article className="oic-info-card oic-info-card-yellow">
              <h3><ShieldCheck size={21} /> What it does not do</h3>
              <ul>
                <li>It doesn't take orders through website chat; visitors are directed to WhatsApp.</li>
                <li>It doesn't accept orders in Instagram or Facebook comments; customers are invited to a private chat.</li>
                <li>An AI-created order has one product. Larger baskets can be entered manually.</li>
                <li>The AI does not verify payments. Your team confirms each payment.</li>
              </ul>
            </article>
          </div>
          <p className="oic-centered-note">
            <UserRound size={17} /> A person can take over any chat when the customer asks for help.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="oic-section oic-section-light">
        <div className="oic-container oic-faq-container">
          <Heading
            eyebrow="FREQUENTLY ASKED QUESTIONS"
            title="Questions about."
            accent="Orders in chat?"
            centered
          />
          <FAQ />
        </div>
      </section>

      {/* RELATED */}
      <section className="oic-section">
        <div className="oic-container">
          <Heading eyebrow="EXPLORE MORE" title="More ways Bellbee." accent="Helps your business." />
          <div className="oic-grid oic-grid-three">
            {related.map(([Icon, title, description, path]) => (
              <Link to={path} key={path} className="oic-tile oic-related">
                <span className="oic-icon"><Icon size={23} /></span>
                <ArrowUpRight className="oic-related-arrow" size={20} />
                <h3>{title}</h3><p>{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COMPACT CTA */}
      <section className="oic-cta-section">
        <div className="oic-container">
          <div className="oic-cta">
            <span className="oic-blob oic-cta-blob-lavender" aria-hidden="true" />
            <span className="oic-blob oic-cta-blob-yellow" aria-hidden="true" />
            <div className="oic-cta-content">
              <span className="oic-cta-kicker">
                <Sparkles size={15} /> FROM CHAT TO ORDER
              </span>
              <h2>Make every conversation <em>an opportunity.</em></h2>
              <p>Let customers order in chat while you control confirmation and fulfillment.</p>
              <Link to="/signup" className="oic-btn oic-btn-coral">
                Start with free credit <ArrowRight size={17} />
              </Link>
              <small>No credit card required to start.</small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
