
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck,
  CalendarDays,
  Check,
  // CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coffee,
  // FileText,
  Headphones,
  Leaf,
  MapPin,
  MessageCircle,
  // Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  // Store,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import "./RestaurantsPage.css";

gsap.registerPlugin(useGSAP);

/* ============================================
   RESTAURANTS & CAFES — PAGE DATA
============================================ */

const benefits = [
  {
    Icon: Clock3,
    title: "Are you open on bank holidays?",
    description:
      "Your AI answers from the weekly hours, holidays and short days you add.",
  },
  {
    Icon: Leaf,
    title: "Do you have a vegetarian option?",
    description:
      "Your AI uses your menu, FAQs and uploaded PDFs to answer food questions.",
  },
  {
    Icon: CalendarDays,
    title: "Booking questions at the busiest time",
    description:
      "Your AI offers times according to your booking rules and collects guest details.",
  },
  {
    Icon: Users,
    title: "No-shows",
    description:
      "Reminders go out before confirmed bookings, and your team can mark no-shows.",
  },
  {
    Icon: ShoppingBag,
    title: "Orders by message",
    description:
      "Your AI can create orders from items you added, with delivery details.",
  },
];

const steps = [
  {
    number: "01",
    Icon: Clock3,
    title: "Add your hours and answers",
    description:
      "Enter opening hours, holidays, your menu and common guest questions.",
  },
  {
    number: "02",
    Icon: CalendarCheck,
    title: "Add a booking service",
    description:
      "Set up bookings and add questions such as how many people are coming.",
  },
  {
    number: "03",
    Icon: MessageCircle,
    title: "Connect your channel",
    description:
      "Connect WhatsApp, Instagram or Messenger to your business.",
  },
  {
    number: "04",
    Icon: Headphones,
    title: "Let your AI answer",
    description:
      "Your AI helps guests, and your team confirms bookings or takes over.",
  },
];

const stories = [
  {
    Icon: Clock3,
    time: "09:30 AM",
    title: "Are you open on Sunday?",
    customer:
      "Are you open on Sunday, and what about Easter Monday?",
    answer:
      "Your AI checks the opening hours and holiday exceptions you provided.",
    link: "/ai-brain",
  },
  {
    Icon: CalendarCheck,
    time: "12:45 PM",
    title: "A table for four on Friday",
    customer: "Table for four on Friday at 7?",
    answer:
      "Your AI checks booking rules, collects details and requests a booking for confirmation.",
    link: "/appointment-booking",
  },
  {
    Icon: Leaf,
    time: "06:20 PM",
    title: "Do you do gluten free?",
    customer: "Is this dish gluten free?",
    answer:
      "Your AI repeats what your menu or FAQs say, or hands over if it cannot verify the answer.",
    link: "/ai-brain",
  },
  {
    Icon: CalendarDays,
    time: "08:10 PM",
    title: "Can we move our booking?",
    customer:
      "Can we move our Friday booking to Saturday?",
    answer:
      "Your team receives the old and requested new time. The booking changes when you accept.",
    link: "/appointment-booking",
  },
];

const knowledgeItems = [
  {
    Icon: Clock3,
    number: "01",
    title: "Opening hours and holidays",
    description:
      "Add weekly hours, closed days and shorter opening days.",
  },
  {
    Icon: UtensilsCrossed,
    number: "02",
    title: "Your menu",
    description:
      "Add menu items as products, or upload a PDF with your menu information.",
  },
  {
    Icon: CalendarCheck,
    number: "03",
    title: "A booking service",
    description:
      "Add a service and questions such as party size.",
  },
  {
    Icon: MapPin,
    number: "04",
    title: "Everything guests ask",
    description:
      "Add parking, directions, dress code and other common questions as FAQs.",
  },
];

