import './DashboardUI.css';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowRight,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useOptionalDashboardToast } from './DashboardToastProvider';

// Multiple popups should not unlock page scrolling until the last one closes.
let mountedModalCount = 0;
let overflowBeforeModals = '';

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="dp-page-header">
      <div className="dp-page-heading-copy">
        {eyebrow && <p className="dp-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="dp-page-description">{description}</p>}
      </div>
      {(actions || children) && (
        <div className="dp-header-actions">{actions || children}</div>
      )}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, note, accent = 'coral' }) {
  return (
    <article className="dp-stat-card">
      <span className={`dp-stat-icon ${accent}`}>
        {Icon && <Icon size={19} />}
      </span>
      <p>{label}</p>
      <strong>{value === null || value === undefined ? '—' : value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

export function StatGrid({ children, columns = 4 }) {
  return <div className={`dp-stats-grid dp-stats-${columns}`}>{children}</div>;
}

export function Tabs({ items, active, onChange }) {
  return (
    <div className="dp-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={active === item}
          className={active === item ? 'active' : ''}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, buttonText, onAction }) {
  return (
    <div className="dp-empty-state">
      <div className="dp-empty-icon">{Icon && <Icon size={27} />}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {buttonText && (
        <button type="button" className="dp-primary-button" onClick={onAction}>
          <Plus size={15} />
          {buttonText}
        </button>
      )}
    </div>
  );
}

export function Panel({ children, className = '' }) {
  return <section className={`dp-panel ${className}`}>{children}</section>;
}

export function SearchInput({ placeholder = 'Search...', value, onChange }) {
  return (
    <label className="dp-search-input">
      <Search size={16} aria-hidden="true" />
      <input type="search" placeholder={placeholder} value={value} onChange={onChange} />
    </label>
  );
}

// Portal places the popup on <body>, ABOVE the dashboard header, sidebar,
// blur layers, and overflow containers. React context still works normally.
export function Modal({ title, description, onClose, children, footer, error }) {
  const titleId = useId();
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;

    if (mountedModalCount === 0) {
      overflowBeforeModals = document.body.style.overflow;
    }
    mountedModalCount += 1;
    document.body.style.overflow = 'hidden';

    closeRef.current?.focus();

    function isTopmost() {
      const overlays = document.querySelectorAll('.bb-dashboard-modal-portal');
      return overlays[overlays.length - 1] === overlayRef.current;
    }

    function handleKeyDown(event) {
      if (!isTopmost()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        overlayRef.current?.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter((node) => node.getClientRects().length > 0);

      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      mountedModalCount = Math.max(0, mountedModalCount - 1);
      if (mountedModalCount === 0) {
        document.body.style.overflow = overflowBeforeModals;
      }
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.();
    };
  }, []);

  return createPortal(
    <div
      ref={overlayRef}
      className="dp-modal-backdrop bb-dashboard-modal-portal bb-user-premium"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <section
        className="dp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="dp-modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="dp-modal-close"
            onClick={() => onCloseRef.current?.()}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>

        <div className="dp-modal-body">
          {error && (
            <div className="dp-modal-error" role="alert">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}
          {children}
        </div>

        {footer && <footer className="dp-modal-footer">{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

export function FormField({ label, hint, error, children, className = '' }) {
  return (
    <label className={`dp-form-field ${className} ${error ? 'dp-form-field-invalid' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? (
        <small className="dp-field-error" role="alert">
          <AlertCircle size={13} /> {error}
        </small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}

export function FieldInput(props) {
  return <input className="dp-field-control" {...props} />;
}

export function FieldSelect({ children, ...props }) {
  return <select className="dp-field-control" {...props}>{children}</select>;
}

export function FieldTextarea(props) {
  return <textarea className="dp-field-control dp-field-textarea" {...props} />;
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button type="button" className="dp-primary-button" {...props}>
      {children}
      <ArrowRight size={14} />
    </button>
  );
}

// Keep compatibility with all legacy pages and global toast provider.
export function useNotice() {
  const toast = useOptionalDashboardToast();
  const [notice, setNotice] = useState('');

  const showNotice = useCallback((message, type) => {
    const text = String(message?.message || message || '').trim();
    if (!text) return;
    if (toast) toast.auto(text, type);
    else setNotice(text);
  }, [toast]);

  const Notice = toast || !notice ? null : (
    <div className="dp-inline-notice" role="status">
      {notice}
      <button type="button" onClick={() => setNotice('')}>Dismiss</button>
    </div>
  );

  return { showNotice, Notice };
}
