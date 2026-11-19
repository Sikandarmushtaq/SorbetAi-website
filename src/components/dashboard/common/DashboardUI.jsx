import './DashboardUI.css';
import { useState } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="dp-page-header">
      <div className="dp-page-heading-copy">
        {eyebrow && <p className="dp-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="dp-page-description">{description}</p>}
      </div>
      {(actions || children) && <div className="dp-header-actions">{actions || children}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, note, accent = 'coral' }) {
  return (
    <article className="dp-stat-card">
      <span className={`dp-stat-icon ${accent}`}>{Icon && <Icon size={19} />}</span>
      <p>{label}</p>
      <strong>{value}</strong>
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
          type="button"
          role="tab"
          aria-selected={active === item}
          key={item}
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
          <Plus size={15} /> {buttonText}
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
      <span aria-hidden="true">⌕</span>
      <input type="search" placeholder={placeholder} value={value} onChange={onChange} />
    </label>
  );
}

export function Modal({ title, description, onClose, children, footer }) {
  return (
    <div className="dp-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="dp-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="dp-modal-header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="dp-modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>
        <div className="dp-modal-body">{children}</div>
        {footer && <footer className="dp-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function FormField({ label, hint, children, className = '' }) {
  return (
    <label className={`dp-form-field ${className}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
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
  return <button type="button" className="dp-primary-button" {...props}>{children}<ArrowRight size={14} /></button>;
}

// Provides a small local-only confirmation message for frontend prototypes.
export function useNotice() {
  const [notice, setNotice] = useState('');
  const showNotice = (message) => {
    setNotice(message);
  };
  const Notice = notice ? <div className="dp-inline-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>Dismiss</button></div> : null;
  return { showNotice, Notice };
}