const questions = [
  {
    question: "Can guests book a table by message?",
    answer:
      "Yes. Guests can ask for a booking through WhatsApp, Instagram or Messenger. Your AI checks your configured booking rules, asks for details and creates a booking request. Your team confirms the booking.",
  },
  {
    question: "Can my AI answer menu questions?",
    answer:
      "Yes. Add your menu as products, FAQs or an uploaded PDF. Bellbee Ai answers using the information you provide. It does not independently verify ingredients or allergens.",
  },
  {
    question:
      "How does it handle bank holidays and closed days?",
    answer:
      "Add your regular opening hours and any holiday exceptions or short days. Your AI can then use those settings to answer opening-hour questions and avoid offering booking times while you are closed.",
  },
  {
    question:
      "Can I cut down on guests who do not turn up?",
    answer:
      "Bellbee can send reminders before confirmed bookings, helping guests remember their appointments. You can also mark a booking as a no-show, although reminders cannot guarantee attendance.",
  },
  {
    question: "Can guests order food in the chat?",
    answer:
      "Yes. Your AI can take a single-product order using the items you added, collecting the customer's name, address and city. More complex orders can be handled by your team.",
  },
  {
    question:
      "What if a guest has a question my AI cannot answer?",
    answer:
      "Your team can take over the conversation in the Bellbee inbox. Your AI can also hand the chat over when a guest requests a person or the question cannot be resolved.",
  },
  {
    question:
      "How quickly can we be up and running?",
    answer:
      "Once you have added your opening hours, business answers and menu, configured a booking service if needed, and connected a supported channel, you can start using your AI. Setup time depends on your business information and channel connection.",
  },
];

const relatedPages = [
  {
    Icon: CalendarCheck,
    title: "Appointment booking",
    description:
      "Book, move and cancel appointments around your opening hours.",
    to: "/appointment-booking",
  },
  {
    Icon: Bot,
    title: "AI Brain",
    description:
      "Keep your opening hours, FAQs and documents in one place.",
    to: "/ai-brain",
  },
  {
    Icon: Sparkles,
    title: "Salons and beauty",
    description:
      "Help customers book appointments with the right team member.",
    to: "/ai-chat-for-salons",
  },
];

/* ============================================
   REUSABLE COMPONENTS
============================================ */

