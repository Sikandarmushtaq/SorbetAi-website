
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Bot,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  ListChecks,
  MessageCircle,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import "./AppointmentBookingPage.css";

gsap.registerPlugin(useGSAP);

/* =========================================
   PAGE DATA
========================================= */

const benefits = [
  {
    icon: CalendarClock,
    color: "lavender",
    title: "No more booking back and forth",
    description:
      "Customers ask for a time. Your AI checks availability and offers free slots.",
  },
  {
    icon: Clock3,
    color: "yellow",
    title: "What is free on Friday?",
    description:
      "Your AI can answer with available times instead of making customers wait.",
  },
  {
    icon: RefreshCcw,
    color: "coral",
    title: "Changes and cancellations",
    description:
      "Customers can ask to move or cancel appointments in the same conversation.",
  },
  {
    icon: Users,
    color: "green",
    title: "Handle busy days",
    description:
      "Set capacity, minimum notice and gaps between appointments.",
  },
];

const steps = [
  {
    number: "01",
    icon: Settings2,
    title: "Set your hours and team",
    description:
      "Add opening hours, breaks, closed days and staff availability.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "A customer asks to book",
    description:
      "AI offers available times and collects booking details.",
  },
  {
    number: "03",
    icon: CalendarCheck2,
    title: "You confirm",
    description:
      "Bookings wait for approval unless instant confirmation is enabled.",
  },
  {
    number: "04",
    icon: BellRing,
    title: "Reminders and changes",
    description:
      "Customers receive reminders and can request changes or cancellation.",
  },
];

const availabilityFeatures = [
  {
    icon: Clock3,
    title: "Hours, breaks and closed days",
    description:
      "AI follows your weekly hours, breaks, holidays and shorter opening days.",
  },
  {
    icon: Users,
    title: "Team availability",
    description:
      "Each team member can have separate working hours and days off.",
  },
  {
    icon: Settings2,
    title: "Your booking rules",
    description:
      "Control start-time intervals, appointment gaps, minimum notice, advance booking and capacity.",
  },
  {
    icon: ShieldCheck,
    title: "No booking clashes",
    description:
      "When a time is already taken, another available time is offered.",
  },
];

const changes = [
  {
    icon: RefreshCcw,
    title: "A customer requests a move",
    description:
      "Your team sees the old and requested new time. The booking moves only when you accept.",
  },
  {
    icon: XCircle,
    title: "A customer cancels",
    description:
      "Customers can cancel in chat before the appointment is over, and your team is notified.",
  },
  {
    icon: CalendarClock,
    title: "You propose a time",
    description:
      "Suggest another time with a reason, or move a booking yourself.",
  },
  {
    icon: UserRound,
    title: "You can book manually",
    description:
      "Create bookings yourself, including outside normal hours after a warning.",
  },
];

const calendarFeatures = [
  {
    icon: CalendarDays,
    title: "Calendar and list views",
    description:
      "See bookings by day or list, and filter by status or staff member.",
  },
  {
    icon: ListChecks,
    title: "Clear booking statuses",
    description:
      "Pending, asks to move, waiting for customer, confirmed, served, no-show, cancelled and expired.",
  },
  {
    icon: BellRing,
    title: "Customers are informed",
    description:
      "Booking confirmations, cancellations, served and no-show updates can be sent to the customer.",
  },
  {
    icon: History,
    title: "Booking timeline",
    description:
      "Each booking has a timeline and indicators such as Customer confirmed and Reminder sent.",
  },
];

