import React from 'react';

interface EnhancedCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({ children, title, className = '' }) => {
  return (
    <div className={`enhanced-card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default EnhancedCard;
