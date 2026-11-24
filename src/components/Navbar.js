
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CalendarDays,
  CarFront,
  ChevronDown,
  CircleHelp,
  Globe2,
  Handshake,
  Mail,
  Megaphone,
  Menu,
  MessagesSquare,
  Newspaper,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  UserRoundPlus,
  UsersRound,
  UtensilsCrossed,
  X,
  BookOpenText,
} from 'lucide-react';

import {
  // FaAndroid,
  FaFacebookMessenger,
  FaInstagram,
  FaWhatsapp,
} from 'react-icons/fa';

import './Navbar.css';

/*
  Every destination below is a LOCAL React Router path.
  Create matching pages/routes in App.jsx when building them.
*/

const navigation = [
  {
    label: 'Product',
    groups: [
      {
        title: 'CHANNELS',
        items: [
          {
            title: 'WhatsApp AI agent',
            description: 'Answers customers on your WhatsApp Business number.',
            to: '/whatsapp-ai-agent',
            icon: FaWhatsapp,
            color: 'whatsapp',
          },
          {
            title: 'Instagram',
            description: 'Instagram messages answered by the same AI.',
            to: '/instagram-ai-automation',
            icon: FaInstagram,
            color: 'instagram',
          },
          {
            title: 'Messenger',
            description: 'Facebook Messenger chats answered by the same AI.',
            to: '/messenger-ai-automation',
            icon: FaFacebookMessenger,
            color: 'messenger',
          },
          {
            title: 'Website chat',
            description: 'A chat window for your website, run by the same AI.',
            to: '/website-chat',
            icon: Globe2,
            color: 'lavender',
          },
          {
            title: 'One inbox',
            description: 'Every channel in one place, and your team can step in.',
            to: '/omnichannel-messaging',
            icon: MessagesSquare,
            color: 'yellow',
          },
        ],
      },
      {
        title: 'AI & TOOLS',
        items: [
          {
            title: 'AI Assistant',
            description: 'Set up your AI by talking to it. You approve every change.',
            to: '/ai-assistant',
            icon: Bot,
            color: 'coral',
          },
          {
            title: 'AI Brain',
            description: 'Your services, products, hours and answers, all in one place.',
            to: '/ai-brain',
            icon: BrainCircuit,
            color: 'lavender',
          },
          {
            title: 'Human handoff',
            description: 'Hands the chat to your team when a person is needed.',
            to: '/human-handoff',
            icon: Handshake,
            color: 'yellow',
          },
          // {
          //   title: 'Android app',
          //   description: 'Your chats and alerts on your phone.',
          //   to: '/android-app',
          //   icon: FaAndroid,
          //   color: 'green',
          // },
        ],
      },
    ],
  },
  {
    label: 'Solutions',
    groups: [
      {
        title: 'WHAT IT DOES FOR YOU',
        items: [
          {
            title: 'AI customer support',
            description: 'Answers questions from your own business information.',
            to: '/ai-customer-support',
            icon: MessagesSquare,
            color: 'lavender',
          },
          {
            title: 'Orders in chat',
            description: 'Takes orders from your product catalog inside the chat.',
            to: '/orders-in-chat',
            icon: ShoppingBag,
            color: 'coral',
          },
          {
            title: 'Appointment booking',
            description: 'Books, moves and cancels appointments around your hours.',
            to: '/appointment-booking',
            icon: CalendarDays,
            color: 'yellow',
          },
          {
            title: 'Lead capture',
            description: 'Saves enquiries as leads you can follow up.',
            to: '/lead-capture',
            icon: UserRoundPlus,
            color: 'green',
          },
          {
            title: 'WhatsApp campaigns',
            description: 'Send WhatsApp broadcasts to selected customers.',
            to: '/whatsapp-campaigns',
            icon: Megaphone,
            color: 'coral',
          },
        ],
      },
    ],
  },
  {
    label: 'Industries',
    groups: [
      {
        title: 'BUILT FOR YOUR BUSINESS',
        items: [
          {
            title: 'Online shops and retail',
            description: 'Answers shoppers and takes orders in chat.',
            to: '/ai-chat-for-online-shops',
            icon: Store,
            color: 'lavender',
          },
          {
            title: 'Restaurants and cafes',
            description: 'Answers guests and takes bookings in chat.',
            to: '/ai-chat-for-restaurants',
            icon: UtensilsCrossed,
            color: 'yellow',
          },
          {
            title: 'Salons and beauty',
            description: 'Books appointments with the right team member.',
            to: '/ai-chat-for-salons',
            icon: Scissors,
            color: 'coral',
          },
          {
            title: 'Car wash and auto services',
            description: 'Takes bookings and quote requests in chat.',
            to: '/ai-chat-for-auto-services',
            icon: CarFront,
            color: 'green',
          },
        ],
      },
    ],
  },
  {
    label: 'Pricing',
    to: '/pricing',
  },
  {
    label: 'Resources',
    groups: [
      {
        title: 'EXPLORE BELLBEE',
        items: [
          {
            title: 'How it works',
            description: 'See how Bellbee works for your business.',
            to: '/how-it-works',
            icon: BookOpenText,
            color: 'lavender',
          },
          {
            title: 'FAQs',
            description: 'Find answers to common questions.',
            to: '/#faqs',
            icon: CircleHelp,
            color: 'yellow',
          },
          {
            title: 'Blogs',
            description: 'Ideas, tutorials and product updates.',
            to: '/blogs',
            icon: Newspaper,
            color: 'coral',
          },
          {
            title: 'About us',
            description: 'Meet the team and our mission.',
            to: '/about',
            icon: UsersRound,
            color: 'green',
          },
          {
            title: 'Contact',
            description: 'Talk to the Bellbee team.',
            to: '/contact',
            icon: Mail,
            color: 'lavender',
          },
        ],
      },
    ],
  },
];

function DropdownLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className="bbn-dropdown-link"
      onClick={onNavigate}
    >
      <span className={`bbn-link-icon bbn-icon-${item.color}`}>
        <Icon size={21} aria-hidden="true" />
      </span>

      <span className="bbn-link-content">
        <span className="bbn-link-title">{item.title}</span>
        <span className="bbn-link-description">
          {item.description}
        </span>
      </span>

      <ArrowUpRight
        size={15}
        className="bbn-link-arrow"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);

  const navbarRef = useRef(null);
  const location = useLocation();

  function closeAll() {
    setOpenDropdown(null);
    setMobileOpen(false);
    setMobileSection(null);
  }

  function toggleDesktopDropdown(label) {
    setOpenDropdown((previous) =>
      previous === label ? null : label
    );
  }

  function toggleMobileSection(label) {
    setMobileSection((previous) =>
      previous === label ? null : label
    );
  }

  function isActive(menu) {
    if (menu.to) {
      return location.pathname === menu.to;
    }

    return menu.groups.some((group) =>
      group.items.some(
        (item) => location.pathname === item.to
      )
    );
  }

  // Close dropdowns when navigating with browser history.
  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [location.pathname, location.hash]);

  // Close when clicking outside, or pressing Escape.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
        setMobileOpen(false);
        setMobileSection(null);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
        setMobileSection(null);
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <nav
      ref={navbarRef}
      className={`bbn-navbar ${mobileOpen ? 'bbn-mobile-open' : ''}`}
      aria-label="Main navigation"
    >
      <div className="bbn-navbar-bar">

        {/* Brand */}
        <Link
          to="/"
          className="bbn-brand"
          onClick={closeAll}
          aria-label="Bellbee Ai - Home"
        >
          <span className="bbn-brand-text">
            Bellbee<span className="bbn-brand-ai">Ai</span>
          </span>

          <span className="bbn-brand-star" aria-hidden="true">
            ✦
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="bbn-desktop-nav">
          {navigation.map((menu) => {
            const active = isActive(menu);

            if (menu.to) {
              return (
                <Link
                  key={menu.label}
                  to={menu.to}
                  className={`bbn-nav-direct ${
                    active ? 'bbn-nav-active' : ''
                  }`}
                  onMouseEnter={() => setOpenDropdown(null)}
                  onClick={closeAll}
                >
                  {menu.label}
                </Link>
              );
            }

            const expanded = openDropdown === menu.label;

            return (
              <div
                key={menu.label}
                className={`bbn-desktop-item ${
                  expanded ? 'bbn-dropdown-open' : ''
                }`}
                onMouseEnter={() => setOpenDropdown(menu.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  className={`bbn-nav-trigger ${
                    active ? 'bbn-nav-active' : ''
                  }`}
                  aria-expanded={expanded}
                  aria-haspopup="true"
                  aria-controls={`bbn-menu-${menu.label.toLowerCase()}`}
                  onClick={() =>
                    toggleDesktopDropdown(menu.label)
                  }
                >
                  <span>{menu.label}</span>

                  <ChevronDown
                    size={15}
                    strokeWidth={2.2}
                    className="bbn-chevron"
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={`bbn-menu-${menu.label.toLowerCase()}`}
                  className={`bbn-dropdown bbn-dropdown-${menu.label.toLowerCase()}`}
                >
                  <div className="bbn-dropdown-panel">
                    <span
                      className="bbn-dropdown-blob"
                      aria-hidden="true"
                    />

                    <div className="bbn-dropdown-content">
                      {menu.groups.map((group) => (
                        <div
                          className="bbn-dropdown-group"
                          key={group.title}
                        >
                          <div className="bbn-group-heading">
                            <span className="bbn-heading-dot" />
                            {group.title}
                          </div>

                          <div className="bbn-dropdown-items">
                            {group.items.map((item) => (
                              <DropdownLink
                                key={item.to}
                                item={item}
                                onNavigate={closeAll}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop action buttons */}
        <div className="bbn-actions">
          <Link
            to="/signin"
            className="bbn-signin"
            onClick={closeAll}
          >
            Sign in
          </Link>

          <Link
            to="/signup"
            className="bbn-signup"
            onClick={closeAll}
          >
            <Sparkles size={15} aria-hidden="true" />
            Start using free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="bbn-mobile-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-controls="bbn-mobile-navigation"
          aria-expanded={mobileOpen}
          onClick={() => {
            setMobileOpen((previous) => !previous);
            setMobileSection(null);
            setOpenDropdown(null);
          }}
        >
          {mobileOpen ? (
            <X size={23} strokeWidth={2.4} />
          ) : (
            <Menu size={23} strokeWidth={2.4} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div
          id="bbn-mobile-navigation"
          className="bbn-mobile-navigation"
        >
          <div className="bbn-mobile-links">
            {navigation.map((menu) => {
              const active = isActive(menu);

              if (menu.to) {
                return (
                  <Link
                    key={menu.label}
                    to={menu.to}
                    className={`bbn-mobile-direct ${
                      active ? 'bbn-mobile-active' : ''
                    }`}
                    onClick={closeAll}
                  >
                    {menu.label}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                );
              }

              const expanded = mobileSection === menu.label;

              return (
                <div
                  key={menu.label}
                  className={`bbn-mobile-section ${
                    expanded ? 'bbn-mobile-expanded' : ''
                  }`}
                >
                  <button
                    type="button"
                    className={`bbn-mobile-section-trigger ${
                      active ? 'bbn-mobile-active' : ''
                    }`}
                    onClick={() =>
                      toggleMobileSection(menu.label)
                    }
                    aria-expanded={expanded}
                  >
                    <span>{menu.label}</span>
                    <ChevronDown
                      size={18}
                      className="bbn-mobile-chevron"
                      aria-hidden="true"
                    />
                  </button>

                  {expanded && (
                    <div className="bbn-mobile-dropdown">
                      {menu.groups.map((group) => (
                        <div
                          className="bbn-mobile-group"
                          key={group.title}
                        >
                          <p className="bbn-mobile-group-heading">
                            {group.title}
                          </p>

                          {group.items.map((item) => (
                            <DropdownLink
                              key={item.to}
                              item={item}
                              onNavigate={closeAll}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bbn-mobile-actions">
            <Link
              to="/signin"
              className="bbn-mobile-signin"
              onClick={closeAll}
            >
              Sign in
            </Link>

            <Link
              to="/signup"
              className="bbn-mobile-signup"
              onClick={closeAll}
            >
              <Sparkles size={16} aria-hidden="true" />
              Start using free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