const faqs = [
  {
    question:
      "Can customers book without talking to a person?",
    answer:
      "Yes. Bellbee AI can check availability, offer times and collect booking details through connected customer messaging channels.",
  },
  {
    question:
      "Does my AI confirm bookings by itself?",
    answer:
      "New bookings wait for your team unless you enable instant confirmation.",
  },
  {
    question:
      "Can customers move or cancel a booking?",
    answer:
      "Customers can request a move or cancellation in chat. A move requires your acceptance. Cancellations are possible before the appointment is over.",
  },
  {
    question:
      "Can I stop my AI cancelling or moving bookings?",
    answer:
      "You can keep control of booking changes through your settings and approval workflow. Move requests require your team to accept them.",
  },
  {
    question:
      "Can team members have different hours?",
    answer:
      "Yes. Each team member can have their own working hours and days off. AI considers the selected person's availability.",
  },
  {
    question: "How do reminders work?",
    answer:
      "Confirmed appointments can receive reminders 24 hours and 1 hour beforehand. Outside the normal WhatsApp reply window, an approved WhatsApp reminder template is required.",
  },
  {
    question:
      "Can I book for a customer myself?",
    answer:
      "Yes. You can create bookings manually in Bellbee. Booking outside business hours is possible after a warning.",
  },
];

const related = [
  {
    icon: Bot,
    title: "AI Brain",
    description:
      "Manage the information your AI uses.",
    to: "/ai-brain",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp AI agent",
    description:
      "Answer customers through WhatsApp Business.",
    to: "/whatsapp-ai-agent",
  },
  {
    icon: Users,
    title: "AI customer support",
    description:
      "Help customers using your own business information.",
    to: "/ai-customer-support",
  },
];

/* =========================================
   REUSABLE COMPONENTS
========================================= */

function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  center = false,
}) {
  return (
    <div
      className={`ab-heading ${
        center ? "ab-heading-center" : ""
      }`}
    >
      <span className="ab-kicker">{eyebrow}</span>

      <h2>
        {title}{" "}
        {accent && <em>{accent}</em>}
      </h2>

      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="ab-feature-card">
      <span
        className={`ab-feature-icon ab-color-${
          item.color || "lavender"
        }`}
      >
        <Icon size={23} />
      </span>

      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </article>
  );
}

/* =========================================
   ORIGINAL INTERACTIVE HERO DEMO
   No external images or backend requests
========================================= */

const demoDays = [
  { id: "mon", label: "Mon", date: "01" },
  { id: "tue", label: "Tue", date: "02" },
  { id: "wed", label: "Wed", date: "03" },
  { id: "thu", label: "Thu", date: "04" },
  { id: "fri", label: "Fri", date: "05" },
];

const demoSlots = {
  mon: ["09:00", "10:30", "12:00", "15:00"],
  tue: ["09:00", "11:00", "13:30", "16:00"],
  wed: ["09:30", "11:30", "14:00", "16:00"],
  thu: ["09:00", "10:00", "13:00", "15:30"],
  fri: ["09:00", "10:30", "12:30", "15:00"],
};

const busySlots = {
  mon: ["10:30"],
  tue: ["13:30"],
  wed: ["14:00"],
  thu: ["10:00"],
  fri: ["10:30"],
};

