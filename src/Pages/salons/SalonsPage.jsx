
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Bot,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  // CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  // CreditCard,
  // FileText,
  Headphones,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  // Wallet,
  XCircle,
} from "lucide-react";
import "./SalonsPage.css";

gsap.registerPlugin(useGSAP);

/* ==========================================
   BELLBEE AI — SALONS & BEAUTY
   CONTENT AND SAMPLE DATA
========================================== */

const services = [
  {
    id: "haircut",
    name: "Signature haircut",
    duration: "45 min",
    price: "£35",
  },
  {
    id: "colour",
    name: "Cut & colour",
    duration: "120 min",
    price: "£85",
  },
  {
    id: "styling",
    name: "Wash & styling",
    duration: "40 min",
    price: "£30",
  },
  {
    id: "consultation",
    name: "Colour consultation",
    duration: "30 min",
    price: "On request",
  },
];

const team = [
  {
    id: "sam",
    name: "Sam",
    initials: "SA",
    role: "Senior stylist",
    hours: "Tue – Sat · 10 AM – 6 PM",
    daysOff: "Sunday and Monday",
    color: "lavender",
    slots: [
      {
        id: "sat-1000",
        label: "Sat · 10:00 AM",
      },
      {
        id: "sat-1130",
        label: "Sat · 11:30 AM",
      },
      {
        id: "sat-1400",
        label: "Sat · 2:00 PM",
      },
      {
        id: "thu-1500",
        label: "Thu · 3:00 PM",
      },
    ],
  },
  {
    id: "mia",
    name: "Mia",
    initials: "MI",
    role: "Colour specialist",
    hours: "Mon – Fri · 9 AM – 5 PM",
    daysOff: "Saturday and Sunday",
    color: "yellow",
    slots: [
      {
        id: "thu-1030",
        label: "Thu · 10:30 AM",
      },
      {
        id: "thu-1400",
        label: "Thu · 2:00 PM",
      },
      {
        id: "fri-1100",
        label: "Fri · 11:00 AM",
      },
    ],
  },
  {
    id: "jordan",
    name: "Jordan",
    initials: "JO",
    role: "Hair & styling",
    hours: "Wed – Sun · 11 AM – 7 PM",
    daysOff: "Monday and Tuesday",
    color: "coral",
    slots: [
      {
        id: "sat-1200",
        label: "Sat · 12:00 PM",
      },
      {
        id: "sat-1530",
        label: "Sat · 3:30 PM",
      },
      {
        id: "sun-1230",
        label: "Sun · 12:30 PM",
      },
    ],
  },
];

const benefits = [
  {
    Icon: CalendarClock,
    title: "Booking requests all day",
    text: "Clients ask for a time while your hands are busy. Your AI checks the calendar and offers free times.",
  },
  {
    Icon: UserCheck,
    title: "Is Sam free on Saturday?",
    text: "A booking with a named stylist uses that person's own working hours and days off.",
  },
  {
    Icon: CalendarCheck,
    title: "Two clients, one time",
    text: "Booking rules stop the same slot being given to two clients and offer other times.",
  },
  {
    Icon: BellRing,
    title: "Clients who do not turn up",
    text: "Remind clients before confirmed bookings and mark no-shows in the calendar.",
  },
  {
    Icon: Scissors,
    title: "How much is a cut and colour?",
    text: "Your AI uses your services and prices. An empty price can be shown as on request.",
  },
  {
    Icon: CalendarDays,
    title: "Can I move my appointment?",
    text: "Clients request a new time in chat. The booking moves after you accept.",
  },
];

const steps = [
  {
    number: "01",
    Icon: Scissors,
    title: "Add your services and team",
    text: "Set each service's duration and price, plus each team member's hours and days off.",
  },
  {
    number: "02",
    Icon: Clock3,
    title: "Set your hours",
    text: "Add opening hours, breaks, holidays, short days and your booking rules.",
  },
  {
    number: "03",
    Icon: MessageCircle,
    title: "Connect your channel",
    text: "Connect WhatsApp, Instagram or Messenger to your Bellbee account.",
  },
  {
    number: "04",
    Icon: CheckCircle2,
    title: "Confirm bookings",
    text: "New bookings wait for you unless you enable instant confirmation.",
  },
];

