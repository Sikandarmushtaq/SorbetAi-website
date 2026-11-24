
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, ArrowUpRight, BellRing, Bot, CalendarCheck,
  CalendarDays, CarFront, Check, CheckCircle2, ChevronDown,
  Clock3, ClipboardList, FileImage, Headphones,
  Image as ImageIcon, MessageCircle, Settings2, ShieldCheck,
  Sparkles, Users, Wrench, XCircle,
} from "lucide-react";
import "./AutoServicesPage.css";

gsap.registerPlugin(useGSAP);

// All chat, pricing and availability information below is sample data.
const services = [
  { id: "wash", name: "Exterior wash", minutes: 30, price: "£18" },
  { id: "valet", name: "Full valet", minutes: 120, price: "£65" },
  { id: "interior", name: "Interior detail", minutes: 75, price: "£45" },
];
const slots = [
  { start: 540, label: "9:00 AM" },
  { start: 600, label: "10:00 AM" },
  { start: 660, label: "11:00 AM" },
  { start: 720, label: "12:00 PM" },
  { start: 780, label: "1:00 PM" },
  { start: 840, label: "2:00 PM" },
  { start: 900, label: "3:00 PM" },
];
const initialBookings = [
  { start: 540, end: 585 },
  { start: 600, end: 720 },
  { start: 780, end: 825 },
];

// A service must fit within example opening hours and capacity.
// Check concurrency at each point where an existing booking starts/ends.
function slotIsFree(start, minutes, capacity, bookings) {
  const end = start + minutes;
  if (start < 540 || end > 1020) return false;
  const boundaries = [
    start,
    ...bookings.flatMap(({ start: a, end: b }) => [a, b])
      .filter((time) => time > start && time < end),
  ];
  return boundaries.every(
    (time) => bookings.filter((b) => b.start <= time && b.end > time).length < capacity
  );
}

const benefits = [
  [Wrench, "What is included in a full valet?", "Your AI answers from the services, prices and FAQs you add."],
  [Clock3, "How long will it take?", "Service durations help your AI offer slots that fit your schedule."],
  [CarFront, "Too many cars at once", "Set your concurrent customer capacity and a gap between appointments."],
  [ClipboardList, "Quote requests with no details", "Your AI collects the vehicle details and photos you ask for, then saves a lead."],
  [MessageCircle, "Calls while your hands are busy", "Customers can message instead. Your team sees chats in one inbox."],
];
const steps = [
  ["01", Wrench, "Add your services", "Add a name, length and price for each wash, valet or job."],
  ["02", Clock3, "Set hours and capacity", "Enter opening hours, closed days and how many customers you can serve together."],
  ["03", ClipboardList, "Add a quote request", "Choose the details to collect, such as the car model and a photo."],
  ["04", MessageCircle, "Connect your channel", "Connect WhatsApp, Instagram or Messenger."],
];
const stories = [
  [CalendarCheck, "FRIDAY BOOKING", "A slot on Friday", "Can I bring the van in for a full valet on Friday?", "Your AI offers times that fit the service duration and capacity, then creates a booking for your confirmation.", "/appointment-booking"],
  [CarFront, "CAPACITY RULES", "One bay, two customers", "Can we both come at 10?", "If you set capacity to one, the same time cannot be offered to two customers.", "/appointment-booking"],
  [FileImage, "QUOTE REQUEST", "I need a quote for a dent", "How much to fix a dent on the door?", "Your AI collects the details you require, saves a lead and alerts your team to follow up.", "/ai-customer-support"],
  [Clock3, "HOLIDAY HOURS", "Are you open on the bank holiday?", "Are you open on Monday?", "Your AI uses your weekly hours and the holiday exceptions you added.", "/ai-brain"],
  [BellRing, "BEFORE THE VISIT", "A reminder the day before", "My appointment is tomorrow, right?", "Reminders can go out 24 hours and 1 hour before confirmed bookings, following WhatsApp messaging rules.", "/appointment-booking"],
];
const setup = [
  [Wrench, "Your services", "Name, duration and price for each wash, valet or other job."],
  [Clock3, "Hours and closed days", "So your AI does not offer appointments when you're closed."],
  [Users, "Your capacity", "Set customers at the same time and the gap between bookings."],
  [ClipboardList, "A quote request", "Tell your AI which vehicle details and photos to collect and what happens next."],
];
const faqs = [
  ["Can customers book a wash or service by message?", "Yes. Through WhatsApp, Instagram or Messenger, Bellbee Ai checks the appointment availability configured for your business, collects the required details and creates a booking. Your team confirms it unless instant confirmation is enabled."],
  ["Can I limit how many cars I take at once?", "Yes. Set the number of customers you can serve at the same time, your service durations and gaps between appointments. Bellbee uses those rules when offering time slots."],
  ["Can it handle quote requests?", "Yes. Create a request type in AI Brain → Requests and choose the details needed. The AI collects those details and saves a lead; your team reviews it and follows up."],
  ["Can customers send a photo of the damage?", "You can ask customers to include a photo in a quote request, alongside the vehicle and job details. Your team reviews the request and provides the quote."],
  ["What if I do not want to put prices in the chat?", "Only add the prices you want your AI to share. Where pricing depends on the job, use your FAQs and request process to explain that a quote is needed."],
  ["Will customers get a reminder?", "Confirmed bookings can receive reminders 24 hours and 1 hour before their appointment. Outside WhatsApp's 24-hour customer-service window, an eligible Meta-approved template is required."],
  ["How fast can a small garage get this running?", "You can begin after adding your services, opening hours, capacity rules and any quote request type, then connecting a supported channel. Setup time varies with your business information and channel connection."],
];
const related = [
  [CalendarDays, "Appointment booking", "Book, move and cancel appointments around your hours.", "/appointment-booking"],
  [Bot, "AI customer support", "Answer questions using your own business information.", "/ai-customer-support"],
  [CarFront, "Online shops and retail", "Answer shoppers and take orders in chat.", "/ai-chat-for-online-shops"],
];

