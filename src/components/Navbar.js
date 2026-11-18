
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const sectionLinks = [
  { label: 'Home', to: '/#home' },
  { label: 'Features', to: '/#features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'FAQs', to: '/#faqs' },
];

const pageLinks = [
  { label: 'Blogs', to: '/blogs' },
  { label: 'About us', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const allLinks = [...sectionLinks, ...pageLinks];

  return (
    <nav
      className={`sticky top-0 z-50 mx-[3vw] mt-[14px] bg-sorbet-green px-3 py-2.5 text-sorbet-cream shadow-sm transition-all duration-300 sm:px-5 lg:px-[26px] ${
        menuOpen
          ? 'rounded-[30px] min-[1200px]:rounded-full'
          : 'rounded-full'
      }`}
    >
      {/* Navbar Header */}
      <div className="relative flex min-h-[44px] items-center justify-between">

        {/* Logo */}
        <Link
          to="/#home"
          onClick={closeMenu}
          className={`shrink-0 text-[22px] font-extrabold tracking-[-0.04em] transition-opacity duration-300 ${
            menuOpen
              ? 'invisible min-[1200px]:visible'
              : 'visible'
          }`}
        >
          sorbet✦
        </Link>

        {/* Desktop Navigation */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 min-[1200px]:flex">
          {allLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="whitespace-nowrap text-[14px] opacity-70 transition-opacity duration-300 hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden shrink-0 items-center gap-2 min-[1200px]:flex">
          <Link
            to="/signin"
            className="rounded-full border-2 border-sorbet-cream px-4 py-2.5 text-[14px] font-semibold transition-transform duration-300 hover:rotate-[-3deg] hover:scale-105"
          >
            Sign in
          </Link>

          <Link
            to="/signup"
            className="whitespace-nowrap rounded-full border-2 border-sorbet-coral bg-sorbet-coral px-5 py-2.5 text-[14px] font-semibold text-sorbet-green transition-transform duration-300 hover:rotate-[-3deg] hover:scale-105"
          >
            Start using free
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="relative z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-sorbet-coral bg-sorbet-coral text-sorbet-green shadow-md transition-transform duration-300 hover:scale-110 hover:rotate-[-5deg] min-[1200px]:hidden"
        >
          {menuOpen ? (
            <X size={24} strokeWidth={2.5} />
          ) : (
            <Menu size={24} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="mt-3 border-t border-sorbet-cream/15 px-2 pb-3 pt-5 min-[1200px]:hidden"
        >
          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            {allLinks.map((link, index) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={closeMenu}
                style={{
                  transitionDelay: `${index * 35}ms`,
                }}
                className="rounded-full px-4 py-3 text-[15px] font-semibold opacity-75 transition-all duration-300 hover:bg-sorbet-cream/10 hover:pl-6 hover:opacity-100"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex flex-col gap-3 px-2 mt-5">
            <Link
              to="/signin"
              onClick={closeMenu}
              className="rounded-full border-2 border-sorbet-cream py-3 text-center text-sm font-semibold transition-transform duration-300 hover:scale-[1.02]"
            >
              Sign in
            </Link>

            <Link
              to="/signup"
              onClick={closeMenu}
              className="rounded-full border-2 border-sorbet-coral bg-sorbet-coral py-3 text-center text-sm font-semibold text-sorbet-green transition-transform duration-300 hover:scale-[1.02]"
            >
              Start using free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
