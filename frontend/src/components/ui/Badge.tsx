import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'medium', className = '' }) => {
  return (
    <span className={`badge badge--${variant} badge--${size} ${className}`}>
      {children}
    </span>
  );
};

export { Badge };
