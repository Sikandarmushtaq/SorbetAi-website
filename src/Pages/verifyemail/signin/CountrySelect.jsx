import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe2, Search } from 'lucide-react';
import worldCountries from 'world-countries';

/* =========================================
   COUNTRIES (built once from world-countries)
========================================= */

const PINNED_CODES = ['PK', 'GB', 'US'];

// Removes accents and lowercases, so "Åland" can be found by typing "aland".
function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Longest shared start of several strings: ["201", "202"] -> "20".
function getCommonPrefix(values) {
  if (!values.length) return '';

  let prefix = values[0];

  for (const value of values) {
    while (!value.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }

  return prefix;
}

// Builds the dial code from the idd data.
// One suffix  -> root + suffix   (Pakistan: +9 + 2 = +92)
// Many suffix -> root + shared prefix (US/Canada: +1, Russia: +7)
// No root     -> empty string (country is skipped)
function getDialCode(idd) {
  if (!idd || !idd.root) return '';

  const suffixes = idd.suffixes || [];

  if (suffixes.length === 0) return idd.root;
  if (suffixes.length === 1) return `${idd.root}${suffixes[0]}`;

  return `${idd.root}${getCommonPrefix(suffixes)}`;
}

const allCountries = worldCountries
  .map((country) => {
    const dialCode = getDialCode(country.idd);

    return {
      code: country.cca2,
      name: country.name.common,
      dialCode,
      searchName: normalizeText(country.name.common),
      searchDial: dialCode.replace(/\D/g, ''),
    };
  })
  // A country without a dial code cannot be used for the phone field.
  .filter((country) => country.dialCode);

const pinnedCountries = PINNED_CODES.map((code) =>
  allCountries.find((country) => country.code === code)
).filter(Boolean);

const otherCountries = allCountries
  .filter((country) => !PINNED_CODES.includes(country.code))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

export const countries = [...pinnedCountries, ...otherCountries];

// Filters by country name or dial code ("pak", "92", "+44").
function filterCountries(query) {
  const search = normalizeText(query).replace(/^\+/, '');

  if (!search) return countries;

  const isNumber = /^\d+$/.test(search);

  const matches = countries.filter((country) =>
    isNumber
      ? country.searchDial.startsWith(search) ||
        country.searchName.includes(search)
      : country.searchName.includes(search)
  );

  // Names that start with the search text come first.
  return matches.sort(
    (a, b) =>
      Number(b.searchName.startsWith(search)) -
      Number(a.searchName.startsWith(search))
  );
}

// Turns whatever the user typed into the national number only.
// "+92 300 1234567", "0092 300...", "0300 1234567" -> "3001234567"
export function normalizePhone(rawPhone, dialCode) {
  const dialDigits = dialCode.replace(/\D/g, '');
  const maxLength = 15 - dialDigits.length;
  const typed = rawPhone.trim();

  let digits = typed.replace(/\D/g, '');

  if (typed.startsWith('+') && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  } else if (digits.startsWith(`00${dialDigits}`)) {
    digits = digits.slice(dialDigits.length + 2);
  } else if (digits.length > maxLength && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  // Italy's leading zero is part of the international number.
  if (dialCode !== '+39') digits = digits.replace(/^0+/, '');

  return digits;
}

export function isPhoneValid(nationalNumber, dialCode) {
  const maxLength = 15 - dialCode.replace(/\D/g, '').length;

  return nationalNumber.length >= 6 && nationalNumber.length <= maxLength;
}

/* =========================================
   COUNTRY SELECT (search + keyboard support)
========================================= */

export function CountrySelect({ value, onChange, hasError }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = countries.find((country) => country.code === value);
  const results = useMemo(() => filterCountries(query), [query]);
  const activeCountry = results[activeIndex];

  const openMenu = () => {
    setQuery('');
    setActiveIndex(
      Math.max(
        0,
        countries.findIndex((country) => country.code === value)
      )
    );
    setOpen(true);
  };

  const closeMenu = (returnFocus = true) => {
    setOpen(false);
    setQuery('');

    if (returnFocus) triggerRef.current?.focus();
  };

  const handleSelect = (country) => {
    onChange(country.code);
    closeMenu();
  };

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // Focus the search box when the list opens.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted option visible while using the arrow keys.
  useEffect(() => {
    if (!open) return;

    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, query]);

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      openMenu();
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeCountry) handleSelect(activeCountry);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'Tab') {
      closeMenu(false);
    }
  };

  return (
    <div className="signup-country" ref={wrapRef}>
      <button
        ref={triggerRef}
        id="signup-country"
        type="button"
        className={`signup-country-trigger ${open ? 'is-open' : ''} ${
          hasError ? 'has-error' : ''
        }`}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="signup-country-listbox"
      >
        <Globe2 size={17} />

        <span
          className={`signup-country-value ${selected ? '' : 'is-placeholder'}`}
        >
          {selected ? selected.name : 'Select your country'}
        </span>

        <ChevronDown size={17} className="signup-country-chevron" />
      </button>

      {open && (
        <div className="signup-country-menu">
          <div className="signup-country-search">
            <Search size={16} />

            <input
              ref={searchRef}
              type="text"
              value={query}
              placeholder="Search country or code..."
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              role="combobox"
              aria-expanded="true"
              aria-controls="signup-country-listbox"
              aria-activedescendant={
                activeCountry
                  ? `signup-country-option-${activeCountry.code}`
                  : undefined
              }
              aria-label="Search countries"
            />
          </div>

          <ul
            ref={listRef}
            id="signup-country-listbox"
            className="signup-country-list"
            role="listbox"
          >
            {results.length === 0 && (
              <li className="signup-country-empty">No countries found</li>
            )}

            {results.map((country, index) => {
              const isSelected = country.code === value;
              const isActive = index === activeIndex;
              const showDivider =
                !query && index === pinnedCountries.length - 1;

              return (
                <li
                  key={country.code}
                  id={`signup-country-option-${country.code}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive}
                  className={`signup-country-option ${
                    isActive ? 'is-active' : ''
                  } ${isSelected ? 'is-selected' : ''} ${
                    showDivider ? 'has-divider' : ''
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(country)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="signup-country-name">{country.name}</span>
                  <span className="signup-country-dial">
                    {country.dialCode}
                  </span>
                  {isSelected && <Check size={16} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

