import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, theme = 'light' }) => {
  return (
    <div className={`theme-provider theme--${theme}`}>
      {children}
    </div>
  );
};

export default ThemeProvider;