const stories = [
  {
    Icon: Clock3,
    time: "10:00 PM",
    title: "Booking at 10pm",
    customer: "Can I book a cut on Saturday morning?",
    reply:
      "Your AI checks free times, asks for details and creates a booking for confirmation.",
    link: "/appointment-booking",
  },
  {
    Icon: UserCheck,
    time: "STYLIST REQUEST",
    title: "A client who wants one stylist",
    customer: "Can I book with Sam on Thursday?",
    reply:
      "Only times when Sam is working and available are offered.",
    link: "/appointment-booking",
  },
  {
    Icon: CalendarDays,
    time: "RESCHEDULE",
    title: "A client who has to move",
    customer: "Sorry, can I move to Friday?",
    reply:
      "You receive the original and requested times. The booking moves when you accept.",
    link: "/appointment-booking",
  },
  {
    Icon: BellRing,
    time: "BEFORE A VISIT",
    title: "A reminder, so they come",
    customer: "I have my appointment tomorrow.",
    reply:
      "Reminders can go out 24 hours and 1 hour before a confirmed appointment, following WhatsApp messaging rules.",
    link: "/appointment-booking",
  },
  {
    Icon: CalendarCheck,
    time: "HOLIDAY WEEK",
    title: "A holiday week",
    customer: "Can I book while Sam is away?",
    reply:
      "Your AI avoids your closed days and individual time off, and the app warns about affected existing bookings.",
    link: "/ai-brain",
  },
];

const setupItems = [
  {
    Icon: Scissors,
    title: "Your services",
    text: "Each service's name, length, price and team members who provide it.",
  },
  {
    Icon: Users,
    title: "Your team",
    text: "Every stylist's individual working hours, breaks and days off.",
  },
  {
    Icon: Clock3,
    title: "Your booking rules",
    text: "Opening hours, breaks, gaps, minimum notice and advance-booking limits.",
  },
  {
    Icon: MessageCircle,
    title: "A question before booking",
    text: "For example, 'Is this your first visit?' Your AI asks it before booking.",
  },
];

const faqs = [
  {
    question: "Can clients book without calling the salon?",
    answer:
      "Yes. Clients can request appointments through WhatsApp, Instagram or Messenger. Your AI checks the configured availability, collects details and creates a booking that waits for your confirmation unless instant confirmation is enabled.",
  },
  {
    question: "How do I stop double bookings?",
    answer:
      "Bellbee checks the available appointment slots against your booking rules, service durations and team schedules. A slot already taken cannot be offered as another available booking.",
  },
  {
    question: "Can each stylist have their own hours?",
    answer:
      "Yes. Each team member can have individual working hours, breaks and days off. When someone requests a named stylist, your AI offers times within that person's availability.",
  },
  {
    question: "What if a client needs to move or cancel?",
    answer:
      "Clients can ask to move or cancel in the same conversation. Rescheduling requests wait for your acceptance before the original booking changes.",
  },
  {
    question: "Do clients get a reminder?",
    answer:
      "Confirmed bookings can receive reminders 24 hours and 1 hour before the appointment. Outside WhatsApp's 24-hour customer-service window, reminders require an eligible Meta-approved template.",
  },
  {
    question: "Can I check bookings before they are final?",
    answer:
      "Yes. You can review and confirm new booking requests yourself. If you prefer, you can enable instant confirmation.",
  },
  {
    question:
      "What happens if a client asks about something my AI does not know?",
    answer:
      "Your team can take over the conversation from the Bellbee inbox. Add common questions and answers to your AI Brain to help the assistant answer more accurately.",
  },
  {
    question: "How long does it take to set up a salon?",
    answer:
      "You can start after adding your services, team schedules, opening hours and booking rules, then connecting a supported channel. The setup time depends on how much information you need to configure.",
  },
];

const related = [
  {
    Icon: CalendarCheck,
    title: "Appointment booking",
    text: "Book, move and cancel appointments around your hours.",
    to: "/appointment-booking",
  },
  {
    Icon: Bot,
    title: "AI Brain",
    text: "Keep your business knowledge, services and answers in one place.",
    to: "/ai-brain",
  },
  {
    Icon: Scissors,
    title: "Car wash and auto services",
    text: "Take bookings and quote requests from conversations.",
    to: "/ai-chat-for-auto-services",
  },
];

/* ==========================================
   REUSABLE COMPONENTS
========================================== */

