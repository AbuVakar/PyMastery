import React from 'react';

/**
 * Responsive Components for PyMastery
 * Contains mobile-first responsive components
 */

export const ResponsiveModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="responsive-modal-overlay" onClick={onClose}>
      <div className="responsive-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export const ResponsiveCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}> = ({ children, title, variant = 'default' }) => {
  return (
    <div className={`responsive-card responsive-card--${variant}`}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  gap?: string;
}> = ({ children, columns = 1, gap = '1rem' }) => {
  const getGridStyle = () => {
    if (typeof columns === 'number') {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      };
    }
    
    return {
      display: 'grid',
      gap,
      gridTemplateColumns: `repeat(${columns.xs || 1}, 1fr)`,
      '@media (min-width: 640px)': {
        gridTemplateColumns: `repeat(${columns.sm || columns.xs || 1}, 1fr)`
      },
      '@media (min-width: 768px)': {
        gridTemplateColumns: `repeat(${columns.md || columns.sm || columns.xs || 1}, 1fr)`
      },
      '@media (min-width: 1024px)': {
        gridTemplateColumns: `repeat(${columns.lg || columns.md || columns.sm || columns.xs || 1}, 1fr)`
      }
    };
  };

  return (
    <div className="responsive-grid" style={getGridStyle()}>
      {children}
    </div>
  );
};

export const ResponsiveNavigation: React.FC<{
  items: Array<{ label: string; href: string; active?: boolean }>;
}> = ({ items }) => {
  return (
    <nav className="responsive-navigation">
      <div className="nav-brand">PyMastery</div>
      <div className="nav-menu">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`nav-item ${item.active ? 'nav-item--active' : ''}`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <button className="nav-toggle">☰</button>
    </nav>
  );
};

export default ResponsiveModal;
