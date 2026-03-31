import React from 'react';

/**
 * Enhanced Components for PyMastery
 * Contains enhanced UI components with advanced features
 */

export const EnhancedCard: React.FC<{ children: React.ReactNode; title?: string }> = ({ 
  children, 
  title 
}) => {
  return (
    <div className="enhanced-card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export const EnhancedButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}> = ({ children, variant = 'primary', onClick }) => {
  return (
    <button 
      className={`enhanced-button enhanced-button--${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const EnhancedModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="enhanced-modal-overlay" onClick={onClose}>
      <div className="enhanced-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default EnhancedCard;
