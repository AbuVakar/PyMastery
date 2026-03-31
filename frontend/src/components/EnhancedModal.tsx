import React from 'react';

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

const EnhancedModal: React.FC<EnhancedModalProps> = ({ isOpen, onClose, children, title, size = 'medium' }) => {
  if (!isOpen) return null;

  return (
    <div className="enhanced-modal-overlay" onClick={onClose}>
      <div className={`enhanced-modal enhanced-modal--${size}`} onClick={(e) => e.stopPropagation()}>
        {title && <div className="enhanced-modal-header">{title}</div>}
        <div className="enhanced-modal-content">{children}</div>
        <button className="enhanced-modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default EnhancedModal;