function BookingPreview() {
  const [day, setDay] = useState("fri");
  const [time, setTime] = useState("09:00");
  const [service, setService] = useState("Consultation");
  const [staff, setStaff] = useState("Any available");
  const [status, setStatus] = useState("selection");

  const currentDay = demoDays.find(
    (item) => item.id === day
  );

  const isPending = status === "pending";
  const isConfirmed = status === "confirmed";

  const changeDay = (nextDay) => {
    setDay(nextDay);
    setTime("");
    setStatus("selection");
  };

  const resetDemo = () => {
    setDay("fri");
    setTime("09:00");
    setService("Consultation");
    setStaff("Any available");
    setStatus("selection");
  };

  return (
    <div className="ab-booking-preview">
      <div className="ab-preview-header">
        <div className="ab-preview-brand">
          <span className="ab-preview-brand-icon">
            <CalendarCheck2 size={20} />
          </span>

          <div>
            <strong>Bellbee Bookings</strong>
            <small>AI appointment assistant</small>
          </div>
        </div>

        <span className="ab-preview-badge">
          <span />
          DEMO
        </span>
      </div>

      <div className="ab-preview-content">
        <div className="ab-mini-chat">
          <div className="ab-mini-customer">
            Is there an appointment free on Friday?
          </div>

          <div className="ab-mini-ai">
            <span>
              <Sparkles size={13} />
              Bellbee AI
            </span>

            Of course! Here are the available
            appointment times.
          </div>
        </div>

        <div className="ab-calendar-top">
          <div>
            <span className="ab-preview-label">
              APPOINTMENT CALENDAR
            </span>

            <h3>Choose a time</h3>
          </div>

          <span className="ab-calendar-tag">
            <CalendarDays size={15} />
            Sample week
          </span>
        </div>

        <div
          className="ab-calendar-days"
          role="group"
          aria-label="Choose sample day"
        >
          {demoDays.map((item) => (
            <button
              type="button"
              key={item.id}
              className={
                day === item.id ? "active" : ""
              }
              onClick={() => changeDay(item.id)}
              aria-pressed={day === item.id}
            >
              <small>{item.label}</small>
              <strong>{item.date}</strong>
            </button>
          ))}
        </div>

        <div className="ab-time-heading">
          <strong>
            {currentDay.label} · Available slots
          </strong>

          <span>
            <Clock3 size={13} />
            Example only
          </span>
        </div>

        <div className="ab-slot-grid">
          {demoSlots[day].map((slot) => {
            const unavailable =
              busySlots[day].includes(slot);

            return (
              <button
                key={slot}
                type="button"
                disabled={unavailable}
                className={
                  time === slot ? "selected" : ""
                }
                aria-pressed={time === slot}
                onClick={() => {
                  setTime(slot);
                  setStatus("selection");
                }}
                title={
                  unavailable
                    ? "Sample slot unavailable"
                    : "Select this sample time"
                }
              >
                {slot}

                {unavailable && (
                  <span>Busy</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="ab-booking-fields">
          <label>
            Service
            <select
              value={service}
              disabled={isPending || isConfirmed}
              onChange={(event) =>
                setService(event.target.value)
              }
            >
              <option>Consultation</option>
              <option>Follow-up</option>
              <option>Initial appointment</option>
            </select>
          </label>

          <label>
            Team member
            <select
              value={staff}
              disabled={isPending || isConfirmed}
              onChange={(event) =>
                setStaff(event.target.value)
              }
            >
              <option>Any available</option>
              <option>Alex Morgan</option>
              <option>Jamie Lee</option>
            </select>
          </label>
        </div>

        {status === "selection" && (
          <button
            type="button"
            disabled={!time}
            className="ab-booking-submit"
            onClick={() => setStatus("pending")}
          >
            <CalendarCheck2 size={17} />
            Request sample booking
            <ArrowRight size={16} />
          </button>
        )}

        {isPending && (
          <div className="ab-booking-result">
            <span className="ab-result-state">
              <Clock3 size={17} />
              Pending confirmation
            </span>

            <p>
              {service} on {currentDay.label} at{" "}
              {time}. Your team can confirm this
              sample booking.
            </p>

            <div className="ab-result-actions">
              <button
                type="button"
                onClick={() => setStatus("confirmed")}
              >
                <Check size={15} />
                Confirm demo
              </button>

              <button
                type="button"
                onClick={resetDemo}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="ab-booking-result confirmed">
            <span className="ab-result-state">
              <CheckCircle2 size={17} />
              Booking confirmed
            </span>

            <p>
              Sample booking confirmed for{" "}
              {currentDay.label} at {time}.
            </p>

            <button
              type="button"
              className="ab-reset-button"
              onClick={resetDemo}
            >
              <RefreshCcw size={15} />
              Try another booking
            </button>
          </div>
        )}
      </div>

      <div className="ab-preview-footer">
        <ShieldCheck size={15} />
        Interactive preview — no real bookings created
      </div>
    </div>
  );
}

/* =========================================
   CUSTOM CALENDAR AND LIST DEMO
========================================= */

const sampleAppointments = [
  {
    id: 1,
    day: "Mon",
    time: "09:30",
    name: "Sarah Carter",
    status: "Confirmed",
  },
  {
    id: 2,
    day: "Tue",
    time: "11:00",
    name: "James Wilson",
    status: "Pending",
  },
  {
    id: 3,
    day: "Wed",
    time: "14:00",
    name: "Olivia Brown",
    status: "Confirmed",
  },
  {
    id: 4,
    day: "Fri",
    time: "10:30",
    name: "Emma Davis",
    status: "Confirmed",
  },
];

function CalendarPreview() {
  const [view, setView] = useState("calendar");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="ab-dashboard-demo">
      <div className="ab-dashboard-top">
        <div>
          <strong>Bookings</strong>
          <small>Sample calendar workspace</small>
        </div>

        <span className="ab-demo-pill">DEMO</span>
      </div>

      <div className="ab-dashboard-tools">
        <strong>Weekly appointments</strong>

        <div className="ab-view-switch">
          <button
            type="button"
            className={
              view === "calendar" ? "active" : ""
            }
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>

          <button
            type="button"
            className={
              view === "list" ? "active" : ""
            }
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="ab-dashboard-calendar">
          {days.map((day) => {
            const bookings =
              sampleAppointments.filter(
                (item) => item.day === day
              );

            return (
              <div
                className="ab-dashboard-day"
                key={day}
              >
                <div className="ab-dashboard-day-head">
                  {day}
                </div>

                <div className="ab-dashboard-day-content">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`ab-dashboard-booking ${
                        booking.status === "Pending"
                          ? "pending"
                          : ""
                      }`}
                    >
                      <strong>{booking.time}</strong>

                      <span>{booking.name}</span>
                    </div>
                  ))}

                  {!bookings.length && (
                    <span className="ab-empty-day">
                      Free
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ab-dashboard-list">
          {sampleAppointments.map((booking) => (
            <div
              key={booking.id}
              className="ab-dashboard-list-item"
            >
              <span className="ab-list-avatar">
                <UserRound size={17} />
              </span>

              <div>
                <strong>{booking.name}</strong>

                <small>
                  {booking.day} · {booking.time}
                </small>
              </div>

              <span
                className={`ab-status ${
                  booking.status === "Pending"
                    ? "pending"
                    : ""
                }`}
              >
                {booking.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="ab-dashboard-bottom">
        <CheckCircle2 size={15} />
        Example bookings only, not live calendar data
      </div>
    </div>
  );
}

/* =========================================
   FAQ ACCORDION
========================================= */

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="ab-faq-list">
      {faqs.map((faq, index) => (
        <article
          key={faq.question}
          className={`ab-faq-item ${
            openIndex === index ? "open" : ""
          }`}
        >
          <button
            type="button"
            aria-expanded={openIndex === index}
            aria-controls={`ab-answer-${index}`}
            onClick={() =>
              setOpenIndex(
                openIndex === index ? -1 : index
              )
            }
          >
            <span>{faq.question}</span>

            <ChevronDown size={20} />
          </button>

          <div
            id={`ab-answer-${index}`}
            hidden={openIndex !== index}
          >
            <p>{faq.answer}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/* =========================================
   MAIN PAGE + GSAP
========================================= */

export default function AppointmentBookingPage() {
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

      // Continuously rotating organic blobs
      gsap.to(".ab-blob", {
        rotation: 360,
        duration: 50,
        repeat: -1,
        ease: "none",
      });

      // Gentle continuous floating motion
      gsap.to(".ab-blob", {
        x: 16,
        y: -13,
        duration: 7,
        repeat: -1,
        yoyo: true,
        stagger: 0.8,
        ease: "sine.inOut",
      });

      // Floating hero decorations
      gsap.to(".ab-floating", {
        y: -9,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        stagger: 0.4,
        ease: "sine.inOut",
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="ab-page" ref={pageRef}>
      {/* HERO SECTION */}
      <section className="ab-hero">
        <span
          className="ab-blob ab-blob-lavender"
          aria-hidden="true"
        />

        <span
          className="ab-blob ab-blob-yellow"
          aria-hidden="true"
        />

        <div className="ab-container ab-hero-grid">
          <div className="ab-hero-copy">
            <span className="ab-hero-badge">
              <CalendarCheck2 size={16} />
              APPOINTMENT BOOKING
            </span>

            <h1>
              Let your AI book{" "}
              <em>appointments for you.</em>
            </h1>

            <p>
              Bellbee AI books appointments inside
              customer chats at times that are actually
              available. It follows your opening hours,
              breaks, closed days and team schedules.
            </p>

            <div className="ab-hero-actions">
              <Link
                to="/signup"
                className="ab-btn ab-btn-primary"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <a
                href="#ab-how"
                className="ab-btn ab-btn-outline"
              >
                See how it works
              </a>
            </div>

            <div className="ab-hero-trust">
              <span>
                <CheckCircle2 size={16} />
                Real availability checks
              </span>

              <span>
                <CheckCircle2 size={16} />
                Team confirmation
              </span>
            </div>
          </div>

          <div className="ab-hero-visual">
            <span className="ab-floating ab-floating-top">
              <Sparkles size={16} />
              Available times only
            </span>

            <BookingPreview />

            <span className="ab-floating ab-floating-bottom">
              <Check size={16} />
              No double bookings
            </span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="ab-section">
        <div className="ab-container">
          <SectionHeading
            eyebrow="WHAT IT HELPS WITH"
            title="Less scheduling."
            accent="More time for customers."
            description="Make booking easy for customers and your team."
          />

          <div className="ab-grid ab-grid-4">
            {benefits.map((item) => (
              <FeatureCard
                key={item.title}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="ab-how"
        className="ab-section ab-section-light"
      >
        <div className="ab-container">
          <SectionHeading
            eyebrow="HOW IT WORKS"
            title="From a customer message."
            accent="To a confirmed booking."
            description="Four simple steps take an appointment from chat to your calendar."
          />

          <div className="ab-grid ab-grid-4">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  className="ab-step-card"
                  key={step.number}
                >
                  <span className="ab-step-number">
                    {step.number}
                  </span>

                  <span className="ab-feature-icon">
                    <Icon size={23} />
                  </span>

                  <h3>{step.title}</h3>

                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* AVAILABILITY */}
      <section className="ab-section">
        <div className="ab-container">
          <SectionHeading
            eyebrow="TIMES THAT ARE REALLY FREE"
            title="Your calendar sets."
            accent="The availability."
            description="Your AI follows the same booking rules that your team uses."
          />

          <div className="ab-grid ab-grid-4">
            {availabilityFeatures.map(
              (item, index) => (
                <FeatureCard
                  key={item.title}
                  item={{
                    ...item,
                    color: [
                      "lavender",
                      "yellow",
                      "coral",
                      "green",
                    ][index],
                  }}
                />
              )
            )}
          </div>
        </div>
      </section>

      {/* CHANGES AND CANCELLATIONS */}
      <section className="ab-section ab-section-light">
        <div className="ab-container">
          <SectionHeading
            eyebrow="CHANGES AND CANCELLATIONS"
            title="Plans can change."
            accent="Your calendar stays updated."
            description="Customers can ask for changes without starting a new conversation."
          />

          <div className="ab-grid ab-grid-4">
            {changes.map((item, index) => (
              <FeatureCard
                key={item.title}
                item={{
                  ...item,
                  color: [
                    "coral",
                    "yellow",
                    "lavender",
                    "green",
                  ][index],
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* YOUR CALENDAR */}
      <section className="ab-section">
        <div className="ab-container ab-split">
          <div>
            <SectionHeading
              eyebrow="YOUR BOOKINGS CALENDAR"
              title="Every booking."
              accent="One clear view."
              description="Review bookings, statuses, changes and customer activity from your Bellbee workspace."
            />

            <div className="ab-feature-list">
              {calendarFeatures.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="ab-feature-row"
                    key={item.title}
                  >
                    <span className="ab-feature-icon">
                      <Icon size={19} />
                    </span>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <CalendarPreview />
        </div>
      </section>

      {/* REMINDERS */}
      <section className="ab-section ab-section-light">
        <div className="ab-container">
          <SectionHeading
            eyebrow="AUTOMATIC REMINDERS"
            title="Keep customers."
            accent="Ready for their appointment."
            description="Confirmed bookings can receive reminders before the appointment."
          />

          <div className="ab-grid ab-grid-2">
            <article className="ab-reminder-card">
              <span className="ab-reminder-icon">
                <BellRing size={25} />
              </span>

              <span className="ab-reminder-tag">
                REMINDER TIMING
              </span>

              <h3>24 hours and 1 hour before</h3>

              <p>
                Customers receive reminders 24 hours
                and 1 hour before confirmed bookings.
                You can turn either reminder off.
              </p>
            </article>

            <article className="ab-reminder-card ab-reminder-yellow">
              <span className="ab-reminder-icon">
                <MessageCircle size={25} />
              </span>

              <span className="ab-reminder-tag">
                MESSAGE DELIVERY
              </span>

              <h3>The right kind of message</h3>

              <p>
                Within the 24-hour conversation
                window, reminders use normal messages.
                Otherwise, WhatsApp needs an approved
                appointment reminder template.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="ab-section">
        <div className="ab-container">
          <SectionHeading
            eyebrow="GOOD TO KNOW"
            title="Simple requirements."
            accent="Clear limits."
          />

          <div className="ab-grid ab-grid-2">
            <article className="ab-info-card">
              <h3>
                <CheckCircle2 size={22} />
                What you need
              </h3>

              <ul>
                <li>
                  Opening hours and services in AI Brain.
                </li>
                <li>
                  WhatsApp, Instagram or Messenger
                  connected to Bellbee.
                </li>
                <li>
                  A Meta-approved WhatsApp template
                  called appointment_reminder for
                  reminders outside the reply window.
                </li>
              </ul>
            </article>

            <article className="ab-info-card ab-info-yellow">
              <h3>
                <ShieldCheck size={22} />
                What it does not do
              </h3>

              <ul>
                <li>
                  It does not book through website chat.
                  Visitors are directed to WhatsApp.
                </li>
                <li>
                  It does not move a booking without
                  your approval.
                </li>
                <li>
                  Pending bookings do not get reminders.
                </li>
                <li>
                  AI does not offer times outside your
                  booking hours and rules.
                </li>
              </ul>
            </article>
          </div>

          <p className="ab-section-note">
            <UserRound size={17} />
            Your team can take over any chat from
            the Bellbee inbox.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="ab-section ab-section-light">
        <div className="ab-container ab-faq-container">
          <SectionHeading
            eyebrow="FREQUENTLY ASKED QUESTIONS"
            title="Questions about."
            accent="Appointment booking?"
            center
          />

          <FAQ />
        </div>
      </section>

      {/* RELATED */}
      <section className="ab-section">
        <div className="ab-container">
          <SectionHeading
            eyebrow="EXPLORE MORE"
            title="More ways."
            accent="Bellbee helps."
          />

          <div className="ab-grid ab-grid-3">
            {related.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  to={item.to}
                  className="ab-related-card"
                  key={item.to}
                >
                  <span className="ab-feature-icon">
                    <Icon size={23} />
                  </span>

                  <ArrowUpRight
                    className="ab-related-arrow"
                    size={20}
                  />

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPACT CTA */}
      <section className="ab-cta-section">
        <div className="ab-container">
          <div className="ab-cta">
            <span
              className="ab-blob ab-cta-blob-lavender"
              aria-hidden="true"
            />

            <span
              className="ab-blob ab-cta-blob-yellow"
              aria-hidden="true"
            />

            <div className="ab-cta-content">
              <span className="ab-cta-kicker">
                <Sparkles size={15} />
                SMARTER APPOINTMENT BOOKING
              </span>

              <h2>
                Let your AI handle the booking.
                <br />
                <em>You focus on your customers.</em>
              </h2>

              <p>
                Make appointments easier from the
                first message to the final reminder.
              </p>

              <Link
                to="/signup"
                className="ab-btn ab-btn-primary"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <small>
                No credit card required to start.
              </small>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
