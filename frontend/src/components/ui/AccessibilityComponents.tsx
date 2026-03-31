import React from 'react';

/**
 * Accessibility Components for PyMastery
 * Contains accessibility-focused UI components
 */

export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ children, ariaLabel, ariaDescribedBy, disabled = false, onClick }) => {
  return (
    <button
      className="accessible-button"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const AccessibleInput: React.FC<{
  label: string;
  id: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}> = ({ 
  label, 
  id, 
  type = 'text', 
  placeholder, 
  required = false, 
  error, 
  value, 
  onChange 
}) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="accessible-input-group">
      <label 
        htmlFor={id} 
        className="input-label"
        aria-required={required}
      >
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className="accessible-input"
      />
      {error && (
        <div id={errorId} className="input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export const AccessibleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const modalId = `modal-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div 
      className="accessible-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
    >
      <div className="accessible-modal">
        <div className="modal-header">
          <h2 id={`${modalId}-title`}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            ×
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AccessibleNavigation: React.FC<{
  items: Array<{
    label: string;
    href: string;
    current?: boolean;
  }>;
  ariaLabel?: string;
}> = ({ items, ariaLabel = "Main navigation" }) => {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="accessible-nav">
        {items.map((item, index) => (
          <li key={index}>
            <a
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={item.current ? 'nav-link--current' : ''}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const AccessibleToast: React.FC<{
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}> = ({ message, type = 'info', duration = 5000, onClose }) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose || (() => {}), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div 
      className={`accessible-toast accessible-toast--${type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        {message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="toast-dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ 
  href, 
  children 
}) => {
  return (
    <a 
      href={href} 
      className="skip-link"
      aria-label="Skip to main content"
    >
      {children}
    </a>
  );
};

export default AccessibleButton;