function SectionHeading({
  label,
  title,
  accent,
  description,
  center = false,
}) {
  return (
    <div
      className={`rc-heading ${
        center ? "rc-heading-center" : ""
      }`}
    >
      <span className="rc-kicker">{label}</span>

      <h2>
        {title} {accent && <em>{accent}</em>}
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureCard({ Icon, title, description, index }) {
  const colors = [
    "lavender",
    "yellow",
    "coral",
    "green",
  ];

  return (
    <article className="rc-feature-card">
      <div
        className={`rc-icon rc-icon-${
          colors[index % colors.length]
        }`}
      >
        <Icon size={23} strokeWidth={1.9} />
      </div>

      <span className="rc-feature-number">
        {String(index + 1).padStart(2, "0")}
      </span>

      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function ChatMessage({ sender = "ai", children }) {
  return (
    <div className={`rc-chat-message rc-chat-${sender}`}>
      {sender === "ai" && (
        <div className="rc-chat-avatar">
          <Bot size={15} />
        </div>
      )}

      <div className="rc-chat-bubble">{children}</div>
    </div>
  );
}

/* ============================================
   INTERACTIVE RESTAURANT CHAT DEMO
   FRONTEND ONLY
============================================ */

const demoTabs = [
  {
    id: "hours",
    label: "Opening hours",
    Icon: Clock3,
  },
  {
    id: "menu",
    label: "Menu",
    Icon: UtensilsCrossed,
  },
  {
    id: "booking",
    label: "Book a table",
    Icon: CalendarDays,
  },
  {
    id: "human",
    label: "Human help",
    Icon: Headphones,
  },
];

const demoMenu = [
  {
    name: "Garden veggie bowl",
    price: "£12",
    tag: "Vegetarian",
    Icon: Leaf,
  },
  {
    name: "Grilled chicken plate",
    price: "£16",
    tag: "Popular",
    Icon: UtensilsCrossed,
  },
  {
    name: "Cappuccino",
    price: "£4",
    tag: "Drinks",
    Icon: Coffee,
  },
];

const demoSlots = [
  { id: "fri-630", label: "Fri · 6:30 PM" },
  { id: "fri-700", label: "Fri · 7:00 PM" },
  { id: "sat-600", label: "Sat · 6:00 PM" },
  { id: "sat-730", label: "Sat · 7:30 PM" },
];

function RestaurantChatDemo() {
  const [activeTab, setActiveTab] = useState("booking");
  const [selectedSlot, setSelectedSlot] =
    useState("fri-700");
  const [guests, setGuests] = useState(4);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [bookingRequested, setBookingRequested] =
    useState(false);
  const [humanRequested, setHumanRequested] =
    useState(false);

  const selectedTime =
    demoSlots.find((slot) => slot.id === selectedSlot)
      ?.label || demoSlots[0].label;

  function changeTab(tab) {
    setActiveTab(tab);
    setBookingRequested(false);
    setHumanRequested(false);
  }

  function submitBooking(event) {
    event.preventDefault();

    if (
      !guestName.trim() ||
      !guestPhone.trim() ||
      !selectedSlot
    ) {
      return;
    }

    setBookingRequested(true);
  }

  return (
    <div
      className="rc-demo"
      aria-label="Interactive restaurant chat demonstration"
    >
      <div className="rc-demo-header">
        <div className="rc-demo-brand-icon">
          <Coffee size={23} />
        </div>

        <div className="rc-demo-brand-text">
          <strong>Juniper Cafe</strong>
          <span>
            <i />
            Bellbee Ai assistant
          </span>
        </div>

        <div className="rc-demo-badge">DEMO</div>
      </div>

      <div
        className="rc-demo-tabs"
        role="group"
        aria-label="Choose a chat example"
      >
        {demoTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "active" : ""}
            aria-pressed={activeTab === id}
            onClick={() => changeTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        key={activeTab}
        className="rc-chat-window"
        aria-live="polite"
      >
        <div className="rc-chat-date">
          Sample customer conversation
        </div>

        {activeTab === "hours" && (
          <>
            <ChatMessage sender="customer">
              Hi! Are you open on Sunday? And what about
              Easter Monday?
            </ChatMessage>

            <ChatMessage>
              Hi there! Let me check the opening hours
              saved for our cafe.
            </ChatMessage>

            <div className="rc-hours-panel">
              <div className="rc-panel-heading">
                <Clock3 size={17} />
                <strong>Our opening hours</strong>
              </div>

              <div className="rc-hours-row">
                <span>Monday – Friday</span>
                <strong>9 AM – 9 PM</strong>
              </div>

              <div className="rc-hours-row">
                <span>Saturday</span>
                <strong>10 AM – 10 PM</strong>
              </div>

              <div className="rc-hours-row">
                <span>Sunday</span>
                <strong>10 AM – 4 PM</strong>
              </div>

              <div className="rc-hours-holiday">
                <XCircle size={16} />
                <span>Easter Monday: Closed</span>
              </div>
            </div>

            <ChatMessage>
              We're open on Sunday from 10 AM to 4 PM.
              Easter Monday is listed as a closed day in
              this example.
            </ChatMessage>
          </>
        )}

        {activeTab === "menu" && (
          <>
            <ChatMessage sender="customer">
              Do you have any vegetarian food?
            </ChatMessage>

            <ChatMessage>
              Yes! Here's an example of what we have
              listed on our menu.
            </ChatMessage>

            <div className="rc-menu-panel">
              <div className="rc-panel-heading">
                <UtensilsCrossed size={18} />
                <strong>Sample cafe menu</strong>
              </div>

              {demoMenu.map(
                ({ name, price, tag, Icon }) => (
                  <div className="rc-menu-item" key={name}>
                    <span className="rc-menu-icon">
                      <Icon size={18} />
                    </span>

                    <div>
                      <strong>{name}</strong>
                      <small>{tag}</small>
                    </div>

                    <b>{price}</b>
                  </div>
                )
              )}
            </div>

            <ChatMessage>
              Our Garden veggie bowl is marked
              vegetarian in this example. If you have
              allergies or special dietary requirements,
              our team can help confirm the details.
            </ChatMessage>
          </>
        )}

        {activeTab === "booking" && (
          <>
            <ChatMessage sender="customer">
              Hello! Can I book a table for four on
              Friday at 7?
            </ChatMessage>

            <ChatMessage>
              Of course! Here are some example times
              from our booking schedule. Choose one
              and tell me your details.
            </ChatMessage>

            <form
              className="rc-booking-panel"
              onSubmit={submitBooking}
            >
              <div className="rc-panel-heading">
                <CalendarCheck size={18} />
                <strong>Table booking request</strong>
                <span className="rc-panel-demo">
                  DEMO
                </span>
              </div>

              <label className="rc-field-label">
                Number of guests
              </label>

              <div className="rc-guest-stepper">
                <span>
                  <Users size={16} />
                  Party size
                </span>

                <div>
                  <button
                    type="button"
                    aria-label="Decrease guests"
                    disabled={
                      guests <= 1 || bookingRequested
                    }
                    onClick={() =>
                      setGuests((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                  >
                    −
                  </button>

                  <strong>{guests}</strong>

                  <button
                    type="button"
                    aria-label="Increase guests"
                    disabled={
                      guests >= 12 || bookingRequested
                    }
                    onClick={() =>
                      setGuests((value) =>
                        Math.min(12, value + 1)
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <label className="rc-field-label">
                Preferred time
              </label>

              <div className="rc-time-options">
                {demoSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={bookingRequested}
                    className={
                      selectedSlot === slot.id
                        ? "selected"
                        : ""
                    }
                    aria-pressed={
                      selectedSlot === slot.id
                    }
                    onClick={() =>
                      setSelectedSlot(slot.id)
                    }
                  >
                    {slot.label}
                  </button>
                ))}
              </div>

              <small className="rc-demo-disclaimer">
                Illustrative times only. No live
                availability is being checked.
              </small>

              {!bookingRequested ? (
                <>
                  <div className="rc-input-grid">
                    <label>
                      Your name
                      <input
                        type="text"
                        placeholder="Example: Alex"
                        maxLength={70}
                        value={guestName}
                        onChange={(e) =>
                          setGuestName(e.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Phone number
                      <input
                        type="tel"
                        placeholder="Example number"
                        maxLength={30}
                        value={guestPhone}
                        onChange={(e) =>
                          setGuestPhone(e.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="rc-booking-submit"
                    disabled={
                      !guestName.trim() ||
                      !guestPhone.trim()
                    }
                  >
                    Request sample booking
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <div
                  className="rc-booking-success"
                  role="status"
                >
                  <CheckCircle2 size={28} />

                  <strong>
                    Sample booking requested
                  </strong>

                  <p>
                    {guests} guests · {selectedTime}
                  </p>

                  <span>
                    Awaiting restaurant confirmation.
                    Nothing was booked or sent.
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setBookingRequested(false)
                    }
                  >
                    Edit sample booking
                  </button>
                </div>
              )}
            </form>
          </>
        )}

        {activeTab === "human" && (
          <>
            <ChatMessage sender="customer">
              I have a question about food allergies.
              Can I speak with someone?
            </ChatMessage>

            <ChatMessage>
              Of course. For allergy information,
              speaking directly with our team is best.
              I can hand over this conversation.
            </ChatMessage>

            <div className="rc-human-panel">
              <div className="rc-human-icon">
                <Headphones size={25} />
              </div>

              <h3>Talk to our team</h3>

              <p>
                A person can continue the conversation
                from the Bellbee inbox.
              </p>

              {!humanRequested ? (
                <button
                  type="button"
                  onClick={() =>
                    setHumanRequested(true)
                  }
                >
                  Request sample handoff
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div
                  className="rc-human-success"
                  role="status"
                >
                  <CheckCircle2 size={18} />
                  Demo handoff requested
                </div>
              )}
            </div>

            {humanRequested && (
              <ChatMessage>
                Your handoff has been simulated. In a
                real conversation, your team can take
                over in Bellbee.
              </ChatMessage>
            )}
          </>
        )}
      </div>

      <div className="rc-demo-footer">
        <ShieldCheck size={15} />
        Frontend demo only — no messages or
        bookings are sent.
      </div>
    </div>
  );
}

/* ============================================
   WEEKLY BOOKING CALENDAR ILLUSTRATION
============================================ */

const calendarDays = [
  { name: "MON", day: "12" },
  { name: "TUE", day: "13" },
  { name: "WED", day: "14" },
  { name: "THU", day: "15" },
  { name: "FRI", day: "16" },
  { name: "SAT", day: "17" },
  { name: "SUN", day: "18" },
];

const calendarEvents = [
  {
    day: 0,
    start: 1,
    duration: 2,
    title: "Morning booking",
    time: "10:00 AM",
    color: "lavender",
  },
  {
    day: 2,
    start: 3,
    duration: 2,
    title: "Lunch booking",
    time: "12:30 PM",
    color: "yellow",
  },
  {
    day: 4,
    start: 5,
    duration: 3,
    title: "Table for four",
    time: "7:00 PM",
    color: "coral",
  },
  {
    day: 5,
    start: 2,
    duration: 2,
    title: "Cafe booking",
    time: "11:30 AM",
    color: "green",
  },
];

function BookingCalendar() {
  return (
    <div className="rc-calendar-preview">
      <div className="rc-calendar-top">
        <div>
          <span className="rc-mini-kicker">
            BOOKING OVERVIEW
          </span>
          <h3>Your bookings, in one place.</h3>
          <p>
            An illustrative weekly calendar,
            including a booking requested in chat.
          </p>
        </div>

        <span className="rc-calendar-badge">
          <CalendarDays size={16} />
          Demo
        </span>
      </div>

      <div className="rc-calendar-board">
        <div className="rc-calendar-corner">
          <CalendarDays size={17} />
        </div>

        {calendarDays.map((day) => (
          <div
            className="rc-calendar-day"
            key={day.name}
          >
            <small>{day.name}</small>
            <strong>{day.day}</strong>
          </div>
        ))}

        {[
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
        ].map((time) => (
          <React.Fragment key={time}>
            <span className="rc-calendar-time">
              {time}
            </span>
            {calendarDays.map((day) => (
              <div
                key={`${day.name}-${time}`}
                className="rc-calendar-cell"
              />
            ))}
          </React.Fragment>
        ))}

        {calendarEvents.map((event, index) => (
          <div
            key={index}
            className={`rc-calendar-event rc-event-${event.color}`}
            style={{
              gridColumn: event.day + 2,
              gridRow: `${event.start + 2} / span ${
                event.duration
              }`,
            }}
          >
            <strong>{event.title}</strong>
            <small>{event.time}</small>
          </div>
        ))}
      </div>

      <div className="rc-calendar-bottom">
        <span>
          <span className="rc-legend-dot" />
          Example booking
        </span>

        <span>
          <CheckCircle2 size={15} />
          Review and confirm requests
        </span>
      </div>
    </div>
  );
}

/* ============================================
   FAQ
============================================ */

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="rc-faq-list">
      {questions.map(({ question, answer }, index) => (
        <article
          key={question}
          className={`rc-faq-item ${
            openIndex === index ? "open" : ""
          }`}
        >
          <h3>
            <button
              type="button"
              aria-expanded={openIndex === index}
              aria-controls={`rc-faq-${index}`}
              onClick={() =>
                setOpenIndex(
                  openIndex === index ? -1 : index
                )
              }
            >
              <span>{question}</span>
              <ChevronDown size={19} />
            </button>
          </h3>

          <div
            id={`rc-faq-${index}`}
            hidden={openIndex !== index}
          >
            <p>{answer}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ============================================
   MAIN PAGE
============================================ */

export default function RestaurantsPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      gsap.from(".rc-hero-content > *", {
        opacity: 0,
        y: 22,
        duration: 0.8,
        stagger: 0.11,
        ease: "power2.out",
      });

      gsap.from(".rc-demo", {
        opacity: 0,
        y: 35,
        scale: 0.975,
        duration: 1,
        delay: 0.15,
        ease: "power3.out",
      });

      gsap.to(".rc-orb", {
        rotation: 360,
        duration: 65,
        repeat: -1,
        ease: "none",
        stagger: 0.4,
      });

      gsap.to(".rc-floating-tag", {
        y: -8,
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: "sine.inOut",
        stagger: 0.6,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="rc-page" ref={pageRef}>
      {/* ===================================
          HERO
      =================================== */}

      <section className="rc-hero">
        <span
          className="rc-orb rc-orb-lavender"
          aria-hidden="true"
        />
        <span
          className="rc-orb rc-orb-yellow"
          aria-hidden="true"
        />

        <div className="rc-container rc-hero-grid">
          <div className="rc-hero-content">
            <span className="rc-hero-pill">
              <Coffee size={16} />
              RESTAURANTS & CAFES
            </span>

            <h1>
              Answer the questions guests message you,{" "}
              <em>so your team can serve.</em>
            </h1>

            <p>
              Guests message your restaurant or cafe on
              WhatsApp, Instagram or Messenger. Bellbee Ai
              answers the usual questions using your hours,
              menu and business information. It can take
              booking requests, while your team focuses on
              serving guests.
            </p>

            <div className="rc-hero-actions">
              <Link
                to="/signup"
                className="rc-btn rc-btn-coral"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <a
                href="#rc-how"
                className="rc-btn rc-btn-outline"
              >
                See how it works
              </a>
            </div>

            <div className="rc-hero-trust">
              <span>
                <CheckCircle2 size={16} />
                Hours and menu answers
              </span>
              <span>
                <CheckCircle2 size={16} />
                Booking requests
              </span>
              <span>
                <CheckCircle2 size={16} />
                Human handoff
              </span>
            </div>
          </div>

          <div className="rc-hero-visual">
            <span className="rc-floating-tag rc-floating-top">
              <Sparkles size={15} />
              Questions answered, any hour
            </span>

            <RestaurantChatDemo />

            <span className="rc-floating-tag rc-floating-bottom">
              <CalendarCheck size={16} />
              Your team stays in control
            </span>
          </div>
        </div>
      </section>

      {/* ===================================
          BENEFITS
      =================================== */}

      <section
        className="rc-section"
        id="rc-benefits"
      >
        <div className="rc-container">
          <SectionHeading
            label="WHAT IT HELPS WITH"
            title="Less time answering messages."
            accent="More time with guests."
            description="From opening hours and menu questions to booking requests, give guests useful answers while your team gets on with service."
          />

          <div className="rc-benefits-grid">
            {benefits.map((item, index) => (
              <FeatureCard
                key={item.title}
                {...item}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===================================
          HOW IT WORKS
      =================================== */}

      <section
        className="rc-section rc-section-light"
        id="rc-how"
      >
        <div className="rc-container">
          <SectionHeading
            label="HOW IT WORKS"
            title="Your restaurant knowledge."
            accent="Your AI assistant."
            description="Set up your information and booking rules, connect your channels, and let Bellbee help guests in chat."
          />

          <div className="rc-steps-grid">
            {steps.map(
              ({
                number,
                Icon,
                title,
                description,
              }, index) => (
                <article
                  className="rc-step-card"
                  key={number}
                >
                  <span className="rc-step-number">
                    {number}
                  </span>

                  <div
                    className={`rc-icon rc-icon-${
                      [
                        "lavender",
                        "yellow",
                        "coral",
                        "green",
                      ][index]
                    }`}
                  >
                    <Icon size={23} />
                  </div>

                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              )
            )}
          </div>

          <div className="rc-calendar-section">
            <div className="rc-calendar-copy">
              <span className="rc-kicker">
                BOOKINGS IN ONE PLACE
              </span>

              <h2>
                Your calendar stays{" "}
                <em>easy to follow.</em>
              </h2>

              <p>
                When guests ask for a booking, Bellbee
                uses your configured appointment
                availability and collects the details.
                You can see requests in your bookings
                calendar and confirm them.
              </p>

              <div className="rc-calendar-points">
                <div>
                  <CheckCircle2 size={18} />
                  <span>
                    Booking requests from conversations
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={18} />
                  <span>
                    Reminders before confirmed bookings
                  </span>
                </div>

                <div>
                  <CheckCircle2 size={18} />
                  <span>
                    Review requests and mark no-shows
                  </span>
                </div>
              </div>

              <Link
                to="/appointment-booking"
                className="rc-text-link"
              >
                Explore appointment booking
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <BookingCalendar />
          </div>
        </div>
      </section>

      {/* ===================================
          A DAY IN THE CHAT
      =================================== */}

      <section
        className="rc-section"
        id="rc-day"
      >
        <div className="rc-container">
          <SectionHeading
            label="A DAY IN THE CHAT"
            title="Guest messages come in."
            accent="Bellbee helps out."
            description="A few examples of everyday restaurant conversations. These are examples, not real guests."
          />

          <div className="rc-stories-grid">
            {stories.map(
              ({
                Icon,
                time,
                title,
                customer,
                answer,
                link,
              }, index) => (
                <article
                  className={`rc-story-card ${
                    index === 0
                      ? "rc-story-featured"
                      : ""
                  }`}
                  key={title}
                >
                  <div className="rc-story-top">
                    <span className="rc-story-time">
                      <Clock3 size={13} />
                      {time}
                    </span>

                    <span className="rc-story-icon">
                      <Icon size={21} />
                    </span>
                  </div>

                  <h3>{title}</h3>

                  <div className="rc-story-message">
                    <MessageCircle size={16} />
                    <span>“{customer}”</span>
                  </div>

                  <p>{answer}</p>

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

      {/* ===================================
          WHAT TO ADD FIRST
      =================================== */}

      <section
        className="rc-section rc-section-light"
        id="rc-setup"
      >
        <div className="rc-container">
          <SectionHeading
            label="WHAT TO ADD FIRST"
            title="Give your AI the details."
            accent="It handles the questions."
            description="Your AI only knows what you provide. Start with the information your guests ask for most."
          />

          <div className="rc-knowledge-grid">
            {knowledgeItems.map(
              ({
                Icon,
                number,
                title,
                description,
              }, index) => (
                <article
                  className="rc-knowledge-card"
                  key={title}
                >
                  <div className="rc-knowledge-top">
                    <span
                      className={`rc-icon rc-icon-${
                        [
                          "yellow",
                          "lavender",
                          "coral",
                          "green",
                        ][index]
                      }`}
                    >
                      <Icon size={22} />
                    </span>

                    <span>{number}</span>
                  </div>

                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================
          WHAT YOU NEED / LIMITATIONS
      =================================== */}

      <section
        className="rc-section"
        id="rc-limits"
      >
        <div className="rc-container">
          <SectionHeading
            label="GOOD TO KNOW"
            title="What you need."
            accent="And what to expect."
            description="Bellbee works with your business information and rules. Here is what you provide and where your team remains in control."
          />

          <div className="rc-limits-grid">
            <article className="rc-limits-card rc-limits-yes">
              <div className="rc-limits-header">
                <span>
                  <CheckCircle2 size={23} />
                </span>

                <h3>What you need</h3>
              </div>

              <ul>
                <li>
                  <Check size={18} />
                  <span>
                    Your opening hours and a menu
                    as products or a PDF.
                  </span>
                </li>

                <li>
                  <Check size={18} />
                  <span>
                    A booking service, if guests
                    will book by message.
                  </span>
                </li>

                <li>
                  <Check size={18} />
                  <span>
                    A connected WhatsApp, Instagram
                    or Messenger channel.
                  </span>
                </li>
              </ul>
            </article>

            <article className="rc-limits-card rc-limits-no">
              <div className="rc-limits-header">
                <span>
                  <ShieldCheck size={23} />
                </span>

                <h3>What it does not do</h3>
              </div>

              <ul>
                <li>
                  <XCircle size={17} />
                  <span>
                    It does not manage tables or
                    individual seats. Booking rules
                    only limit overlapping bookings.
                  </span>
                </li>

                <li>
                  <XCircle size={17} />
                  <span>
                    It does not guarantee allergen
                    information. It repeats only
                    what you have provided.
                  </span>
                </li>

                <li>
                  <XCircle size={17} />
                  <span>
                    Bookings do not collect deposits
                    or payments.
                  </span>
                </li>

                <li>
                  <XCircle size={17} />
                  <span>
                    Website chat does not take
                    bookings. Visitors there are
                    directed to WhatsApp.
                  </span>
                </li>
              </ul>
            </article>
          </div>

          <div className="rc-handoff-banner">
            <span>
              <Headphones size={23} />
            </span>

            <p>
              <strong>Need a human touch?</strong>{" "}
              Your team can take over any conversation
              in the Bellbee inbox, and your AI can
              hand over when guests request a person.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================
          FAQ
      =================================== */}

      <section
        className="rc-section rc-section-light"
        id="rc-faq"
      >
        <div className="rc-container rc-faq-layout">
          <div className="rc-faq-intro">
            <SectionHeading
              label="QUESTIONS"
              title="Good questions."
              accent="Clear answers."
              description="Everything you might want to know about restaurant chat, bookings and getting started."
            />

            <div className="rc-faq-note">
              <Coffee size={30} />
              <span>
                Fewer repeated questions.
                More time for your guests.
              </span>
            </div>
          </div>

          <FAQAccordion />
        </div>
      </section>

      {/* ===================================
          RELATED PAGES
      =================================== */}

      <section
        className="rc-section"
        id="rc-related"
      >
        <div className="rc-container">
          <SectionHeading
            label="RELATED"
            title="More ways Bellbee"
            accent="can help."
          />

          <div className="rc-related-grid">
            {relatedPages.map(
              ({
                Icon,
                title,
                description,
                to,
              }) => (
                <Link
                  to={to}
                  className="rc-related-card"
                  key={title}
                >
                  <span className="rc-related-icon">
                    <Icon size={24} />
                  </span>

                  <h3>{title}</h3>
                  <p>{description}</p>

                  <span className="rc-related-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================
          COMPACT FINAL CTA
      =================================== */}

      <section className="rc-cta-section">
        <div className="rc-container">
          <div className="rc-cta">
            <span
              className="rc-cta-shape"
              aria-hidden="true"
            />

            <div className="rc-cta-copy">
              <span className="rc-cta-label">
                <Sparkles size={16} />
                GET STARTED WITH BELLBEE AI
              </span>

              <h2>
                Let your team serve.{" "}
                <em>We'll help with the messages.</em>
              </h2>

              <p>
                Get started with free credit.
                No credit card required.
              </p>
            </div>

            <Link
              to="/signup"
              className="rc-btn rc-btn-coral rc-cta-button"
            >
              Start with free credit
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
