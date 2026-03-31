import React, { createContext, useContext, ReactNode } from 'react';

interface AccessibilityContextType {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  const [isReducedMotion, setIsReducedMotion] = React.useState(false);

  const toggleHighContrast = () => setIsHighContrast(!isHighContrast);
  const toggleReducedMotion = () => setIsReducedMotion(!isReducedMotion);

  return (
    <AccessibilityContext.Provider value={{
      isHighContrast,
      isReducedMotion,
      toggleHighContrast,
      toggleReducedMotion
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider;