function Heading({ label, title, accent, description }) {
  return (
    <div className="as-heading">
      <span className="as-kicker">{label}</span>
      <h2>{title} {accent && <em>{accent}</em>}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function Bubble({ customer = false, children }) {
  return (
    <div className={`as-message ${customer ? "as-customer" : "as-ai"}`}>
      {!customer && <span className="as-avatar"><Bot size={14} /></span>}
      <div className="as-bubble">{children}</div>
    </div>
  );
}

function AutoChatDemo() {
  const [tab, setTab] = useState("booking");
  const [serviceId, setServiceId] = useState("valet");
  const [capacity, setCapacity] = useState(1);
  const [selectedTime, setSelectedTime] = useState(840);
  const [bookings, setBookings] = useState(initialBookings);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [booked, setBooked] = useState(false);
  const [quote, setQuote] = useState({ name: "", phone: "", vehicle: "", damage: "" });
  const [photoName, setPhotoName] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);
  const service = services.find((item) => item.id === serviceId) || services[0];
  const available = slotIsFree(selectedTime, service.minutes, capacity, bookings);
  const canBook = available && customer.name.trim() && customer.phone.trim();
  const canQuote = quote.name.trim() && quote.phone.trim() && quote.vehicle.trim() && quote.damage.trim() && photoName;

  function submitBooking(event) {
    event.preventDefault();
    if (!canBook || booked) return;
    setBookings((current) => [...current, { start: selectedTime, end: selectedTime + service.minutes }]);
    setBooked(true);
  }
  function submitQuote(event) {
    event.preventDefault();
    if (canQuote) setQuoteSent(true);
  }

  return (
    <div className="as-demo" aria-label="Interactive auto services sample chat">
      <div className="as-demo-head">
        <span className="as-demo-logo"><CarFront size={22} /></span>
        <div className="as-demo-brand"><strong>Oakline Auto Care</strong><small><i />Bellbee Ai assistant</small></div>
        <span className="as-demo-tag">DEMO</span>
      </div>
      <div className="as-tabs" role="group" aria-label="Choose a demo">
        {[
          ["booking", CalendarDays, "Book a slot"],
          ["quote", ClipboardList, "Get a quote"],
          ["capacity", CarFront, "Capacity"],
          ["hours", Clock3, "Hours"],
        ].map(([id, Icon, label]) => (
          <button key={id} type="button" className={tab === id ? "active" : ""} aria-pressed={tab === id} onClick={() => setTab(id)}>
            <Icon size={15}/><span>{label}</span>
          </button>
        ))}
      </div>
      <div className="as-chat" aria-live="polite">
        <span className="as-day">Illustrative conversation · Not real customers</span>
        {tab === "booking" && (
          <>
            <Bubble customer>Can I bring my van in for a full valet on Friday?</Bubble>
            <Bubble>Sure! Here's a sample booking form using our service length and available bays.</Bubble>
            <form className="as-demo-panel" onSubmit={submitBooking}>
              <div className="as-panel-head"><CalendarCheck size={18}/><strong>Service booking</strong><small>DEMO</small></div>
              <label className="as-field">Service
                <select value={serviceId} disabled={booked} onChange={(e) => {setServiceId(e.target.value);}}>
                  {services.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select>
              </label>
              <div className="as-service-info"><span><Clock3 size={14}/>{service.minutes} minutes</span><strong>{service.price}</strong></div>
              <div className="as-panel-sub"><strong>Friday · Example times</strong><span>Capacity: {capacity}</span></div>
              <div className="as-slot-grid">
                {slots.map((slot) => {
                  const free = slotIsFree(slot.start, service.minutes, capacity, bookings);
                  return <button type="button" key={slot.start} disabled={!free || booked} className={selectedTime === slot.start && free ? "chosen" : ""} onClick={() => setSelectedTime(slot.start)}>
                    {slot.label}<small>{free ? "Available" : "Unavailable"}</small>
                  </button>;
                })}
              </div>
              <p className="as-small-note">These are sample slots, not a live calendar. Change the capacity in the Capacity tab.</p>
              {!booked ? (
                <>
                  <div className="as-two-fields">
                    <label className="as-field">Name<input required maxLength={70} placeholder="Your name" value={customer.name} onChange={(e) => setCustomer((v) => ({...v, name: e.target.value}))}/></label>
                    <label className="as-field">Phone<input required type="tel" maxLength={30} placeholder="Phone number" value={customer.phone} onChange={(e) => setCustomer((v) => ({...v, phone: e.target.value}))}/></label>
                  </div>
                  <button type="submit" className="as-demo-submit" disabled={!canBook}>Request sample booking <ArrowRight size={16}/></button>
                </>
              ) : (
                <div className="as-demo-success" role="status">
                  <CheckCircle2 size={24}/><strong>Sample booking requested</strong>
                  <p>Awaiting business confirmation. No real booking was made.</p>
                  <button type="button" onClick={() => {setBooked(false); setSelectedTime(900);}}>Try another slot</button>
                </div>
              )}
            </form>
          </>
        )}
        {tab === "quote" && (
          <>
            <Bubble customer>How much would it cost to fix a dent in my car door?</Bubble>
            <Bubble>I can collect the details for a quote request. Our team will review them and follow up.</Bubble>
            <form className="as-demo-panel" onSubmit={submitQuote}>
              <div className="as-panel-head"><ClipboardList size={18}/><strong>Quote request</strong><small>DEMO</small></div>
              {!quoteSent ? (
                <>
                  <div className="as-two-fields">
                    <label className="as-field">Name<input required maxLength={70} placeholder="Your name" value={quote.name} onChange={(e) => setQuote((v) => ({...v, name: e.target.value}))}/></label>
                    <label className="as-field">Phone<input required type="tel" maxLength={30} placeholder="Phone number" value={quote.phone} onChange={(e) => setQuote((v) => ({...v, phone: e.target.value}))}/></label>
                  </div>
                  <label className="as-field">Vehicle details<input required maxLength={120} placeholder="e.g. Ford Transit 2020" value={quote.vehicle} onChange={(e) => setQuote((v) => ({...v, vehicle: e.target.value}))}/></label>
                  <label className="as-field">What needs attention?<textarea required maxLength={400} rows={3} placeholder="Describe the dent or repair" value={quote.damage} onChange={(e) => setQuote((v) => ({...v, damage: e.target.value}))}/></label>
                  <label className="as-field">Photo of the damage<input required type="file" accept="image/*" onChange={(e) => setPhotoName(e.target.files?.[0]?.name || "")}/></label>
                  {photoName && <p className="as-file-name"><ImageIcon size={14}/>{photoName}</p>}
                  <p className="as-small-note">Example only. The photo is not uploaded or stored.</p>
                  <button type="submit" className="as-demo-submit" disabled={!canQuote}>Create sample lead <ArrowRight size={16}/></button>
                </>
              ) : (
                <div className="as-demo-success" role="status">
                  <CheckCircle2 size={25}/><strong>Sample lead created</strong>
                  <p>New lead · {quote.vehicle}. Your team would review the details and contact the customer. No data was sent.</p>
                  <button type="button" onClick={() => {setQuoteSent(false); setPhotoName("");}}>Start another example</button>
                </div>
              )}
            </form>
          </>
        )}
        {tab === "capacity" && (
          <>
            <Bubble customer>Can two cars be booked at the same time?</Bubble>
            <Bubble>Your business sets how many customers can be served together. Try changing the example capacity.</Bubble>
            <div className="as-demo-panel">
              <div className="as-panel-head"><Settings2 size={18}/><strong>Booking capacity</strong><small>DEMO</small></div>
              <label className="as-field">Customers at the same time
                <select value={capacity} onChange={(e) => {setCapacity(Number(e.target.value)); setBooked(false);}}>
                  <option value={1}>1 customer / bay</option>
                  <option value={2}>2 customers / bays</option>
                  <option value={3}>3 customers / bays</option>
                </select>
              </label>
              <div className="as-capacity-overview">
                {slots.slice(0, 6).map((slot) => {
                  const free = slotIsFree(slot.start, 30, capacity, bookings);
                  return <div key={slot.start} className="as-capacity-row"><span>{slot.label}</span><div><i className={free ? "free" : "busy"}/>{free ? "Room available" : "Full"}</div></div>;
                })}
              </div>
              <p className="as-small-note">This illustration checks 30-minute visits. Longer services can block additional sample times. Existing bookings are fictional.</p>
            </div>
          </>
        )}
        {tab === "hours" && (
          <>
            <Bubble customer>Are you open on the bank holiday Monday?</Bubble>
            <Bubble>I'll check our example weekly hours and holiday exceptions.</Bubble>
            <div className="as-demo-panel">
              <div className="as-panel-head"><Clock3 size={18}/><strong>Example opening hours</strong><small>DEMO</small></div>
              {[["Monday – Friday", "9 AM – 5 PM"],["Saturday", "9 AM – 3 PM"],["Sunday", "Closed"]].map(([day, hours]) => (
                <div className="as-hours-row" key={day}><span>{day}</span><strong>{hours}</strong></div>
              ))}
              <div className="as-holiday"><XCircle size={16}/>Bank holiday Monday: Closed</div>
            </div>
            <Bubble>In this example, we're closed on the bank holiday. Your AI only uses the business hours you provide.</Bubble>
          </>
        )}
      </div>
      <div className="as-demo-foot"><ShieldCheck size={15}/>Frontend demo only — no bookings, leads or messages are sent.</div>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return <div className="as-faq-list">{faqs.map(([question, answer], index) => (
    <article className={`as-faq ${open === index ? "open" : ""}`} key={question}>
      <h3><button type="button" aria-expanded={open === index} aria-controls={`as-faq-${index}`} onClick={() => setOpen(open === index ? -1 : index)}>{question}<ChevronDown size={19}/></button></h3>
      <div id={`as-faq-${index}`} hidden={open !== index}><p>{answer}</p></div>
    </article>
  ))}</div>;
}

export default function AutoServicesPage() {
  const pageRef = useRef(null);
  useGSAP(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".as-hero-copy > *", {opacity: 0, y: 22, duration: .75, stagger: .1, ease: "power2.out"});
    gsap.from(".as-demo", {opacity: 0, y: 28, scale: .975, duration: .9, delay: .15, ease: "power3.out"});
    gsap.to(".as-orb", {rotation: 360, duration: 65, repeat: -1, ease: "none"});
    gsap.to(".as-float", {y: -8, duration: 3, yoyo: true, repeat: -1, stagger: .5, ease: "sine.inOut"});
  }, {scope: pageRef});

  return (
    <main className="as-page" ref={pageRef}>
      <section className="as-hero">
        <span className="as-orb as-orb-lavender" aria-hidden="true"/><span className="as-orb as-orb-yellow" aria-hidden="true"/>
        <div className="as-container as-hero-grid">
          <div className="as-hero-copy">
            <span className="as-pill"><CarFront size={17}/>CAR WASH & AUTO SERVICES</span>
            <h1>Take bookings and quote requests in chat <em>while you work.</em></h1>
            <p>If customers message your car wash or garage on WhatsApp, Instagram or Messenger, Bellbee Ai answers questions, offers slots around your hours and capacity, and collects the details you need for quote requests. Your team follows up from one place.</p>
            <div className="as-hero-actions"><Link to="/signup" className="as-btn as-primary">Start with free credit <ArrowRight size={17}/></Link><a href="#as-how" className="as-btn as-outline">See how it works</a></div>
            <div className="as-trust"><span><CheckCircle2 size={16}/>Slots around your hours</span><span><CheckCircle2 size={16}/>Quote requests</span><span><CheckCircle2 size={16}/>Human handoff</span></div>
          </div>
          <div className="as-hero-visual"><span className="as-float as-float-top"><Sparkles size={15}/>Bookings without phone calls</span><AutoChatDemo/><span className="as-float as-float-bottom"><Check size={15}/>Your team stays in control</span></div>
        </div>
      </section>

      <section className="as-section" id="as-benefits"><div className="as-container">
        <Heading label="WHAT IT HELPS WITH" title="Less time on calls." accent="More time on the job." description="Help customers find service details, available times and the right way to request a quote."/>
        <div className="as-benefits-grid">{benefits.map(([Icon, title, text], index) => <article className="as-card as-benefit" key={title}><span className={`as-icon as-icon-${["lavender","yellow","coral","green"][index % 4]}`}><Icon size={23}/></span><small className="as-card-num">0{index + 1}</small><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="as-section as-light" id="as-how"><div className="as-container">
        <Heading label="HOW IT WORKS" title="From service list" accent="to bookings in chat." description="Set up your services and booking rules, add the information your AI needs and connect a channel."/>
        <div className="as-steps-grid">{steps.map(([number, Icon, title, text], index) => <article className="as-card as-step" key={number}><span className="as-step-number">{number}</span><span className={`as-icon as-icon-${["lavender","yellow","coral","green"][index]}`}><Icon size={24}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        <div className="as-workflow"><div className="as-workflow-copy"><span className="as-kicker">BOOKINGS & QUOTES</span><h2>Two kinds of request. <em>One place to follow up.</em></h2><p>Let the AI collect booking details and quote enquiries during busy hours. Your team reviews requests, confirms bookings and contacts customers about quotes.</p><Link to="/appointment-booking" className="as-text-link">Explore appointment booking <ArrowUpRight size={17}/></Link></div>
          <div className="as-workflow-board"><div className="as-board-title"><ClipboardList size={20}/><strong>Example request inbox</strong><span>DEMO</span></div><div className="as-request-row"><span className="as-icon as-icon-lavender"><CalendarCheck size={20}/></span><div><strong>Full valet · Friday</strong><small>Booking request · Awaiting confirmation</small></div><span className="as-request-status">New</span></div><div className="as-request-row"><span className="as-icon as-icon-yellow"><FileImage size={20}/></span><div><strong>Door dent · Ford Transit</strong><small>Quote lead · Needs team follow-up</small></div><span className="as-request-status">New</span></div><div className="as-request-row"><span className="as-icon as-icon-green"><CheckCircle2 size={20}/></span><div><strong>Exterior wash</strong><small>Example booking · Confirmed</small></div><span className="as-request-status as-request-done">Done</span></div><p><ShieldCheck size={15}/>Illustration only — not connected to a live inbox</p></div>
        </div>
      </div></section>

      <section className="as-section" id="as-day"><div className="as-container">
        <Heading label="A DAY IN THE CHAT" title="Questions come in." accent="Work keeps moving." description="Examples of conversations an auto business might receive. These are fictional examples, not real customers."/>
        <div className="as-stories-grid">{stories.map(([Icon, time, title, customer, reply, link], index) => <article className={`as-card as-story ${index === 0 ? "as-story-first" : ""}`} key={title}><div className="as-story-top"><span><Clock3 size={13}/>{time}</span><span className="as-story-icon"><Icon size={20}/></span></div><h3>{title}</h3><div className="as-story-quote"><MessageCircle size={16}/>“{customer}”</div><p>{reply}</p><Link to={link}>How it works <ArrowUpRight size={16}/></Link></article>)}</div>
      </div></section>

      <section className="as-section as-light" id="as-setup"><div className="as-container">
        <Heading label="WHAT TO ADD FIRST" title="Give your AI the details." accent="It handles the questions." description="Bellbee Ai only knows what you provide. Start with these four things."/>
        <div className="as-setup-grid">{setup.map(([Icon, title, text], index) => <article className="as-card as-setup" key={title}><span className={`as-icon as-icon-${["yellow","lavender","coral","green"][index]}`}><Icon size={23}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="as-section" id="as-limits"><div className="as-container">
        <Heading label="GOOD TO KNOW" title="What you need." accent="What it doesn't do." description="The AI uses your information and hands work back to your team where a person is needed."/>
        <div className="as-limits-grid"><article className="as-limits as-limits-yes"><h3><CheckCircle2 size={24}/>What you need</h3><ul><li><Check size={17}/>Services and hours added in AI Brain.</li><li><Check size={17}/>A connected WhatsApp, Instagram or Messenger channel.</li><li><Check size={17}/>For quote requests, a request type in AI Brain → Requests.</li></ul></article><article className="as-limits as-limits-no"><h3><ShieldCheck size={24}/>What it does not do</h3><ul><li><XCircle size={17}/>It does not look up vehicles or manage job cards.</li><li><XCircle size={17}/>It does not track repair progress for customers.</li><li><XCircle size={17}/>Bookings do not collect deposits or payments.</li><li><XCircle size={17}/>It does not automatically follow up on quotes. Your team does that.</li></ul></article></div>
        <div className="as-handoff"><Headphones size={22}/><p><strong>A person can take over any chat.</strong> Your team can step in from the Bellbee inbox, and your AI hands over when a customer asks for someone.</p></div>
      </div></section>

      <section className="as-section as-light" id="as-faq"><div className="as-container as-faq-layout"><div><Heading label="QUESTIONS" title="Quick questions." accent="Clear answers." description="The practical details about booking capacity, quote requests, photos and reminders."/><div className="as-faq-note"><CarFront size={29}/><span>Less time on the phone. More time with customers.</span></div></div><FAQ/></div></section>

      <section className="as-section" id="as-related"><div className="as-container"><Heading label="RELATED" title="More ways Bellbee" accent="can help."/><div className="as-related-grid">{related.map(([Icon, title, text, to]) => <Link className="as-related" to={to} key={title}><span className="as-related-icon"><Icon size={24}/></span><h3>{title}</h3><p>{text}</p><span className="as-related-arrow"><ArrowUpRight size={19}/></span></Link>)}</div></div></section>

      <section className="as-cta-section"><div className="as-container"><div className="as-cta"><div><span className="as-cta-kicker"><Sparkles size={15}/>GET STARTED WITH BELLBEE AI</span><h2>Keep the bays busy. <em>We'll help with the messages.</em></h2><p>Start with free credit. No credit card required.</p></div><Link to="/signup" className="as-btn as-primary">Start with free credit <ArrowRight size={17}/></Link></div></div></section>
    </main>
  );
}
