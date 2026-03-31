import React from 'react';

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

const MobileButton: React.FC<MobileButtonProps> = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button 
      className={`mobile-button mobile-button--${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default MobileButton;
