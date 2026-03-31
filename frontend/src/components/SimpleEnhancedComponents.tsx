import React from 'react';

/**
 * Simple Enhanced Components for PyMastery
 * Contains basic enhanced UI components
 */

export const SimpleCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}> = ({ children, title, subtitle }) => {
  return (
    <div className="simple-card">
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export const SimpleButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false, 
  onClick 
}) => {
  return (
    <button
      className={`simple-button simple-button--${variant} simple-button--${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="button-spinner">⟳</span>
      ) : (
        children
      )}
    </button>
  );
};

export const SimpleInput: React.FC<{
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}> = ({ label, placeholder, type = 'text', value, onChange, error }) => {
  return (
    <div className="simple-input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`simple-input ${error ? 'simple-input--error' : ''}`}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export const SimpleAlert: React.FC<{
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: () => void;
}> = ({ children, type = 'info', dismissible = false, onDismiss }) => {
  return (
    <div className={`simple-alert simple-alert--${type}`}>
      <div className="alert-content">
        {children}
      </div>
      {dismissible && (
        <button className="alert-dismiss" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
};

export const SimpleLoader: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  return (
    <div className={`simple-loader simple-loader--${size}`}>
      <div className="loader-spinner"></div>
    </div>
  );
};

export default SimpleCard;