function Heading({
  label,
  title,
  accent,
  description,
}) {
  return (
    <div className="sb-heading">
      <span className="sb-kicker">{label}</span>
      <h2>
        {title} {accent && <em>{accent}</em>}
      </h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function ChatBubble({ sender = "ai", children }) {
  return (
    <div className={`sb-message sb-message-${sender}`}>
      {sender === "ai" && (
        <span className="sb-message-avatar">
          <Bot size={15} />
        </span>
      )}
      <div className="sb-message-content">
        {children}
      </div>
    </div>
  );
}

/* ==========================================
   INTERACTIVE SALON BOOKING DEMO
   FRONTEND ONLY — NO REAL BOOKINGS
========================================== */

const demoTabs = [
  {
    id: "booking",
    label: "Book a visit",
    Icon: CalendarCheck,
  },
  {
    id: "team",
    label: "Stylist hours",
    Icon: Users,
  },
  {
    id: "move",
    label: "Move a booking",
    Icon: CalendarDays,
  },
  {
    id: "reminders",
    label: "Reminders",
    Icon: BellRing,
  },
];

const moveTimes = [
  "Friday · 11:00 AM",
  "Friday · 2:30 PM",
  "Saturday · 12:00 PM",
];

function SalonChatDemo() {
  const [activeTab, setActiveTab] = useState("booking");
  const [serviceId, setServiceId] = useState("haircut");
  const [stylistId, setStylistId] = useState("sam");
  const [selectedSlot, setSelectedSlot] =
    useState("sat-1130");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [firstVisit, setFirstVisit] = useState("yes");

  const [bookingRequested, setBookingRequested] =
    useState(false);

  const [occupiedSlots, setOccupiedSlots] = useState([
    "sam:sat-1000",
  ]);

  const [newTime, setNewTime] = useState(moveTimes[0]);
  const [moveRequested, setMoveRequested] = useState(false);
  const [reminderType, setReminderType] = useState("24h");

  const selectedService =
    services.find((service) => service.id === serviceId) ||
    services[0];

  const selectedStylist =
    team.find((member) => member.id === stylistId) ||
    team[0];

  const slot =
    selectedStylist.slots.find(
      (item) => item.id === selectedSlot
    ) || null;

  const slotKey = `${stylistId}:${selectedSlot}`;

  const isOccupied =
    occupiedSlots.includes(slotKey);

  const canRequest =
    clientName.trim().length > 0 &&
    clientPhone.trim().length > 0 &&
    Boolean(slot) &&
    !isOccupied;

  function switchTab(tab) {
    setActiveTab(tab);
    setBookingRequested(false);
    setMoveRequested(false);
  }

  function chooseStylist(id) {
    const member = team.find((item) => item.id === id);

    if (!member) return;

    setStylistId(id);

    const firstFree = member.slots.find(
      (item) =>
        !occupiedSlots.includes(`${id}:${item.id}`)
    );

    setSelectedSlot(firstFree?.id || "");
    setBookingRequested(false);
  }

  function submitBooking(event) {
    event.preventDefault();

    if (!canRequest || bookingRequested) return;

    setOccupiedSlots((current) =>
      current.includes(slotKey)
        ? current
        : [...current, slotKey]
    );

    setBookingRequested(true);
  }

  return (
    <div className="sb-demo">
      <div className="sb-demo-header">
        <span className="sb-demo-logo">
          <Scissors size={22} />
        </span>

        <div className="sb-demo-business">
          <strong>Bloom Beauty Studio</strong>
          <small>
            <i />
            Bellbee Ai assistant
          </small>
        </div>

        <span className="sb-demo-badge">LIVE DEMO</span>
      </div>

      <div
        className="sb-demo-tabs"
        role="group"
        aria-label="Salon chat demonstrations"
      >
        {demoTabs.map(({ id, label, Icon }) => (
          <button
            type="button"
            key={id}
            className={
              activeTab === id ? "active" : ""
            }
            aria-pressed={activeTab === id}
            onClick={() => switchTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="sb-demo-chat" aria-live="polite">
        <div className="sb-chat-date">
          Example conversation · Not a real salon
        </div>

        {/* NEW BOOKING */}

        {activeTab === "booking" && (
          <>
            <ChatBubble sender="customer">
              Hi! Can I book a haircut with Sam on
              Saturday?
            </ChatBubble>

            <ChatBubble>
              Of course! Choose your service, stylist
              and a free example time below.
            </ChatBubble>

            <form
              className="sb-booking-form"
              onSubmit={submitBooking}
            >
              <div className="sb-form-header">
                <CalendarCheck size={18} />
                <strong>Appointment request</strong>
                <span>DEMO</span>
              </div>

              <div className="sb-form-selects">
                <label>
                  Service
                  <select
                    value={serviceId}
                    disabled={bookingRequested}
                    onChange={(e) =>
                      setServiceId(e.target.value)
                    }
                  >
                    {services.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Team member
                  <select
                    value={stylistId}
                    disabled={bookingRequested}
                    onChange={(e) =>
                      chooseStylist(e.target.value)
                    }
                  >
                    {team.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="sb-service-summary">
                <div>
                  <strong>{selectedService.name}</strong>
                  <small>
                    <Clock3 size={12} />
                    {selectedService.duration}
                  </small>
                </div>
                <strong className="sb-service-price">
                  {selectedService.price}
                </strong>
              </div>

              <div className="sb-stylist-summary">
                <span
                  className={`sb-avatar sb-avatar-${selectedStylist.color}`}
                >
                  {selectedStylist.initials}
                </span>

                <div>
                  <strong>
                    {selectedStylist.name}
                  </strong>
                  <small>{selectedStylist.hours}</small>
                </div>

                <CheckCircle2 size={17} />
              </div>

              <div className="sb-form-title-row">
                <strong>Example available times</strong>
                <span>
                  <Clock3 size={13} />
                  Sample slots
                </span>
              </div>

              <div className="sb-slot-grid">
                {selectedStylist.slots.map((item) => {
                  const occupied = occupiedSlots.includes(
                    `${stylistId}:${item.id}`
                  );

                  return (
                    <button
                      type="button"
                      key={item.id}
                      disabled={
                        occupied || bookingRequested
                      }
                      className={
                        selectedSlot === item.id &&
                        !occupied
                          ? "selected"
                          : occupied
                          ? "occupied"
                          : ""
                      }
                      aria-pressed={
                        selectedSlot === item.id &&
                        !occupied
                      }
                      onClick={() =>
                        setSelectedSlot(item.id)
                      }
                    >
                      {item.label}
                      {occupied && <small>Unavailable</small>}
                    </button>
                  );
                })}
              </div>

              <p className="sb-demo-hint">
                Times are illustrative. The unavailable
                slot demonstrates double-booking
                protection, not live availability.
              </p>

              {!bookingRequested ? (
                <>
                  <div className="sb-form-selects">
                    <label>
                      Client name
                      <input
                        type="text"
                        maxLength={70}
                        placeholder="Your name"
                        value={clientName}
                        onChange={(e) =>
                          setClientName(e.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Phone number
                      <input
                        type="tel"
                        maxLength={30}
                        placeholder="Phone number"
                        value={clientPhone}
                        onChange={(e) =>
                          setClientPhone(e.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <label className="sb-visit-question">
                    Is this your first visit?
                    <select
                      value={firstVisit}
                      onChange={(e) =>
                        setFirstVisit(e.target.value)
                      }
                    >
                      <option value="yes">
                        Yes, first time
                      </option>
                      <option value="no">
                        No, returning client
                      </option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="sb-form-submit"
                    disabled={!canRequest}
                  >
                    Request sample booking
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <div
                  className="sb-booking-success"
                  role="status"
                >
                  <CheckCircle2 size={26} />
                  <strong>
                    Sample request created
                  </strong>
                  <p>
                    {selectedService.name} with{" "}
                    {selectedStylist.name}
                  </p>
                  <span>{slot?.label}</span>
                  <small>
                    Waiting for salon confirmation.
                    Nothing was sent or booked.
                  </small>

                  <button
                    type="button"
                    onClick={() => {
                      const nextFree =
                        selectedStylist.slots.find(
                          (item) =>
                            !occupiedSlots.includes(
                              `${stylistId}:${item.id}`
                            )
                        );

                      setSelectedSlot(
                        nextFree?.id || ""
                      );
                      setBookingRequested(false);
                    }}
                  >
                    Try another booking
                  </button>
                </div>
              )}
            </form>
          </>
        )}

        {/* TEAM AVAILABILITY */}

        {activeTab === "team" && (
          <>
            <ChatBubble sender="customer">
              Is Sam available on Saturday? I want
              someone who can do a cut and colour.
            </ChatBubble>

            <ChatBubble>
              I can check the example team schedule.
              Select a stylist to see their hours and
              available times.
            </ChatBubble>

            <div className="sb-team-panel">
              <div className="sb-panel-heading">
                <Users size={18} />
                <strong>Meet the team</strong>
              </div>

              <div className="sb-team-selector">
                {team.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    className={
                      stylistId === member.id
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      chooseStylist(member.id)
                    }
                  >
                    <span
                      className={`sb-avatar sb-avatar-${member.color}`}
                    >
                      {member.initials}
                    </span>
                    <strong>{member.name}</strong>
                  </button>
                ))}
              </div>

              <div className="sb-team-detail">
                <strong>{selectedStylist.name}</strong>
                <span>{selectedStylist.role}</span>

                <div>
                  <Clock3 size={16} />
                  {selectedStylist.hours}
                </div>

                <div>
                  <CalendarDays size={16} />
                  Days off: {selectedStylist.daysOff}
                </div>
              </div>

              <div className="sb-form-title-row">
                <strong>Sample free times</strong>
              </div>

              <div className="sb-team-times">
                {selectedStylist.slots
                  .filter(
                    (item) =>
                      !occupiedSlots.includes(
                        `${stylistId}:${item.id}`
                      )
                  )
                  .map((item) => (
                    <span key={item.id}>
                      <Check size={13} />
                      {item.label}
                    </span>
                  ))}
              </div>
            </div>

            <ChatBubble>
              A named stylist is only offered during
              their configured hours and outside
              their days off.
            </ChatBubble>
          </>
        )}

        {/* RESCHEDULE */}

        {activeTab === "move" && (
          <>
            <ChatBubble sender="customer">
              Sorry, can I move my appointment from
              Thursday to Friday?
            </ChatBubble>

            <ChatBubble>
              Of course. I can collect your new
              preferred time and send a change
              request to the salon.
            </ChatBubble>

            <div className="sb-move-panel">
              <div className="sb-panel-heading">
                <CalendarDays size={18} />
                <strong>Reschedule request</strong>
              </div>

              <div className="sb-old-booking">
                <span>Current booking</span>
                <strong>
                  Haircut with Sam
                </strong>
                <small>
                  Thursday · 2:00 PM
                </small>
              </div>

              <label className="sb-move-label">
                Requested new time
                <select
                  value={newTime}
                  disabled={moveRequested}
                  onChange={(e) =>
                    setNewTime(e.target.value)
                  }
                >
                  {moveTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              {!moveRequested ? (
                <button
                  className="sb-form-submit"
                  type="button"
                  onClick={() =>
                    setMoveRequested(true)
                  }
                >
                  Send sample change request
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="sb-move-success">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>
                      Sample request submitted
                    </strong>
                    <p>
                      Requested: {newTime}
                    </p>
                    <small>
                      The original booking stays
                      unchanged until the salon
                      accepts the change.
                    </small>
                  </div>
                </div>
              )}

              <p className="sb-demo-hint">
                This is an example only. No real
                appointment is changed.
              </p>
            </div>
          </>
        )}

        {/* REMINDERS */}

        {activeTab === "reminders" && (
          <>
            <ChatBubble sender="customer">
              Will I get a reminder before my
              appointment?
            </ChatBubble>

            <ChatBubble>
              Yes! Confirmed appointments can have
              reminders 24 hours and 1 hour before
              the visit.
            </ChatBubble>

            <div className="sb-reminder-panel">
              <div className="sb-panel-heading">
                <BellRing size={18} />
                <strong>Booking reminders</strong>
              </div>

              <div className="sb-reminder-tabs">
                <button
                  type="button"
                  className={
                    reminderType === "24h"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setReminderType("24h")
                  }
                >
                  24 hours before
                </button>

                <button
                  type="button"
                  className={
                    reminderType === "1h"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setReminderType("1h")
                  }
                >
                  1 hour before
                </button>
              </div>

              <div className="sb-reminder-preview">
                <span>
                  <BellRing size={15} />
                  MESSAGE PREVIEW
                </span>

                <p>
                  {reminderType === "24h"
                    ? "Hi! Just a reminder that you have a haircut appointment at Bloom Beauty Studio tomorrow. We look forward to seeing you!"
                    : "Your appointment at Bloom Beauty Studio is coming up in 1 hour. See you soon!"}
                </p>

                <small>
                  Example reminder · Not sent
                </small>
              </div>

              <div className="sb-reminder-notice">
                <ShieldCheck size={17} />
                <span>
                  Outside WhatsApp's 24-hour
                  customer-service window, an
                  eligible Meta-approved template
                  is required.
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sb-demo-footer">
        <ShieldCheck size={15} />
        Frontend demonstration only — no real
        messages or bookings.
      </div>
    </div>
  );
}

/* ==========================================
   CALENDAR PREVIEW
========================================== */

const calendarBookings = [
  {
    time: "10:00 AM",
    name: "Signature haircut",
    stylist: "Sam",
    client: "Alex",
    color: "lavender",
  },
  {
    time: "11:30 AM",
    name: "Cut & colour",
    stylist: "Mia",
    client: "Taylor",
    color: "yellow",
  },
  {
    time: "2:00 PM",
    name: "Wash & styling",
    stylist: "Jordan",
    client: "Jamie",
    color: "coral",
  },
];

function CalendarPreview() {
  return (
    <div className="sb-calendar">
      <div className="sb-calendar-header">
        <div>
          <span className="sb-kicker">
            EXAMPLE BOOKINGS
          </span>
          <h3>Team calendar</h3>
          <p>
            One view for your team and appointments.
          </p>
        </div>

        <span className="sb-calendar-tag">
          <CalendarDays size={16} />
          Demo
        </span>
      </div>

      <div className="sb-calendar-week">
        {[
          ["MON", "12"],
          ["TUE", "13"],
          ["WED", "14"],
          ["THU", "15"],
          ["FRI", "16"],
          ["SAT", "17"],
          ["SUN", "18"],
        ].map(([day, date]) => (
          <div
            key={day}
            className={
              day === "SAT" ? "active" : ""
            }
          >
            <small>{day}</small>
            <strong>{date}</strong>
          </div>
        ))}
      </div>

      <div className="sb-calendar-schedule">
        {calendarBookings.map((booking) => (
          <div
            className="sb-calendar-row"
            key={booking.time}
          >
            <span className="sb-calendar-time">
              {booking.time}
            </span>

            <div
              className={`sb-calendar-booking sb-booking-${booking.color}`}
            >
              <div>
                <strong>{booking.name}</strong>
                <small>
                  {booking.client} · {booking.stylist}
                </small>
              </div>
              <CheckCircle2 size={18} />
            </div>
          </div>
        ))}
      </div>

      <div className="sb-calendar-footer">
        <span>
          <CheckCircle2 size={16} />
          Confirmed
        </span>
        <span>
          <CalendarClock size={16} />
          Team availability
        </span>
      </div>
    </div>
  );
}

/* ==========================================
   FAQ ACCORDION
========================================== */

function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div className="sb-faq-list">
      {faqs.map(({ question, answer }, index) => (
        <article
          key={question}
          className={`sb-faq-item ${
            open === index ? "open" : ""
          }`}
        >
          <h3>
            <button
              type="button"
              aria-expanded={open === index}
              aria-controls={`sb-faq-${index}`}
              onClick={() =>
                setOpen(
                  open === index ? -1 : index
                )
              }
            >
              <span>{question}</span>
              <ChevronDown size={19} />
            </button>
          </h3>

          <div
            id={`sb-faq-${index}`}
            hidden={open !== index}
          >
            <p>{answer}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ==========================================
   MAIN SALONS PAGE
========================================== */

export default function SalonsPage() {
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

      gsap.from(".sb-hero-copy > *", {
        opacity: 0,
        y: 22,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
      });

      gsap.from(".sb-demo", {
        opacity: 0,
        y: 30,
        scale: 0.97,
        duration: 0.9,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.to(".sb-orb", {
        rotation: 360,
        duration: 65,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".sb-floating-pill", {
        y: -8,
        repeat: -1,
        yoyo: true,
        duration: 3,
        ease: "sine.inOut",
        stagger: 0.5,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="sb-page" ref={pageRef}>

      {/* HERO */}

      <section className="sb-hero">
        <span
          className="sb-orb sb-orb-lavender"
          aria-hidden="true"
        />
        <span
          className="sb-orb sb-orb-yellow"
          aria-hidden="true"
        />

        <div className="sb-container sb-hero-grid">
          <div className="sb-hero-copy">
            <span className="sb-hero-pill">
              <Scissors size={16} />
              SALONS & BEAUTY
            </span>

            <h1>
              Let clients book their own{" "}
              <em>appointments in chat.</em>
            </h1>

            <p>
              If clients message your salon on WhatsApp,
              Instagram or Messenger, Bellbee Ai takes
              appointment requests around your opening
              hours and each team member's schedule.
              Clients can ask to move or cancel in the
              same chat. Your team sees bookings in one
              calendar and confirms them.
            </p>

            <div className="sb-hero-actions">
              <Link
                to="/signup"
                className="sb-btn sb-btn-coral"
              >
                Start with free credit
                <ArrowRight size={17} />
              </Link>

              <a
                href="#sb-how"
                className="sb-btn sb-btn-outline"
              >
                See how it works
              </a>
            </div>

            <div className="sb-hero-trust">
              <span>
                <CheckCircle2 size={16} />
                24/7 booking requests
              </span>

              <span>
                <CheckCircle2 size={16} />
                Team availability
              </span>

              <span>
                <CheckCircle2 size={16} />
                No double bookings
              </span>
            </div>
          </div>

          <div className="sb-hero-visual">
            <span className="sb-floating-pill sb-float-top">
              <Sparkles size={16} />
              Your salon, always ready
            </span>

            <SalonChatDemo />

            <span className="sb-floating-pill sb-float-bottom">
              <CalendarCheck size={16} />
              Bookings in one place
            </span>
          </div>
        </div>
      </section>

      {/* WHAT IT HELPS WITH */}

      <section
        className="sb-section"
        id="sb-benefits"
      >
        <div className="sb-container">
          <Heading
            label="WHAT IT HELPS WITH"
            title="Less time on messages."
            accent="More time with clients."
            description="From choosing a stylist to moving an appointment, give clients a simpler way to book."
          />

          <div className="sb-benefits-grid">
            {benefits.map(
              ({ Icon, title, text }, index) => (
                <article
                  className="sb-feature-card"
                  key={title}
                >
                  <span
                    className={`sb-icon sb-icon-${
                      [
                        "lavender",
                        "yellow",
                        "coral",
                        "green",
                      ][index % 4]
                    }`}
                  >
                    <Icon size={23} />
                  </span>

                  <span className="sb-card-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section
        className="sb-section sb-section-light"
        id="sb-how"
      >
        <div className="sb-container">
          <Heading
            label="HOW IT WORKS"
            title="Your services and schedule."
            accent="Your AI booking assistant."
            description="Set up your team, services and booking rules. Then connect your channels and let clients request appointments."
          />

          <div className="sb-steps-grid">
            {steps.map(
              (
                {
                  number,
                  Icon,
                  title,
                  text,
                },
                index
              ) => (
                <article
                  className="sb-step-card"
                  key={number}
                >
                  <span className="sb-step-number">
                    {number}
                  </span>

                  <span
                    className={`sb-icon sb-icon-${
                      [
                        "lavender",
                        "yellow",
                        "coral",
                        "green",
                      ][index]
                    }`}
                  >
                    <Icon size={24} />
                  </span>

                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              )
            )}
          </div>

          <div className="sb-calendar-layout">
            <div className="sb-calendar-copy">
              <span className="sb-kicker">
                ONE CALENDAR FOR YOUR TEAM
              </span>

              <h2>
                Every stylist. Every booking.{" "}
                <em>One clear view.</em>
              </h2>

              <p>
                Manage bookings around your salon
                hours, service durations and individual
                team schedules. Review new requests,
                keep track of confirmed appointments
                and stay organized.
              </p>

              <div className="sb-calendar-points">
                <span>
                  <CheckCircle2 size={18} />
                  Individual staff working hours
                </span>

                <span>
                  <CheckCircle2 size={18} />
                  Booking and rescheduling requests
                </span>

                <span>
                  <CheckCircle2 size={18} />
                  Reminders and no-show tracking
                </span>
              </div>

              <Link
                className="sb-text-link"
                to="/appointment-booking"
              >
                Explore appointment booking
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <CalendarPreview />
          </div>
        </div>
      </section>

      {/* A DAY IN CHAT */}

      <section
        className="sb-section"
        id="sb-day"
      >
        <div className="sb-container">
          <Heading
            label="A DAY IN THE CHAT"
            title="From the first question"
            accent="to appointment day."
            description="Examples of salon conversations and what happens next. These are sample scenarios, not real customers."
          />

          <div className="sb-stories-grid">
            {stories.map(
              ({
                Icon,
                time,
                title,
                customer,
                reply,
                link,
              }) => (
                <article
                  className="sb-story-card"
                  key={title}
                >
                  <div className="sb-story-top">
                    <span>
                      <Clock3 size={13} />
                      {time}
                    </span>

                    <span className="sb-story-icon">
                      <Icon size={21} />
                    </span>
                  </div>

                  <h3>{title}</h3>

                  <div className="sb-story-message">
                    <MessageCircle size={16} />
                    <span>“{customer}”</span>
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
        className="sb-section sb-section-light"
        id="sb-setup"
      >
        <div className="sb-container">
          <Heading
            label="WHAT TO ADD FIRST"
            title="Give your AI the details."
            accent="It handles the questions."
            description="Your AI only knows what you give it. Start with the essentials that make your salon booking process work."
          />

          <div className="sb-setup-grid">
            {setupItems.map(
              ({ Icon, title, text }, index) => (
                <article
                  className="sb-setup-card"
                  key={title}
                >
                  <span
                    className={`sb-icon sb-icon-${
                      [
                        "yellow",
                        "lavender",
                        "coral",
                        "green",
                      ][index]
                    }`}
                  >
                    <Icon size={23} />
                  </span>

                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* WHAT YOU NEED / LIMITATIONS */}

      <section
        className="sb-section"
        id="sb-limits"
      >
        <div className="sb-container">
          <Heading
            label="GOOD TO KNOW"
            title="What you need."
            accent="And what it does not do."
            description="Your team stays in control of bookings and customer relationships."
          />

          <div className="sb-limits-grid">
            <article className="sb-limits-card sb-limits-yes">
              <div className="sb-limits-heading">
                <span>
                  <CheckCircle2 size={23} />
                </span>

                <h3>What you need</h3>
              </div>

              <ul>
                <li>
                  <Check size={18} />
                  <span>
                    Your services and team added
                    in the AI Brain.
                  </span>
                </li>

                <li>
                  <Check size={18} />
                  <span>
                    A connected WhatsApp, Instagram
                    or Messenger channel.
                  </span>
                </li>

                <li>
                  <Check size={18} />
                  <span>
                    For reminders after 24 hours
                    of silence, a Meta-approved
                    WhatsApp template.
                  </span>
                </li>
              </ul>
            </article>

            <article className="sb-limits-card sb-limits-no">
              <div className="sb-limits-heading">
                <span>
                  <ShieldCheck size={23} />
                </span>

                <h3>What it does not do</h3>
              </div>

              <ul>
                <li>
                  <XCircle size={18} />
                  <span>
                    Bookings do not collect
                    deposits or payments.
                  </span>
                </li>

                <li>
                  <XCircle size={18} />
                  <span>
                    Rescheduling requests
                    do not move bookings until
                    you accept them.
                  </span>
                </li>

                <li>
                  <XCircle size={18} />
                  <span>
                    It does not replace your
                    client records or history.
                  </span>
                </li>

                <li>
                  <XCircle size={18} />
                  <span>
                    Website chat does not take
                    bookings. Visitors are
                    directed to WhatsApp.
                  </span>
                </li>
              </ul>
            </article>
          </div>

          <div className="sb-handoff-banner">
            <span>
              <Headphones size={22} />
            </span>

            <p>
              <strong>
                Your team can take over any chat.
              </strong>{" "}
              Keep the personal touch when clients
              need advice, have special requests
              or want to speak with someone.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}

      <section
        className="sb-section sb-section-light"
        id="sb-faq"
      >
        <div className="sb-container sb-faq-layout">
          <div>
            <Heading
              label="QUESTIONS"
              title="Good questions."
              accent="Clear answers."
              description="Everything you may want to know about salon bookings, team schedules and reminders."
            />

            <div className="sb-faq-note">
              <Sparkles size={29} />
              <span>
                More appointments.
                Fewer interruptions.
              </span>
            </div>
          </div>

          <FAQ />
        </div>
      </section>

      {/* RELATED */}

      <section
        className="sb-section"
        id="sb-related"
      >
        <div className="sb-container">
          <Heading
            label="RELATED"
            title="More ways to make"
            accent="business easier."
          />

          <div className="sb-related-grid">
            {related.map(
              ({ Icon, title, text, to }) => (
                <Link
                  to={to}
                  className="sb-related-card"
                  key={title}
                >
                  <span className="sb-related-icon">
                    <Icon size={24} />
                  </span>

                  <h3>{title}</h3>
                  <p>{text}</p>

                  <span className="sb-related-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* COMPACT CTA */}

      <section className="sb-cta-section">
        <div className="sb-container">
          <div className="sb-cta">
            <div className="sb-cta-content">
              <span className="sb-cta-kicker">
                <Sparkles size={15} />
                GET STARTED WITH BELLBEE AI
              </span>

              <h2>
                Less time booking.{" "}
                <em>More time creating.</em>
              </h2>

              <p>
                Start with free credit.
                No credit card required.
              </p>
            </div>

            <Link
              to="/signup"
              className="sb-btn sb-btn-coral sb-cta-button"
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
